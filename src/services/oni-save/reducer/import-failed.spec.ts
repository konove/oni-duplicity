import { defaultOniSaveState, OniSaveState } from "../state";
import {
  importFailed,
  importDismissError,
  importBehaviors,
} from "../actions/import-behaviors";

import importFailedReducer from "./import-failed";

const file = { name: "export.json" } as File;

describe("importFailedReducer", () => {
  it("records the reason an import was refused", () => {
    const result = importFailedReducer(
      defaultOniSaveState,
      importFailed("invalid-json"),
    );

    expect(result.importError).toBe("invalid-json");
  });

  it("clears the error when it is dismissed", () => {
    const state: OniSaveState = {
      ...defaultOniSaveState,
      importError: "type-mismatch",
    };

    const result = importFailedReducer(state, importDismissError());

    expect(result.importError).toBeNull();
  });

  // Otherwise a second attempt opens on top of the previous failure and the
  // user cannot tell which attempt the message belongs to.
  it("clears the error when another import starts", () => {
    const state: OniSaveState = {
      ...defaultOniSaveState,
      importError: "unreadable",
    };

    const result = importFailedReducer(state, importBehaviors(1, file));

    expect(result.importError).toBeNull();
  });

  it("leaves state untouched when there is nothing to clear", () => {
    const result = importFailedReducer(
      defaultOniSaveState,
      importDismissError(),
    );

    expect(result).toBe(defaultOniSaveState);
  });

  it("ignores unrelated actions", () => {
    const state: OniSaveState = {
      ...defaultOniSaveState,
      importError: "invalid-shape",
    };

    const result = importFailedReducer(state, { type: "another-action" });

    expect(result).toBe(state);
  });
});
