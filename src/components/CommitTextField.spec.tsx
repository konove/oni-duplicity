/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import CommitTextField from "./CommitTextField";

// The point of this component is that it does NOT report every keystroke - the
// save state is mutated on commit, so a per-keystroke dispatch would push one
// undo entry per letter typed.
describe("CommitTextField", () => {
  it("does not commit while typing", () => {
    const onCommit = jest.fn();
    render(<CommitTextField value="Ada" onCommit={onCommit} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Adam" },
    });

    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits the edited value on blur", () => {
    const onCommit = jest.fn();
    render(<CommitTextField value="Ada" onCommit={onCommit} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Adam" } });
    fireEvent.blur(input);

    expect(onCommit).toHaveBeenCalledWith("Adam");
  });

  it("does not commit a value equal to the one it was given", () => {
    const onCommit = jest.fn();
    render(<CommitTextField value="Ada" onCommit={onCommit} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Ada" } });
    fireEvent.blur(input);

    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits on Enter", () => {
    const onCommit = jest.fn();
    render(<CommitTextField value="Ada" onCommit={onCommit} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Adam" } });
    fireEvent.keyPress(input, { key: "Enter", code: "Enter", charCode: 13 });

    expect(onCommit).toHaveBeenCalledWith("Adam");
  });

  // The component holds `commit` in a ref specifically so the unmount effect can
  // call the latest one without re-running on every render. Easy to "simplify"
  // into a bug.
  it("commits a pending edit when unmounted", () => {
    const onCommit = jest.fn();
    const { unmount } = render(
      <CommitTextField value="Ada" onCommit={onCommit} />,
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Adam" },
    });
    unmount();

    expect(onCommit).toHaveBeenCalledWith("Adam");
  });
});
