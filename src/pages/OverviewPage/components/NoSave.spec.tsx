/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Provider } from "react-redux";
import { legacy_createStore as createStore } from "redux";

import { LoadingStatus } from "@/services/oni-save/state";

// The real i18n instance, so <Trans> resolves its <1>...</1> markup against
// the real English strings rather than a stand-in that cannot.
import "@/services/i18n/i18n";

import NoSave from "./NoSave";

// The page chrome is a permanent Drawer plus the app bar; neither is what this
// screen is being tested for, and both drag in the whole nav.
jest.mock("@/components/PageContainer", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Windows is what CI and this machine report; the per-platform table has its
// own spec in src/save-file-paths.spec.ts.
jest.mock("@/runtime-env", () => ({ OSType: "windows", isProd: false }));

function renderNoSave() {
  const store = createStore(() => ({
    services: { oniSave: { loadingStatus: LoadingStatus.Idle } },
  }));
  return render(
    <Provider store={store as any}>
      <NoSave />
    </Provider>,
  );
}

it("says what the editor is for", () => {
  renderNoSave();

  expect(
    screen.getByRole("heading", { name: "Edit a saved colony" }),
  ).toBeInTheDocument();
});

it("still warns that a save should be backed up first", () => {
  renderNoSave();

  expect(screen.getByText(/Back up the save first/)).toBeInTheDocument();
});

it("walks through opening, editing and saving", () => {
  renderNoSave();

  expect(
    screen.getByRole("heading", { name: "Open your save file" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Change what you came for" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Save, then move the file back" }),
  ).toBeInTheDocument();
});

it("tells you where the game keeps its saves", () => {
  renderNoSave();

  expect(
    screen.getByText("Documents/Klei/OxygenNotIncluded/save_files"),
  ).toBeInTheDocument();
});

// The step nothing in the app said before: save-onisave.ts calls saveAs(), so
// the edited colony arrives as a download and the original file is untouched.
it("warns that saving downloads a file rather than overwriting the original", () => {
  renderNoSave();

  expect(
    screen.getByText(/does not write over the original/),
  ).toBeInTheDocument();
});

// <Trans> resolves <n> against the JSX child at that index, and a stray
// {" "} shifts every index after it. The folder name silently vanished.
it("names the folder the edited file has to go back into", () => {
  renderNoSave();

  expect(screen.getByText("save_files")).toBeInTheDocument();
});

it("offers a control that opens a save file", () => {
  renderNoSave();

  expect(
    screen.getByRole("button", { name: "Choose a save file" }),
  ).toBeInTheDocument();
});

// Deliberately absent: the bundled example is a JSON fixture, so anyone who
// loaded it and hit Save would be handed a file the game refuses to open.
it("does not offer the example colony", () => {
  renderNoSave();

  expect(screen.queryByText(/example colony/i)).toBeNull();
});
