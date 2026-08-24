/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
// test/setup-dom.js registers these at runtime; the import is what tells
// TypeScript that `toBeInTheDocument` exists.
import "@testing-library/jest-dom";

import { MaterialListItem } from "@/services/oni-save/selectors/material";
import {
  useMaterialList,
  useDeleteMaterials,
} from "@/services/oni-save/hooks/useMaterials";

import MaterialsTable from "./MaterialsTable";

// A miniature i18next over the real English strings, so the assertions are on
// what a reader sees and a missing key fails the test instead of quietly
// rendering its own name.
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
    // English resolves to i18next's v4 suffixes, _one and _other.
    const suffixed =
      typeof options.count === "number"
        ? lookup(`${key}${options.count === 1 ? "_one" : "_other"}`)
        : undefined;
    const template = suffixed ?? lookup(key);
    if (typeof template !== "string") {
      return (options.defaultValue as string) ?? key;
    }
    return template.replace(/{{(\w+)}}/g, (_, name) => String(options[name]));
  };

  // ConfirmationDialog labels its buttons with <Trans>, so the mock has to
  // provide it or the dialog cannot render at all.
  const Trans = ({ i18nKey }: { i18nKey: string }) => t(i18nKey);

  return { useTranslation: () => ({ t }), Trans };
});

jest.mock("@/services/oni-save/hooks/useMaterials", () => ({
  useMaterialList: jest.fn(),
  useDeleteMaterials: jest.fn(),
}));

const mockList = useMaterialList as jest.MockedFunction<typeof useMaterialList>;
const mockDelete = useDeleteMaterials as jest.MockedFunction<
  typeof useDeleteMaterials
>;

function material(over: Partial<MaterialListItem>): MaterialListItem {
  return {
    name: "Shale",
    kind: "element",
    measure: "mass",
    looseUnits: 0,
    looseObjects: 0,
    storedUnits: 0,
    storedContainers: 0,
    ...over,
  };
}

// Rows chosen to exercise every case the page has to survive: loose only,
// stored only, both, and the three units that are not mass.
const SHALE = material({
  name: "Shale",
  looseUnits: 197400,
  looseObjects: 129,
  storedUnits: 200,
  storedContainers: 1,
});
const SALT_WATER = material({
  name: "SaltWater",
  looseUnits: 4776.7,
  looseObjects: 46,
});
const CHLORINE = material({
  name: "ChlorineGas",
  storedUnits: 2.05,
  storedContainers: 16,
});
const SEED = material({
  name: "SeaLettuceSeed",
  kind: "seed",
  measure: "count",
  looseUnits: 31,
  looseObjects: 31,
});
const FIG = material({
  name: "VineFruit",
  kind: "food",
  measure: "calories",
  looseUnits: 7,
  looseObjects: 7,
});
const EGG = material({
  name: "ChameleonEgg",
  kind: "egg",
  measure: "count",
  looseUnits: 11,
  looseObjects: 11,
});

let onDelete: jest.Mock;

function renderTable(materials: MaterialListItem[]) {
  onDelete = jest.fn();
  mockList.mockReturnValue(materials);
  mockDelete.mockReturnValue(onDelete);
  return render(<MaterialsTable />);
}

function row(name: string) {
  return screen.getByRole("row", { name: new RegExp(name) });
}

describe("MaterialsTable", () => {
  it("names each material and says what kind it is", () => {
    renderTable([SHALE, SEED, FIG]);

    expect(within(row("Shale")).getByText("Solid element")).toBeInTheDocument();
    expect(
      within(row("Sea Lettuce Seed")).getByText("Seed"),
    ).toBeInTheDocument();
    expect(within(row("Vine Fruit")).getByText("Edible")).toBeInTheDocument();
  });

  it("weighs an element and counts the clumps it lies in", () => {
    renderTable([SHALE]);

    expect(within(row("Shale")).getByText("197.4 t")).toBeInTheDocument();
    expect(within(row("Shale")).getByText("129 clumps")).toBeInTheDocument();
  });

  // The page called every loose pile a clump. A colony's Salt Water lies on
  // the floor in bottles, and its Chlorine only ever exists in canisters.
  it("calls a loose liquid bottles, not clumps", () => {
    renderTable([SALT_WATER]);

    expect(
      within(row("Salt Water")).getByText("4776.7 kg"),
    ).toBeInTheDocument();
    expect(
      within(row("Salt Water")).getByText("46 bottles"),
    ).toBeInTheDocument();
  });

  // 0.8: nine seed types in a real colony, and the page listed none of them.
  it("counts seeds and eggs in their own units", () => {
    renderTable([SEED, EGG]);

    expect(
      within(row("Sea Lettuce Seed")).getByText("31 seeds"),
    ).toBeInTheDocument();
    expect(
      within(row("Chameleon Egg")).getByText("11 eggs"),
    ).toBeInTheDocument();
  });

  it("shows food as the kilocalories the game shows", () => {
    renderTable([FIG]);
    expect(
      within(row("Vine Fruit")).getByText("2275 kcal"),
    ).toBeInTheDocument();
  });

  it("counts the containers holding a material", () => {
    renderTable([CHLORINE]);

    expect(within(row("Chlorine Gas")).getByText("2050 g")).toBeInTheDocument();
    expect(
      within(row("Chlorine Gas")).getByText("16 containers"),
    ).toBeInTheDocument();
  });

  // The point of the redesign: a trailing delete button never said whether it
  // took Shale's loose 197.4 t or its stored 200 kg. The menu entry says.
  it("names the quantity each menu entry would delete", () => {
    renderTable([SHALE]);

    fireEvent.click(
      within(row("Shale")).getByRole("button", { name: "Actions for Shale" }),
    );

    expect(
      screen.getByRole("menuitem", { name: "Delete 197.4 t lying around" }),
    ).toBeInTheDocument();
  });

  it("deletes the material the entry named", () => {
    renderTable([SHALE]);

    fireEvent.click(
      within(row("Shale")).getByRole("button", { name: "Actions for Shale" }),
    );
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Delete 197.4 t lying around" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onDelete).toHaveBeenCalledWith("Shale");
  });

  // Entries that do not apply are omitted rather than disabled, so a row with
  // nothing loose offers no menu at all.
  it("offers no menu on a row with nothing to act on", () => {
    renderTable([CHLORINE]);

    expect(
      within(row("Chlorine Gas")).queryByRole("button"),
    ).not.toBeInTheDocument();
  });

  it("filters by the name the reader can see", () => {
    renderTable([SHALE, SALT_WATER, SEED]);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "salt" },
    });

    expect(screen.queryByText("Shale")).not.toBeInTheDocument();
    expect(screen.getByText("Salt Water")).toBeInTheDocument();
  });
});
