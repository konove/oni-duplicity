import {
  ALIVE_STATE,
  DEATH_MONITOR,
  DEATH_PARAMETER,
  StateMachineBlob,
  decodeParameters,
  decodeStateMachines,
  encodeParameters,
  encodeResourceValue,
  encodeStateMachines,
  findDeathMonitor,
  isDeadStateMachines,
  reviveStateMachines,
} from "./state-machines";

const utf8 = (s: string) => new TextEncoder().encode(s);

const deathParameter = (guid: string) => ({
  contextType: "StateMachine`4+ResourceParameter`1+Context",
  name: DEATH_PARAMETER,
  value: encodeResourceValue(guid),
});

/** The shape a real save has: a couple of machines, one of them the monitor. */
function blob(currentState: string, guid: string): StateMachineBlob {
  return {
    version: 20,
    entries: [
      {
        leading: 0,
        type: "EntityLuminescence+Instance",
        suffix: null,
        currentState: "root",
        data: utf8("some opaque instance bytes"),
      },
      {
        leading: 0,
        type: DEATH_MONITOR,
        suffix: null,
        currentState,
        data: encodeParameters([
          deathParameter(guid),
          {
            contextType: "StateMachine`4+TargetParameter+Context",
            name: "masterTarget",
            value: new Uint8Array([0xd6, 0x9d, 0x34, 0x00]),
          },
        ]),
      },
    ],
  };
}

const DEAD = blob("root.dead.ground", "Root.Deaths.Suffocation");
const ALIVE = blob(ALIVE_STATE, "");

describe("the state machine blob", () => {
  // The property everything else rests on. This blob is bytes the game wrote
  // itself, and anything the editor cannot put back exactly is a corrupt save.
  it("re-encodes to the same bytes it decoded", () => {
    const bytes = encodeStateMachines(DEAD);
    const round = encodeStateMachines(decodeStateMachines(bytes)!);
    expect(new Uint8Array(round)).toEqual(new Uint8Array(bytes));
  });

  it("reads back what was written", () => {
    const decoded = decodeStateMachines(encodeStateMachines(DEAD))!;
    expect(decoded.version).toBe(20);
    expect(decoded.entries.map((e) => e.type)).toEqual([
      "EntityLuminescence+Instance",
      DEATH_MONITOR,
    ]);
    expect(findDeathMonitor(decoded)!.currentState).toBe("root.dead.ground");
  });

  // Every rejection below would otherwise be a save the game cannot load.
  describe("refuses anything it does not fully understand", () => {
    it("rejects nothing at all", () => {
      expect(decodeStateMachines(null)).toBeNull();
      expect(decodeStateMachines(undefined)).toBeNull();
      expect(decodeStateMachines(new ArrayBuffer(0))).toBeNull();
    });

    it("rejects a version whose layout it does not know", () => {
      const bytes = new Uint8Array(encodeStateMachines(DEAD));
      new DataView(bytes.buffer).setInt32(0, 11, true);
      expect(decodeStateMachines(bytes.buffer)).toBeNull();
    });

    it("rejects a declared length that does not match the bytes", () => {
      const bytes = new Uint8Array(encodeStateMachines(DEAD));
      new DataView(bytes.buffer).setInt32(4, 999999, true);
      expect(decodeStateMachines(bytes.buffer)).toBeNull();
    });

    it("rejects an entry that overruns the buffer", () => {
      const bytes = new Uint8Array(encodeStateMachines(DEAD));
      // Truncating leaves the header claiming more than is there.
      expect(decodeStateMachines(bytes.slice(0, 40).buffer)).toBeNull();
    });
  });
});

describe("parameters", () => {
  it("round-trip", () => {
    const parameters = [deathParameter("Root.Deaths.Suffocation")];
    const decoded = decodeParameters(encodeParameters(parameters))!;
    expect(decoded).toHaveLength(1);
    expect(decoded[0].name).toBe(DEATH_PARAMETER);
    expect(new Uint8Array(decoded[0].value)).toEqual(
      new Uint8Array(parameters[0].value),
    );
  });

  it("rejects a block with bytes left over", () => {
    const good = encodeParameters([deathParameter("")]);
    const padded = new Uint8Array(good.byteLength + 4);
    padded.set(good, 0);
    expect(decodeParameters(padded)).toBeNull();
  });
});

describe("isDeadStateMachines", () => {
  it("reads root.dead.ground as dead", () => {
    expect(isDeadStateMachines(encodeStateMachines(DEAD))).toBe(true);
  });

  // root.dead has two children - a body someone picked up is still a body.
  it("reads root.dead.carried as dead", () => {
    const carried = blob("root.dead.carried", "Root.Deaths.Suffocation");
    expect(isDeadStateMachines(encodeStateMachines(carried))).toBe(true);
  });

  it("reads root.alive as alive", () => {
    expect(isDeadStateMachines(encodeStateMachines(ALIVE))).toBe(false);
  });

  it("says nothing when there is no blob to read", () => {
    expect(isDeadStateMachines(null)).toBe(false);
  });
});

describe("reviveStateMachines", () => {
  it("puts the monitor back in the living state", () => {
    const revived = reviveStateMachines(encodeStateMachines(DEAD))!;
    expect(revived).not.toBeNull();
    expect(findDeathMonitor(decodeStateMachines(revived)!)!.currentState).toBe(
      ALIVE_STATE,
    );
    expect(isDeadStateMachines(revived)).toBe(false);
  });

  // DeathMonitor wires alive.ParamTransition(death, dying_duplicant, p => p
  // != null), so a duplicant restored to root.alive with the cause still set
  // walks straight back into dying. Clearing the state alone is not a revive.
  it("also empties the death parameter", () => {
    const revived = reviveStateMachines(encodeStateMachines(DEAD))!;
    const monitor = findDeathMonitor(decodeStateMachines(revived)!)!;
    const death = decodeParameters(monitor.data)!.find(
      (p) => p.name === DEATH_PARAMETER,
    )!;
    // A resource parameter is a klei string, and empty means "no resource".
    expect(new Uint8Array(death.value)).toEqual(
      new Uint8Array(encodeResourceValue("")),
    );
  });

  it("leaves every other machine exactly as it was", () => {
    const revived = decodeStateMachines(
      reviveStateMachines(encodeStateMachines(DEAD))!,
    )!;
    const other = revived.entries[0];
    expect(other.type).toBe("EntityLuminescence+Instance");
    expect(other.currentState).toBe("root");
    expect(new Uint8Array(other.data)).toEqual(
      new Uint8Array(DEAD.entries[0].data),
    );
  });

  it("declines a duplicant who is not dead", () => {
    expect(reviveStateMachines(encodeStateMachines(ALIVE))).toBeNull();
  });

  it("declines bytes it cannot read", () => {
    expect(reviveStateMachines(null)).toBeNull();
    expect(reviveStateMachines(new ArrayBuffer(4))).toBeNull();
  });
});
