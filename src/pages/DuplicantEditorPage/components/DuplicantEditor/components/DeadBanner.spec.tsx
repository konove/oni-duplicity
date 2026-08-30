/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
// test/setup-dom.js registers these at runtime; the import is what tells
// TypeScript that `toBeInTheDocument` exists.
import "@testing-library/jest-dom";

import useDuplicantCondition from "@/services/oni-save/hooks/useDuplicantCondition";
import useBehavior from "@/services/oni-save/hooks/useBehavior";

import DeadBanner from "./DeadBanner";

jest.mock("react-i18next", () => {
  const common = jest.requireActual("@/translations/en/common.json");
  const lookup = (key: string): unknown =>
    key
      .split(".")
      .reduce<any>((node, part) => (node == null ? node : node[part]), common);
  const t = (key: string, options: Record<string, unknown> = {}) => {
    const template = lookup(key);
    if (typeof template !== "string") {
      return options.defaultValue ?? key;
    }
    return template.replace(/{{(\w+)}}/g, (_, name) => String(options[name]));
  };
  const i18n = { language: "en" };
  return {
    useTranslation: () => ({ t, i18n }),
    Trans: ({ i18nKey, children }: { i18nKey: string; children?: any }) =>
      t(i18nKey, { defaultValue: children }),
    withTranslation: () => (C: any) => (props: any) =>
      React.createElement(C, { ...props, t, i18n }),
  };
});

jest.mock("@/services/oni-save/hooks/useBehavior", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/services/oni-save/hooks/useDuplicantCondition", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseBehavior = useBehavior as jest.MockedFunction<typeof useBehavior>;
const mockCondition = useDuplicantCondition as jest.MockedFunction<
  typeof useDuplicantCondition
>;

let revive: jest.Mock;

beforeEach(() => {
  revive = jest.fn();
  mockUseBehavior.mockReturnValue({
    templateData: { name: "Ada" },
    extraData: null,
    onTemplateDataModify: jest.fn(),
    onExtraDataModify: jest.fn(),
  });
  mockCondition.mockReturnValue({ isDead: true, revive });
});

describe("DeadBanner", () => {
  // Almost nobody opens a dead duplicant to adjust their Machinery.
  it("says who died and offers the one thing they came for", () => {
    render(<DeadBanner gameObjectId={1} />);

    expect(screen.getByText(/Ada is/)).toBeInTheDocument();
    expect(screen.getByText("Dead")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revive" })).toBeInTheDocument();
  });

  // The reassuring half, and the half that is actually true: dying costs a
  // duplicant nothing the editor can see.
  it("says what has not been lost", () => {
    render(<DeadBanner gameObjectId={1} />);

    expect(
      screen.getByText("Attributes, traits and skills are untouched."),
    ).toBeInTheDocument();
  });

  it("revives on the button", () => {
    render(<DeadBanner gameObjectId={1} />);

    fireEvent.click(screen.getByRole("button", { name: "Revive" }));

    expect(revive).toHaveBeenCalled();
  });

  // It costs 56px of a screen whose whole premise is fitting in 720, so it is
  // not there when there is nothing to say.
  it("is absent for a living duplicant", () => {
    mockCondition.mockReturnValue({ isDead: false, revive });

    const { container } = render(<DeadBanner gameObjectId={1} />);

    expect(container).toBeEmptyDOMElement();
  });
});
