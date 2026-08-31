/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Provider } from "react-redux";
import { legacy_createStore as createStore } from "redux";
import { MemoryRouter } from "react-router";
import { SaveGame } from "oni-save-parser";

import { LoadingStatus } from "@/services/oni-save/state";

import "@/services/i18n/i18n";

import SaveOverview from "./SaveOverview";

jest.mock("@/components/PageContainer", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// The bundled example colony, driven through the real selectors: 3 duplicants,
// one cool chlorine vent, two asteroids and no creatures at all.
const mockSave = require("@/__mocks__/save-game.json") as SaveGame;

function renderOverview(saveGame: SaveGame = mockSave) {
  const store = createStore(() => ({
    services: { oniSave: { saveGame, loadingStatus: LoadingStatus.Ready } },
  }));
  return render(
    <Provider store={store as any}>
      <MemoryRouter>
        <SaveOverview />
      </MemoryRouter>
    </Provider>,
  );
}

function destination(name: RegExp): HTMLElement {
  return screen.getByRole("link", { name });
}

/** The same colony minus its content packs, which is what a base game save is. */
function baseGameSave(): SaveGame {
  return {
    ...mockSave,
    header: {
      ...mockSave.header,
      gameInfo: { ...mockSave.header.gameInfo, dlcIds: [], dlcId: null },
    },
  };
}

it("names the colony", () => {
  renderOverview();

  expect(
    screen.getByRole("heading", { name: "Example Colony" }),
  ).toBeInTheDocument();
});

it("counts what this colony has, per editable area", () => {
  renderOverview();

  expect(destination(/^Duplicants/)).toHaveTextContent("3");
  expect(destination(/^Geysers/)).toHaveTextContent("1");
  expect(destination(/^Worlds/)).toHaveTextContent("2");
});

// The Creatures page renders a blank screen when there are none, so the count
// has to say so here rather than sending someone into an empty room.
it("says outright when an area has nothing in it", () => {
  renderOverview();

  expect(destination(/^Creatures/)).toHaveTextContent(/nothing/i);
});

it("warns on the areas that are not sanity-checked", () => {
  renderOverview();

  expect(destination(/^Materials/)).toHaveTextContent(/colony-wide/i);
  expect(destination(/^Raw Editor/)).toHaveTextContent(/no checks/i);
});

it("does not warn on the areas that are ordinary edits", () => {
  renderOverview();

  expect(destination(/^Duplicants/)).not.toHaveTextContent(/no checks/i);
});

// save-onisave.ts hands back a download named after the colony; nothing in the
// app said so, and it is the step where "I edited it" fails to reach the game.
it("says where the edited save will end up", () => {
  renderOverview();

  expect(screen.getByText(/Example Colony\.sav/)).toBeInTheDocument();
});

it("names the folder the downloaded save has to go back into", () => {
  renderOverview();

  expect(screen.getByText("save_files")).toBeInTheDocument();
});

it("leaves out an area this save's content packs cannot have", () => {
  renderOverview(baseGameSave());

  expect(screen.queryByRole("link", { name: /^Worlds/ })).toBeNull();
  expect(destination(/^Duplicants/)).toBeInTheDocument();
});

it("still offers the difficulty settings", () => {
  renderOverview();

  expect(
    screen.getByRole("heading", { name: "Difficulty" }),
  ).toBeInTheDocument();
});

// Sandbox mode was asked for three times on the tracker while shipping the
// whole time. Naming it properly was 0.3; saying what flipping it does is the
// other half of the same problem.
it("says what sandbox mode does", () => {
  renderOverview();

  expect(screen.getByText(/build-anything tools/)).toBeInTheDocument();
});
