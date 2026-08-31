/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { Provider } from "react-redux";
import { legacy_createStore as createStore } from "redux";
import { MemoryRouter } from "react-router";
import { DLCIds } from "oni-save-parser";

import Nav from "./Nav";

jest.mock("react-i18next", () => {
  const common = jest.requireActual("@/translations/en/common.json");
  const lookup = (key: string): unknown =>
    key
      .split(".")
      .reduce<any>((node, part) => (node == null ? node : node[part]), common);
  const t = (key: string, options: Record<string, unknown> = {}) => {
    const template = lookup(key);
    if (typeof template !== "string") {
      return options.defaultValue ?? key;
    }
    return template;
  };
  return {
    useTranslation: () => ({ t, i18n: { language: "en" } }),
    Trans: ({ i18nKey, children }: { i18nKey: string; children?: any }) =>
      t(i18nKey, { defaultValue: children }),
  };
});

/**
 * The nav reads two things out of the store - whether a save is loaded, and
 * which content packs it declares - so a state stub with just those is enough
 * to drive the real selectors.
 */
function renderNav(dlcIds: string[] | null) {
  const saveGame =
    dlcIds === null ? null : { header: { gameInfo: { dlcIds } } };
  const store = createStore(() => ({
    services: { oniSave: { saveGame } },
  }));
  return render(
    <Provider store={store as any}>
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    </Provider>,
  );
}

function link(name: string): HTMLElement {
  return screen.getByRole("link", { name });
}

describe("with no save loaded", () => {
  it("disables the entries that need a save", () => {
    renderNav(null);

    expect(link("Duplicants")).toHaveAttribute("aria-disabled", "true");
    expect(link("Materials")).toHaveAttribute("aria-disabled", "true");
  });

  it("still lists Worlds, so the list does not grow when a save opens", () => {
    renderNav(null);

    expect(link("Worlds")).toHaveAttribute("aria-disabled", "true");
  });

  it("says what unlocks the disabled entries", () => {
    renderNav(null);

    expect(screen.getByText("Locked until a save is open")).toBeInTheDocument();
  });

  it("leaves Overview and Changelog usable", () => {
    renderNav(null);

    expect(link("Overview")).not.toHaveAttribute("aria-disabled");
    expect(link("Changelog")).not.toHaveAttribute("aria-disabled");
  });
});

describe("with a base game save loaded", () => {
  it("disables Worlds rather than hiding it", () => {
    renderNav([DLCIds.Vanilla]);

    expect(link("Worlds")).toHaveAttribute("aria-disabled", "true");
  });

  it("gives Worlds a reason a base game player can read", () => {
    renderNav([DLCIds.Vanilla]);

    expect(
      screen.getByLabelText(
        "This is a base game save. Only Spaced Out! colonies span more than one asteroid.",
      ),
    ).toBeInTheDocument();
  });

  it("does not repeat the save lock note", () => {
    renderNav([DLCIds.Vanilla]);

    expect(screen.queryByText("Locked until a save is open")).toBeNull();
  });

  it("enables the entries that only needed a save", () => {
    renderNav([DLCIds.Vanilla]);

    expect(link("Duplicants")).not.toHaveAttribute("aria-disabled");
  });
});

describe("with a Spaced Out save loaded", () => {
  it("enables Worlds", () => {
    renderNav([DLCIds.SpacedOut]);

    expect(link("Worlds")).not.toHaveAttribute("aria-disabled");
  });

  it("drops the Worlds explanation", () => {
    renderNav([DLCIds.SpacedOut]);

    expect(
      screen.queryByLabelText(
        "This is a base game save. Only Spaced Out! colonies span more than one asteroid.",
      ),
    ).toBeNull();
  });
});
