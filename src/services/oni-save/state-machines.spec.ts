import {
  StateMachineControllerExtraData,
  parseStateMachineParameters,
  writeStateMachineParameters,
  writeStateMachineResourceValue,
  readStateMachineResourceValue,
} from "oni-save-parser";

import {
  ALIVE_STATE,
  DEATH_MONITOR,
  DEATH_PARAMETER,
  findDeathMonitor,
  isDeadStateMachines,
  reviveStateMachines,
} from "./state-machines";

const deathParameter = (guid: string) => ({
  contextType: "StateMachine`4+ResourceParameter`1+Context",
  name: DEATH_PARAMETER,
  value: writeStateMachineResourceValue(guid),
});

/** The shape a real save has: a couple of machines, one of them the monitor. */
function machines(
  currentState: string,
  guid: string,
): StateMachineControllerExtraData {
  return {
    serializerVersion: 20,
    unparsed: null,
    stateMachines: [
      {
        leading: 0,
        type: "EntityLuminescence+Instance",
        typeSuffix: null,
        currentState: "root",
        data: new ArrayBuffer(8),
      },
      {
        leading: 0,
        type: DEATH_MONITOR,
        typeSuffix: null,
        currentState,
        data: writeStateMachineParameters([
          deathParameter(guid),
          {
            contextType: "StateMachine`4+TargetParameter+Context",
            name: "masterTarget",
            value: new Uint8Array([0xd6, 0x9d, 0x34, 0x00]).buffer,
          },
        ]),
      },
    ],
  };
}

const DEAD = machines("root.dead.ground", "Root.Deaths.Suffocation");
const ALIVE = machines(ALIVE_STATE, "");

describe("findDeathMonitor", () => {
  it("picks the monitor out of the machines", () => {
    expect(findDeathMonitor(DEAD)!.currentState).toBe("root.dead.ground");
  });

  it("says nothing when there are no machines to ask", () => {
    expect(findDeathMonitor(null)).toBeUndefined();
    expect(findDeathMonitor(undefined)).toBeUndefined();
    // A serializer version too old for the parser to take apart.
    expect(
      findDeathMonitor({
        serializerVersion: 11,
        stateMachines: null,
        unparsed: new ArrayBuffer(4),
      }),
    ).toBeUndefined();
  });
});

describe("isDeadStateMachines", () => {
  it("reads root.dead.ground as dead", () => {
    expect(isDeadStateMachines(DEAD)).toBe(true);
  });

  // root.dead has two children - a body someone picked up is still a body.
  it("reads root.dead.carried as dead", () => {
    const carried = machines("root.dead.carried", "Root.Deaths.Suffocation");
    expect(isDeadStateMachines(carried)).toBe(true);
  });

  it("reads root.alive as alive", () => {
    expect(isDeadStateMachines(ALIVE)).toBe(false);
  });

  it("says alive when there is nothing to read", () => {
    expect(isDeadStateMachines(null)).toBe(false);
  });
});

describe("reviveStateMachines", () => {
  it("puts the monitor back in the living state", () => {
    const revived = reviveStateMachines(DEAD)!;
    expect(revived).not.toBeNull();
    expect(findDeathMonitor(revived)!.currentState).toBe(ALIVE_STATE);
    expect(isDeadStateMachines(revived)).toBe(false);
  });

  // DeathMonitor wires alive.ParamTransition(death, dying_duplicant, p =>
  // p != null), so a duplicant restored to root.alive with the cause still set
  // walks straight back into dying. Clearing the state alone is not a revive.
  it("also empties the death parameter", () => {
    const revived = reviveStateMachines(DEAD)!;
    const parameters = parseStateMachineParameters(
      findDeathMonitor(revived)!.data,
    )!;
    const death = parameters.find((p) => p.name === DEATH_PARAMETER)!;
    expect(readStateMachineResourceValue(death.value)).toBe("");
  });

  it("keeps the monitor's other parameters", () => {
    const revived = reviveStateMachines(DEAD)!;
    const parameters = parseStateMachineParameters(
      findDeathMonitor(revived)!.data,
    )!;
    expect(parameters.map((p) => p.name)).toEqual([
      DEATH_PARAMETER,
      "masterTarget",
    ]);
    const target = parameters[1];
    expect(new Uint8Array(target.value)).toEqual(
      new Uint8Array([0xd6, 0x9d, 0x34, 0x00]),
    );
  });

  it("leaves every other machine exactly as it was", () => {
    const revived = reviveStateMachines(DEAD)!;
    expect(revived.stateMachines![0]).toBe(DEAD.stateMachines![0]);
  });

  it("declines a duplicant who is not dead", () => {
    expect(reviveStateMachines(ALIVE)).toBeNull();
  });

  it("declines when there are no machines to read", () => {
    expect(reviveStateMachines(null)).toBeNull();
    expect(
      reviveStateMachines({
        serializerVersion: 11,
        stateMachines: null,
        unparsed: new ArrayBuffer(4),
      }),
    ).toBeNull();
  });
});
