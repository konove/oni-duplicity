import { put } from "redux-saga/effects";

import { importBehaviors, importFailed } from "../actions/import-behaviors";

import { handleImportBehaviorsSaga } from "./import-behaviors";

const file = { name: "export.json" } as File;

/** Steps past the file read, handing the saga whatever the file contained. */
function runWithFileContents(contents: string) {
  const saga = handleImportBehaviorsSaga(importBehaviors(1, file));
  saga.next(); // yields call(readFile, file)
  return saga.next(contents);
}

describe("handleImportBehaviorsSaga", () => {
  it("reports a file that is not JSON", () => {
    const result = runWithFileContents("this is not json");

    expect(result.value).toEqual(put(importFailed("invalid-json")));
  });

  it("reports JSON that is not export data", () => {
    const result = runWithFileContents(JSON.stringify({ hello: "world" }));

    expect(result.value).toEqual(put(importFailed("invalid-shape")));
  });

  // behaviors is a record keyed by behavior name, not an array. An earlier
  // version of the shape check tested Array.isArray and would have rejected
  // every real export with "invalid-shape".
  it("accepts the shape the export saga actually writes", () => {
    const result = runWithFileContents(
      JSON.stringify({
        gameObjectType: "Minion",
        behaviors: { "Klei.AI.Traits": { templateData: { TraitIds: [] } } },
      }),
    );

    expect(result.value).not.toEqual(put(importFailed("invalid-shape")));
  });

  it("rejects an array of behaviors, which is not what export writes", () => {
    const result = runWithFileContents(
      JSON.stringify({ gameObjectType: "Minion", behaviors: [] }),
    );

    expect(result.value).toEqual(put(importFailed("invalid-shape")));
  });

  it("reports a file it could not read at all", () => {
    const saga = handleImportBehaviorsSaga(importBehaviors(1, file));
    saga.next(); // yields call(readFile, file)

    // A rejected read used to escape the saga entirely and report nothing.
    const result = saga.throw(new Error("boom"));

    expect(result.value).toEqual(put(importFailed("unreadable")));
  });
});
