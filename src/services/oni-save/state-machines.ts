import {
  SerializedStateMachine,
  StateMachineControllerExtraData,
  parseStateMachineParameters,
  writeStateMachineParameters,
  writeStateMachineResourceValue,
} from "@konove/oni-save-parser";

/**
 * What a duplicant's state machines say about whether they are alive.
 *
 * The blob itself is the parser's business now - it decodes
 * `StateMachineController` into `{serializerVersion, stateMachines}`. What
 * lives here is only what `DeathMonitor` means, which is a fact about the game
 * rather than about the file format.
 */

/** `DeathMonitor.InitializeStates` names the living state exactly this. */
export const ALIVE_STATE = "root.alive";

/**
 * `root.dead` has two children, `ground` and `carried` - a body someone has
 * picked up is still a body - so death is the branch, not a leaf.
 */
const DEAD_STATE_PREFIX = "root.dead";

export const DEATH_MONITOR = "DeathMonitor+Instance";

export const DEATH_PARAMETER = "death";

/**
 * `ResourceParameter.Context.Serialize` writes the resource's guid, and the
 * empty string when there is no resource; `Deserialize` only takes a value
 * when the string is non-empty. So this is how "nobody died" is spelled.
 */
export const NO_DEATH = "";

export function findDeathMonitor(
  extraData: StateMachineControllerExtraData | null | undefined,
): SerializedStateMachine | undefined {
  if (!extraData || !extraData.stateMachines) {
    return undefined;
  }
  return extraData.stateMachines.find(
    (machine) => machine.type === DEATH_MONITOR,
  );
}

export function isDeadStateMachines(
  extraData: StateMachineControllerExtraData | null | undefined,
): boolean {
  const monitor = findDeathMonitor(extraData);
  return (
    monitor != null &&
    (monitor.currentState || "").startsWith(DEAD_STATE_PREFIX)
  );
}

/**
 * The two edits that undo a death, or null when there is nothing to undo or
 * the monitor is not shaped the way this understands.
 *
 * Both are needed. `DeathMonitor.InitializeStates` wires
 * `alive.ParamTransition(death, dying_duplicant, (smi, p) => p != null && ...)`,
 * so a duplicant put back in `root.alive` with the parameter still set walks
 * straight back into dying on the first tick.
 */
export function reviveStateMachines(
  extraData: StateMachineControllerExtraData | null | undefined,
): StateMachineControllerExtraData | null {
  if (!extraData || !extraData.stateMachines) {
    return null;
  }

  const monitor = findDeathMonitor(extraData);
  if (!monitor || !(monitor.currentState || "").startsWith(DEAD_STATE_PREFIX)) {
    return null;
  }

  const parameters = parseStateMachineParameters(monitor.data);
  if (!parameters) {
    return null;
  }
  const death = parameters.find((p) => p.name === DEATH_PARAMETER);
  if (!death) {
    return null;
  }

  return {
    ...extraData,
    stateMachines: extraData.stateMachines.map((machine) =>
      machine === monitor
        ? {
            ...machine,
            currentState: ALIVE_STATE,
            data: writeStateMachineParameters(
              parameters.map((p) =>
                p === death
                  ? { ...p, value: writeStateMachineResourceValue(NO_DEATH) }
                  : p,
              ),
            ),
          }
        : machine,
    ),
  };
}
