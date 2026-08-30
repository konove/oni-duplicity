/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
// test/setup-dom.js registers these at runtime; the import is what tells
// TypeScript that `toBeInTheDocument` exists.
import "@testing-library/jest-dom";

import MenuList from "@mui/material/MenuList";

import useBehavior from "@/services/oni-save/hooks/useBehavior";
import {
  writeStateMachineParameters,
  writeStateMachineResourceValue,
} from "oni-save-parser";

import {
  DEATH_MONITOR,
  DEATH_PARAMETER,
  ALIVE_STATE,
  findDeathMonitor,
} from "@/services/oni-save/state-machines";

import ReviveMenuItem from "./ReviveMenuItem";

jest.mock("react-i18next", () => {
  const common = jest.requireActual("@/translations/en/common.json");
  const lookup = (key: string): unknown =>
    key
      .split(".")
      .reduce<any>((node, part) => (node == null ? node : node[part]), common);
  const t = (key: string, options: Record<string, unknown> = {}) => {
    const template = lookup(key);
    return typeof template === "string"
      ? template
      : (options.defaultValue ?? key);
  };
  return {
    useTranslation: () => ({ t, i18n: { language: "en" } }),
    Trans: ({ i18nKey, children }: { i18nKey: string; children?: any }) =>
      t(i18nKey, { defaultValue: children }),
  };
});

jest.mock("@/services/oni-save/hooks/useBehavior", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseBehavior = useBehavior as jest.MockedFunction<typeof useBehavior>;

let modifyAlignment: jest.Mock;
let modifyModifiers: jest.Mock;
let modifyStateMachines: jest.Mock;

/** The machines a duplicant who suffocated actually leaves behind. */
const deadMachines = () => ({
  serializerVersion: 20,
  unparsed: null,
  stateMachines: [
    {
      leading: 0,
      type: DEATH_MONITOR,
      typeSuffix: null,
      currentState: "root.dead.ground",
      data: writeStateMachineParameters([
        {
          contextType: "StateMachine`4+ResourceParameter`1+Context",
          name: DEATH_PARAMETER,
          value: writeStateMachineResourceValue("Root.Deaths.Suffocation"),
        },
      ]),
    },
  ],
});

// Suffocated: out of the faction, breath gone, but at full health and with
// calories to spare - the shape the real save turned out to have.
beforeEach(() => {
  modifyAlignment = jest.fn();
  modifyModifiers = jest.fn();
  modifyStateMachines = jest.fn();
  mockUseBehavior.mockImplementation((_id: number, behaviorName: any) => {
    if (behaviorName === "StateMachineController") {
      return {
        templateData: {},
        extraData: deadMachines(),
        onTemplateDataModify: jest.fn(),
        onExtraDataModify: modifyStateMachines,
      } as any;
    }
    if (behaviorName === "FactionAlignment") {
      return {
        templateData: {
          alignmentActive: false,
          targeted: false,
          targetable: false,
        },
        extraData: null,
        onTemplateDataModify: modifyAlignment,
        onExtraDataModify: jest.fn(),
      } as any;
    }
    return {
      templateData: {},
      extraData: {
        amounts: [
          { name: "HitPoints", value: { value: 100 } },
          { name: "Breath", value: { value: 0 } },
          { name: "Calories", value: { value: 2639719.25 } },
        ],
        sicknesses: [{ name: "SlimeSickness", value: {} }],
      },
      onTemplateDataModify: jest.fn(),
      onExtraDataModify: modifyModifiers,
    } as any;
  });
});

// MUI v9 MenuItem reads MenuListContext and throws without it, so the item
// has to be mounted the way the menu really mounts it.
const renderItem = (onClick: () => void) =>
  render(
    <MenuList>
      <ReviveMenuItem gameObjectId={1} onClick={onClick} />
    </MenuList>,
  );

describe("ReviveMenuItem", () => {
  it("reads the behavior death actually marks", () => {
    renderItem(jest.fn());

    expect(mockUseBehavior).toHaveBeenCalledWith(1, "FactionAlignment");
    expect(screen.getByText("Revive")).toBeInTheDocument();
  });

  // Dying clears alignmentActive and targetable, so reviving has to write both
  // back. A version that only restored alignmentActive passed a "does it write
  // something" test and left a duplicant nothing could target.
  it("puts the duplicant back in the faction and closes the menu", () => {
    const onClick = jest.fn();
    renderItem(onClick);

    fireEvent.click(screen.getByText("Revive"));

    expect(modifyAlignment).toHaveBeenCalledWith({
      alignmentActive: true,
      targetable: true,
    });
    expect(onClick).toHaveBeenCalled();
  });

  // The write that actually resurrects anyone. DeathMonitor's state lives in
  // StateMachineController's hand-rolled blob, and a save edited without
  // touching it came back from the game still reading "Dead: Suffocation".
  it("puts the death monitor back in the living state", () => {
    renderItem(jest.fn());

    fireEvent.click(screen.getByText("Revive"));

    expect(modifyStateMachines).toHaveBeenCalledTimes(1);
    const written = modifyStateMachines.mock.calls[0][0];
    expect(findDeathMonitor(written)!.currentState).toBe(ALIVE_STATE);
  });

  it("also tidies the flag and vitals the game recomputes", () => {
    renderItem(jest.fn());

    fireEvent.click(screen.getByText("Revive"));

    expect(modifyModifiers).toHaveBeenCalledWith({
      amounts: [
        { name: "HitPoints", value: { value: 100 } },
        { name: "Breath", value: { value: 100 } },
        { name: "Calories", value: { value: 2639719.25 } },
      ],
      sicknesses: [],
    });
  });
});
