import { isDeadAlignment, REVIVE_ALIGNMENT, reviveAmounts } from "./duplicants";

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

describe("reviveAmounts", () => {
  const amount = (name: string, value: number) => ({ name, value: { value } });

  // The duplicant this was written for: suffocated, so breath is 0, but at
  // full health and with calories to spare. Restoring health alone would have
  // left the game to kill him again on the first tick.
  const OTTO = [
    amount("HitPoints", 100),
    amount("Breath", 0),
    amount("Calories", 2639719.25),
    amount("Stress", 11.78),
    amount("Decor", -130),
  ];

  it("fills the lethal amount that is actually at zero", () => {
    const revived = reviveAmounts(OTTO);
    expect(revived.find((x) => x.name === "Breath")!.value.value).toBe(100);
  });

  it("leaves the amounts that were never lethal alone", () => {
    const revived = reviveAmounts(OTTO);
    // Not topped up: he was alive at 2,639,719 calories a moment ago, and
    // reviving someone is no reason to also feed them.
    expect(revived.find((x) => x.name === "Calories")!.value.value).toBe(
      2639719.25,
    );
    expect(revived.find((x) => x.name === "Stress")!.value.value).toBe(11.78);
    // Negative, and not a vital at all - untouched.
    expect(revived.find((x) => x.name === "Decor")!.value.value).toBe(-130);
  });

  it("fills each of the three that kill", () => {
    const revived = reviveAmounts([
      amount("HitPoints", 0),
      amount("Breath", 0),
      amount("Calories", 0),
    ]);
    expect(revived.map((x) => x.value.value)).toEqual([100, 100, 4000000]);
  });

  it("does not mutate what it was given", () => {
    const before = JSON.stringify(OTTO);
    reviveAmounts(OTTO);
    expect(JSON.stringify(OTTO)).toBe(before);
  });
});
