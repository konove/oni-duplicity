import { isDeadAlignment, REVIVE_ALIGNMENT } from "./duplicants";

// The whole "is this duplicant dead" question comes down to this predicate, so
// the cases that matter are the ones where the save does not answer cleanly.
describe("isDeadAlignment", () => {
  it("reads a duplicant out of the faction as dead", () => {
    expect(
      isDeadAlignment({
        alignmentActive: false,
        targeted: false,
        targetable: false,
      }),
    ).toBe(true);
  });

  it("reads a duplicant in the faction as alive", () => {
    expect(
      isDeadAlignment({
        alignmentActive: true,
        targeted: false,
        targetable: true,
      }),
    ).toBe(false);
  });

  // Only a positive false counts. useBehavior hands back null for a game
  // object with no such behavior, and marking a living duplicant dead is the
  // worse of the two mistakes.
  it("reads a missing behavior as alive", () => {
    expect(isDeadAlignment(null)).toBe(false);
    expect(isDeadAlignment(undefined)).toBe(false);
  });

  it("does not treat targetable on its own as death", () => {
    expect(
      isDeadAlignment({
        alignmentActive: true,
        targeted: false,
        targetable: false,
      }),
    ).toBe(false);
  });
});

describe("REVIVE_ALIGNMENT", () => {
  // Dying clears both fields, so reviving has to set both back - restoring
  // only alignmentActive leaves a duplicant nothing can target.
  it("undoes both fields death clears", () => {
    expect(REVIVE_ALIGNMENT).toEqual({
      alignmentActive: true,
      targetable: true,
    });
  });
});
