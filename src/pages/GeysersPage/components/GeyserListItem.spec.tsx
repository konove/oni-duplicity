/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
// test/setup-dom.js registers these at runtime; the import is what tells
// TypeScript that `toBeInTheDocument` exists.
import "@testing-library/jest-dom";

import {
  BEST_CASE_ROLLS,
  SECONDS_PER_CYCLE,
  resampleRoll,
  rollForValue,
} from "@/services/oni-save/geyser-configuration";
import useGeyser, { UseGeyser } from "@/services/oni-save/hooks/useGeyser";

import GeyserListItem from "./GeyserListItem";

// A miniature i18next backed by the real English strings, so the assertions are
// on what a reader actually sees - and so a missing key fails the test rather
// than quietly rendering its own name.
jest.mock("react-i18next", () => {
  const common = jest.requireActual("../../../translations/en/common.json");
  const oni = jest.requireActual("../../../translations/en/oni.json");

  const lookup = (key: string): string | undefined => {
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
      return (options.defaultValue as string) ?? key;
    }
    return template.replace(/{{(\w+)}}/g, (_, name) => String(options[name]));
  };

  return { useTranslation: () => ({ t }) };
});

jest.mock("@/services/oni-save/hooks/useGeyser", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseGeyser = useGeyser as jest.MockedFunction<typeof useGeyser>;

const COPPER = {
  minRate: 200,
  maxRate: 400,
  minIterationLength: 480,
  maxIterationLength: 1080,
  minIterationPercent: 1 / 60,
  maxIterationPercent: 0.1,
  minYearLength: 15000,
  maxYearLength: 135000,
  minYearPercent: 0.4,
  maxYearPercent: 0.8,
};

/** Copper Volcano U014, the geyser the whole layout was designed against. */
const U014 = {
  rateRoll: rollForValue(317, COPPER.minRate, COPPER.maxRate),
  iterationLengthRoll: rollForValue(
    1030,
    COPPER.minIterationLength,
    COPPER.maxIterationLength,
  ),
  iterationPercentRoll: rollForValue(
    79 / 1030,
    COPPER.minIterationPercent,
    COPPER.maxIterationPercent,
  ),
  yearLengthRoll: rollForValue(
    153.1 * SECONDS_PER_CYCLE,
    COPPER.minYearLength,
    COPPER.maxYearLength,
  ),
  yearPercentRoll: rollForValue(
    0.6,
    COPPER.minYearPercent,
    COPPER.maxYearPercent,
  ),
};

const handlers = () => ({
  onChangeGeyserType: jest.fn(),
  onChangeEmitRate: jest.fn(),
  onChangeYearLength: jest.fn(),
  onChangeYearActive: jest.fn(),
  onChangeEmitActive: jest.fn(),
  onChangeEmitLength: jest.fn(),
  onApplyBestCase: jest.fn(),
});

function renderGeyser(overrides: Partial<UseGeyser> = {}) {
  const spies = handlers();
  mockUseGeyser.mockReturnValue({
    geyserType: "molten_copper",
    rolls: U014,
    ...spies,
    ...overrides,
  });
  render(<GeyserListItem gameObjectId={1} />);
  return spies;
}

function slider(name: RegExp) {
  return screen.getByRole("slider", { name });
}

describe("GeyserListItem", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // The page used to show five bare percentages. A roll of 0.63 tells a reader
  // nothing; 1030 s is the number the game prints.
  it("reads every setting in the units the game uses", () => {
    renderGeyser();

    expect(screen.getByText("1030 s")).toBeInTheDocument();
    expect(screen.getByText("317 kg/cycle")).toBeInTheDocument();
    expect(screen.getByText("153.1 cycles")).toBeInTheDocument();
  });

  it("labels each slider with the range its type allows", () => {
    renderGeyser();

    expect(screen.getByText("480 s")).toBeInTheDocument();
    expect(screen.getByText("1080 s")).toBeInTheDocument();
    expect(screen.getByText("200 kg/cycle")).toBeInTheDocument();
    expect(screen.getByText("400 kg/cycle")).toBeInTheDocument();
  });

  // The two fraction-backed rows: an absolute range here would move whenever
  // the row above it did, so the slider sets the share and shows the value.
  it("sets the two fraction-backed rows as percentages", () => {
    renderGeyser();

    // The copper volcano erupts for 1.7% to 10% of its eruption cycle, and is
    // active for 40% to 80% of its full cycle.
    expect(slider(/erupting/i)).toHaveAttribute("aria-valuemax", "10");
    expect(slider(/^active$/i)).toHaveAttribute("aria-valuemin", "40");
    expect(slider(/^active$/i)).toHaveAttribute("aria-valuemax", "80");
    expect(screen.getByText("1.7%")).toBeInTheDocument();
    expect(screen.getByText("7.7%")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("shows what each percentage works out to", () => {
    renderGeyser();

    // 7.7% of the 1030 second eruption cycle.
    expect(screen.getByText("79 s")).toBeInTheDocument();
    // 60% of the 153.1 cycle full cycle.
    expect(screen.getByText("91.9 cycles")).toBeInTheDocument();
  });

  it("prints the four lines the game's own panel prints", () => {
    renderGeyser();

    expect(screen.getByText("Molten Copper")).toBeInTheDocument();
    expect(screen.getByText("6.9 kg/s")).toBeInTheDocument();
    expect(screen.getByText("79 s every 1030 s")).toBeInTheDocument();
    expect(
      screen.getByText("91.9 cycles every 153.1 cycles"),
    ).toBeInTheDocument();
    expect(screen.getByText("317 g/s")).toBeInTheDocument();
  });

  it("shows the temperature of what comes out", () => {
    renderGeyser();

    expect(screen.getByText("2226.9 °C")).toBeInTheDocument();
  });

  // The slider is in kilograms; the save is in rolls. Getting this conversion
  // backwards would store a plausible number that means something else.
  it("stores the roll that produces the value dragged to", () => {
    const spies = renderGeyser();

    fireEvent.keyDown(slider(/^output$/i), { key: "End" });

    expect(spies.onChangeEmitRate).toHaveBeenCalledTimes(1);
    const roll = spies.onChangeEmitRate.mock.calls[0][0];
    // The game's own resample epsilon is a rounded float, so the top of the
    // range comes back a millionth of a kilogram over. Nothing rounds it wrong.
    expect(resampleRoll(roll, COPPER.minRate, COPPER.maxRate)).toBeCloseTo(
      COPPER.maxRate,
      4,
    );
  });

  it("stores a fraction, not a percentage, for the percentage rows", () => {
    const spies = renderGeyser();

    fireEvent.keyDown(slider(/^active$/i), { key: "End" });

    expect(spies.onChangeYearActive).toHaveBeenCalledTimes(1);
    const roll = spies.onChangeYearActive.mock.calls[0][0];
    expect(roll).toBeLessThanOrEqual(1);
    expect(
      resampleRoll(roll, COPPER.minYearPercent, COPPER.maxYearPercent),
    ).toBeCloseTo(COPPER.maxYearPercent, 6);
  });

  it("applies the best case in one action", () => {
    const spies = renderGeyser();

    fireEvent.click(screen.getByRole("button", { name: /best case/i }));

    expect(spies.onApplyBestCase).toHaveBeenCalledTimes(1);
  });

  // Every reducer sets `isModified`, so clicking this with nothing left to do
  // would mark the save dirty for a change that did not happen.
  it("will not apply the best case twice", () => {
    const spies = renderGeyser({ rolls: { ...U014, ...BEST_CASE_ROLLS } });

    const button = screen.getByRole("button", { name: /best case/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(spies.onApplyBestCase).not.toHaveBeenCalled();
  });

  // A disabled control that says nothing is the usual complaint about them.
  it("says why the button is disabled", () => {
    renderGeyser({ rolls: { ...U014, ...BEST_CASE_ROLLS } });

    expect(screen.getByText(/already the best/i)).toBeInTheDocument();
    expect(screen.queryByText(/shortest gap to buffer/i)).toBeNull();
  });

  it("keeps the button live while there is still something to do", () => {
    renderGeyser();

    expect(screen.getByRole("button", { name: /best case/i })).toBeEnabled();
    expect(screen.getByText(/shortest gap to buffer/i)).toBeInTheDocument();
  });

  // A save from a newer game than the parser knows: the type dropdown still
  // works, so the card explains itself rather than rendering meaningless rolls.
  it("explains itself when the type is not one it knows", () => {
    renderGeyser({ geyserType: "molten_unobtainium" });

    expect(screen.queryAllByRole("slider")).toHaveLength(0);
    expect(
      screen.getByText(/type is not one the editor knows/i),
    ).toBeInTheDocument();
  });
});
