/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
// test/setup-dom.js registers these at runtime; the import is what tells
// TypeScript that `toBeInTheDocument` exists.
import "@testing-library/jest-dom";

import { AttributeLevel } from "@konove/oni-save-parser";

import useBehavior from "@/services/oni-save/hooks/useBehavior";

import Attributes from "./Attributes";

// A miniature i18next over the real English strings, so the assertions are on
// what a reader sees and a missing key fails the test instead of quietly
// rendering its own name.
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
    Trans: ({ i18nKey }: { i18nKey: string }) => t(i18nKey),
    withTranslation: () => (C: any) => (props: any) =>
      React.createElement(C, { ...props, t, i18n }),
  };
});

jest.mock("@/services/oni-save/hooks/useBehavior", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseBehavior = useBehavior as jest.MockedFunction<typeof useBehavior>;

const level = (attributeId: string, value: number): AttributeLevel => ({
  attributeId,
  level: value,
  experience: 0,
});

// Every primary attribute, because the tab renders all twelve whether the save
// carries them or not, plus one the save adds itself.
const LEVELS: AttributeLevel[] = [
  level("Athletics", 0),
  level("Cooking", 0),
  level("Digging", 0),
  level("Caring", 0),
  level("Ranching", 0),
  level("Machinery", 0),
  level("Construction", 0),
  level("Art", 0),
  level("Botanist", 0),
  level("Learning", 0),
  level("Strength", 4),
  level("SpaceNavigation", 0),
  level("Immunity", 0),
];

beforeEach(() => {
  mockUseBehavior.mockReturnValue({
    templateData: { saveLoadLevels: LEVELS },
    extraData: null,
    onTemplateDataModify: jest.fn(),
    onExtraDataModify: jest.fn(),
  });
});

/** The cell is the label's parent - which is itself part of what is asserted. */
function cellFor(name: string): HTMLElement {
  const label = screen.getByText(name);
  const cell = label.parentElement;
  expect(cell).not.toBeNull();
  return cell as HTMLElement;
}

describe("Attributes", () => {
  it("reads name first, then value", () => {
    render(<Attributes gameObjectId={1} />);

    const cell = cellFor("Strength");
    expect(cell.firstElementChild).toHaveTextContent("Strength");
    expect(cell.querySelector("input")).toHaveValue(4);
  });

  it("marks the attributes that are not set", () => {
    render(<Attributes gameObjectId={1} />);

    // "Athletics" is the one primary id whose label matches it; the rest are
    // renamed by the game (Caring shows as Medicine, Digging as Excavation).
    expect(cellFor("Athletics")).toHaveAttribute("data-unset");
    expect(cellFor("Strength")).not.toHaveAttribute("data-unset");
  });

  it("splits the save's own attributes out from the primary ones", () => {
    render(<Attributes gameObjectId={1} />);

    expect(screen.getByText("Attributes — primary")).toBeInTheDocument();
    expect(screen.getByText("Attributes — secondary")).toBeInTheDocument();
    // Immunity is not a primary attribute, so it has to come from the save.
    expect(cellFor("Immunity")).toBeInTheDocument();
  });

  // The heading carries the count so the reader can tell at a glance whether a
  // column of zeroes is worth reading. Strength is the only one set here.
  it("counts what is set in each group", () => {
    render(<Attributes gameObjectId={1} />);

    expect(screen.getByText("1 set")).toBeInTheDocument();
    expect(screen.getByText("none set")).toBeInTheDocument();
  });
});
