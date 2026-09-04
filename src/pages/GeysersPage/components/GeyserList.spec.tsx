/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import useGameObjectWorlds from "@/services/oni-save/hooks/useGameObjectWorlds";
import { WorldGroup, WorldRect } from "@/services/oni-save/worlds";

import GeyserList from "./GeyserList";

// The real English strings, so the assertions are on what a reader sees.
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

jest.mock("@/services/oni-save/hooks/useGameObjectWorlds", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// The card has its own spec. Here it only needs to say which geyser it is.
jest.mock("./GeyserListItem", () => ({
  __esModule: true,
  default: ({ gameObjectId }: { gameObjectId: number }) => (
    <div data-testid="geyser">{gameObjectId}</div>
  ),
}));

const mockUseGameObjectWorlds = useGameObjectWorlds as jest.MockedFunction<
  typeof useGameObjectWorlds
>;

function world(id: number, overrideName: string): WorldRect {
  return {
    gameObjectId: 1000 + id,
    id,
    templateData: {
      id,
      worldName: `expansion1::worlds/World${id}`,
      overrideName,
      worldType: "",
      worldOffset: { x: 0, y: 0 },
      worldSize: { x: 1, y: 1 },
      isStartWorld: id === 0,
      isModuleInterior: false,
      isDiscovered: true,
      isDupeVisited: true,
      isRoverVisited: false,
      isSurfaceRevealed: false,
      sunlight: 0,
      cosmicRadiation: 0,
    },
  };
}
const HOME = world(0, "Home Base");
const OUTPOST = world(1, "Outpost");

function renderList(groups: WorldGroup[]) {
  mockUseGameObjectWorlds.mockReturnValue(groups);
  const ids = groups.flatMap((g) => g.gameObjectIds);
  render(<GeyserList gameObjectIds={ids} />);
}

const shownGeysers = () =>
  screen.getAllByTestId("geyser").map((el) => Number(el.textContent));

describe("GeyserList", () => {
  afterEach(() => jest.clearAllMocks());

  describe("on a cluster", () => {
    const groups: WorldGroup[] = [
      { world: HOME, gameObjectIds: [1, 2] },
      { world: OUTPOST, gameObjectIds: [3] },
    ];

    it("offers a tab per world, with a count, and one for all of them", () => {
      renderList(groups);

      const tabs = screen.getAllByRole("tab");
      expect(tabs.map((tab) => tab.textContent)).toEqual([
        "All3",
        "Home Base2",
        "Outpost1",
      ]);
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    });

    it("shows every geyser under its world's heading to begin with", () => {
      renderList(groups);

      expect(shownGeysers()).toEqual([1, 2, 3]);
      expect(
        screen.getByRole("heading", { name: "Home Base" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Outpost" }),
      ).toBeInTheDocument();
    });

    it("shows only one world's geysers once its tab is picked", () => {
      renderList(groups);
      fireEvent.click(screen.getByRole("tab", { name: /outpost/i }));

      expect(shownGeysers()).toEqual([3]);
      // The tab is the only place the world is named now.
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });

    // A Spaced Out object can sit outside every world's rect. It is still
    // listed, under a heading that says so rather than a world it is not on.
    it("lists geysers outside every world under their own heading", () => {
      renderList([...groups, { world: null, gameObjectIds: [9] }]);

      expect(
        screen.getByRole("heading", { name: "Elsewhere" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /elsewhere/i }),
      ).toBeInTheDocument();
    });
  });

  // A base game save has one map; a cluster can still keep all its geysers
  // on one asteroid. Neither has anything to pick between.
  describe("with everything on one world", () => {
    it.each([
      ["a base game save", [{ world: null, gameObjectIds: [1, 2] }]],
      ["a single asteroid", [{ world: HOME, gameObjectIds: [1, 2] }]],
    ])("is a plain list for %s", (_, groups) => {
      renderList(groups);

      expect(shownGeysers()).toEqual([1, 2]);
      expect(screen.queryByRole("tab")).not.toBeInTheDocument();
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });
  });
});
