/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
// test/setup-dom.js registers these at runtime; the import is what tells
// TypeScript that `toBeInTheDocument` exists.
import "@testing-library/jest-dom";

import {
  AITraitsBehavior,
  MinionIdentityBehavior,
  MinionResumeBehavior,
  getHashedString,
} from "oni-save-parser";

import useBehavior from "@/services/oni-save/hooks/useBehavior";

import IdentityBand from "./IdentityBand";

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
    Trans: ({ i18nKey, children }: { i18nKey: string; children?: any }) =>
      t(i18nKey, { defaultValue: children }),
    withTranslation: () => (C: any) => (props: any) =>
      React.createElement(C, { ...props, t, i18n }),
  };
});

// The sprite components ship untranspiled ESM and reach for require.context, so
// they cannot be rendered under jest at all - the Playwright shots cover them.
jest.mock("@/components/DuplicantPortrait", () => ({
  __esModule: true,
  default: () =>
    require("react").createElement("div", { "data-testid": "portrait" }),
}));

// Pulls in the file-import sagas and their dialogs; the band only has to place
// it, so a stand-in is enough.
jest.mock("@/components/DuplicantMenu", () => ({
  __esModule: true,
  default: () =>
    require("react").createElement("button", null, "Duplicant menu"),
}));

jest.mock("@/services/oni-save/hooks/useBehavior", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseBehavior = useBehavior as jest.MockedFunction<typeof useBehavior>;

// Death is marked on FactionAlignment, not on Health - see duplicants.ts.
let alignment: Record<string, boolean> = {
  alignmentActive: true,
  targeted: false,
  targetable: true,
};

const TEMPLATE_DATA: Record<string, unknown> = {
  [MinionIdentityBehavior]: {
    name: "Ada",
    gender: "FEMALE",
    voiceIdx: 2,
    // A float part-way through the cycle the duplicant printed on.
    arrivalTime: 0.4,
  },
  [AITraitsBehavior]: { TraitIds: ["BingeEater", "EarlyBird"] },
  [MinionResumeBehavior]: {
    AptitudeBySkillGroup: [[getHashedString("MedicalAid"), 1]],
  },
};

beforeEach(() => {
  alignment = { alignmentActive: true, targeted: false, targetable: true };
  mockUseBehavior.mockImplementation(
    (_gameObjectId: number, behaviorName: any) =>
      ({
        templateData:
          behaviorName === "FactionAlignment"
            ? alignment
            : TEMPLATE_DATA[behaviorName as string],
        extraData: null,
        onTemplateDataModify: jest.fn(),
        onExtraDataModify: jest.fn(),
      }) as any,
  );
});

describe("IdentityBand", () => {
  it("names the duplicant and says who they are", () => {
    render(<IdentityBand gameObjectId={1} />);

    expect(screen.getByRole("heading", { name: "Ada" })).toBeInTheDocument();
    expect(
      screen.getByText("Female · Voice 2 · arrived cycle 0"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("portrait")).toBeInTheDocument();
  });

  // The whole point of the band: traits and interests are labelled runs of
  // chips, not page sections. Two h6 headings and three dividers is what the
  // 267px went on.
  it("labels the chip runs with captions rather than headings", () => {
    render(<IdentityBand gameObjectId={1} />);

    expect(screen.getByText("Traits").tagName).toBe("SPAN");
    expect(screen.getByText("Interests").tagName).toBe("SPAN");
    expect(screen.queryByRole("heading", { level: 6 })).toBeNull();
    expect(screen.queryByRole("separator")).toBeNull();
  });

  // A and D out of the design pass: a dead duplicant is marked where their
  // name is, and everything about them stays editable.
  it("marks a dead duplicant beside their name", () => {
    alignment = { alignmentActive: false, targeted: false, targetable: false };
    render(<IdentityBand gameObjectId={1} />);

    expect(screen.getByText("Dead")).toBeInTheDocument();
    // Still their record, not a tombstone.
    expect(screen.getByRole("heading", { name: "Ada" })).toBeInTheDocument();
    expect(screen.getByText("Binge Eater")).toBeInTheDocument();
    expect(screen.getByText("Add Trait")).toBeInTheDocument();
  });

  it("says nothing about a living duplicant", () => {
    render(<IdentityBand gameObjectId={1} />);

    expect(screen.queryByText("Dead")).toBeNull();
  });

  it("shows the duplicant's traits and interests", () => {
    render(<IdentityBand gameObjectId={1} />);

    expect(screen.getByText("Binge Eater")).toBeInTheDocument();
    expect(screen.getByText("Early Bird")).toBeInTheDocument();
    expect(screen.getByText("Doctor")).toBeInTheDocument();
    expect(screen.getByText("Add Trait")).toBeInTheDocument();
    expect(screen.getByText("Add Interest")).toBeInTheDocument();
  });
});
