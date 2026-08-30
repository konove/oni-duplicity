/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";

import {
  StateMachineControllerExtraData,
  writeStateMachineParameters,
  writeStateMachineResourceValue,
} from "oni-save-parser";

import useBehavior from "./useBehavior";
import useDuplicantCondition from "./useDuplicantCondition";

import { DEATH_MONITOR, DEATH_PARAMETER, ALIVE_STATE } from "../state-machines";
import { findDeathMonitor } from "../state-machines";

jest.mock("./useBehavior", () => ({ __esModule: true, default: jest.fn() }));

const mockUseBehavior = useBehavior as jest.MockedFunction<typeof useBehavior>;

const deadMachines = (): StateMachineControllerExtraData => ({
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

let writes: Record<string, jest.Mock>;
let machines: StateMachineControllerExtraData | null;
let alignment: Record<string, boolean>;

beforeEach(() => {
  writes = {
    machines: jest.fn(),
    alignment: jest.fn(),
    modifiers: jest.fn(),
  };
  machines = deadMachines();
  alignment = { alignmentActive: false, targeted: false, targetable: false };

  mockUseBehavior.mockImplementation((_id: number, behaviorName: any) => {
    if (behaviorName === "StateMachineController") {
      return {
        templateData: {},
        extraData: machines,
        onTemplateDataModify: jest.fn(),
        onExtraDataModify: writes.machines,
      };
    }
    if (behaviorName === "FactionAlignment") {
      return {
        templateData: alignment,
        extraData: null,
        onTemplateDataModify: writes.alignment,
        onExtraDataModify: jest.fn(),
      };
    }
    return {
      templateData: {},
      extraData: {
        amounts: [
          { name: "HitPoints", value: { value: 100 } },
          { name: "Breath", value: { value: 0 } },
        ],
        sicknesses: [{ name: "SlimeSickness", value: {} }],
      },
      onTemplateDataModify: jest.fn(),
      onExtraDataModify: writes.modifiers,
    };
  });
});

describe("useDuplicantCondition", () => {
  it("reads death from the state machines", () => {
    const { result } = renderHook(() => useDuplicantCondition(1));
    expect(result.current.isDead).toBe(true);
  });

  // The bundled example save is JSON, and the parser hands each machine's data
  // back as an ArrayBuffer, which does not survive that. The flag is what is
  // left to read there.
  it("falls back to the faction flag when there are no machines", () => {
    machines = null;
    const { result } = renderHook(() => useDuplicantCondition(1));
    expect(result.current.isDead).toBe(true);

    alignment = { alignmentActive: true, targeted: false, targetable: true };
    const alive = renderHook(() => useDuplicantCondition(1));
    expect(alive.result.current.isDead).toBe(false);
  });

  // Reviving is three writes, and the first is the only one that resurrects
  // anybody. A save edited with just the other two came back from the game
  // still reading "Dead: Suffocation".
  it("revives by putting the death monitor back in the living state", () => {
    const { result } = renderHook(() => useDuplicantCondition(1));

    act(() => result.current.revive());

    expect(writes.machines).toHaveBeenCalledTimes(1);
    const written = writes.machines.mock.calls[0][0];
    expect(findDeathMonitor(written)!.currentState).toBe(ALIVE_STATE);
  });

  it("also tidies the flag and the vitals the game recomputes", () => {
    const { result } = renderHook(() => useDuplicantCondition(1));

    act(() => result.current.revive());

    expect(writes.alignment).toHaveBeenCalledWith({
      alignmentActive: true,
      targetable: true,
    });
    expect(writes.modifiers).toHaveBeenCalledWith({
      amounts: [
        { name: "HitPoints", value: { value: 100 } },
        // Zero is what killed him; the others are left where they are.
        { name: "Breath", value: { value: 100 } },
      ],
      sicknesses: [],
    });
  });

  it("does nothing to a duplicant who is not dead", () => {
    machines = null;
    alignment = { alignmentActive: true, targeted: false, targetable: true };
    const { result } = renderHook(() => useDuplicantCondition(1));

    act(() => result.current.revive());

    // No state machines to fix, so nothing is written to them.
    expect(writes.machines).not.toHaveBeenCalled();
  });
});
