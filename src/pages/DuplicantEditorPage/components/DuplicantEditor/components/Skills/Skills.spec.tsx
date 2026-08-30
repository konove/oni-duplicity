/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
// test/setup-dom.js registers these at runtime; the import is what tells
// TypeScript that `toBeInTheDocument` exists.
import "@testing-library/jest-dom";

import useBehavior from "@/services/oni-save/hooks/useBehavior";

import Skills from "./Skills";

jest.mock("react-i18next", () => {
  const common = jest.requireActual("@/translations/en/common.json");
  const oni = jest.requireActual("@/translations/en/oni.json");
  const lookup = (key: string): unknown => {
    const [root, path] = key.startsWith("oni:")
      ? [oni, key.slice("oni:".length)]
      : [common, key];
    return path
      .split(".")
      .reduce<any>((node, part) => (node == null ? node : node[part]), root);
  };
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

jest.mock("react-redux", () => ({ useSelector: () => [] }));

// Connected, and only the experience field; the masteries are what this covers.
jest.mock("./components/Experience", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/services/oni-save/hooks/useBehavior", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseBehavior = useBehavior as jest.MockedFunction<typeof useBehavior>;

let modify: jest.Mock;
let masteries: [string, boolean][];

beforeEach(() => {
  modify = jest.fn();
  masteries = [["Mining1", true]];
  mockUseBehavior.mockImplementation((_id: number, behaviorName: any) => {
    if (behaviorName === "MinionResume") {
      return {
        templateData: { MasteryBySkillID: masteries },
        extraData: null,
        onTemplateDataModify: modify,
        onExtraDataModify: jest.fn(),
      } as any;
    }
    return {
      templateData: { model: { name: "Minion" } },
      extraData: null,
      onTemplateDataModify: jest.fn(),
      onExtraDataModify: jest.fn(),
    } as any;
  });
});

describe("Skills", () => {
  // This was a table of every skill in the game with a checkbox beside it -
  // fifty-four rows to say a duplicant had mastered one.
  it("shows what the duplicant has mastered, and not what they have not", () => {
    render(<Skills gameObjectId={1} />);

    expect(screen.getByText("Hard Digging")).toBeInTheDocument();
    // A skill they do not have is not on screen at all.
    expect(screen.queryByText("Superhard Digging")).toBeNull();
  });

  it("says how many of how many, so the short list is not a mystery", () => {
    render(<Skills gameObjectId={1} />);

    expect(screen.getByText(/^1 of \d+ mastered$/)).toBeInTheDocument();
  });

  it("drops a mastery when its chip is deleted", () => {
    const { container } = render(<Skills gameObjectId={1} />);

    const remove = container.querySelector<HTMLElement>(".MuiChip-deleteIcon");
    expect(remove).not.toBeNull();
    fireEvent.click(remove!);

    expect(modify).toHaveBeenCalledWith({ MasteryBySkillID: [] });
  });

  it("offers the rest behind an Add", () => {
    render(<Skills gameObjectId={1} />);

    fireEvent.click(screen.getByText("Add skill"));

    // The one already mastered is not offered again.
    expect(screen.getByText("Superhard Digging")).toBeInTheDocument();
    expect(screen.getAllByText("Hard Digging").length).toBe(1);
  });
});
