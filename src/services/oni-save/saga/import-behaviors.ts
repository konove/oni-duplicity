import { takeEvery, call, select, put, take } from "redux-saga/effects";
import objectHash from "object-hash";

import {
  ACTION_ONISAVE_IMPORT_BEHAVIORS,
  ImportBehaviorsAction,
  importWarnChecksum,
  importFailed,
  ACTION_ONISAVE_IMPORT_CONFIRM,
} from "../actions/import-behaviors";
import { mergeBehaviors } from "../actions/merge-behaviors";

import { gameObjectTypesByIdSelector } from "../selectors/game-objects";
import { SagaIterator } from "redux-saga";

export default function* importBehaviorsSaga() {
  yield takeEvery(ACTION_ONISAVE_IMPORT_BEHAVIORS, handleImportBehaviorsSaga);
}

export function* handleImportBehaviorsSaga(
  action: ImportBehaviorsAction,
): SagaIterator {
  const { gameObjectId, file } = action.payload;

  // A rejected read used to escape the saga entirely, taking the import with it
  // and reporting nothing.
  let contentStr: string;
  try {
    contentStr = yield call(readFile, file);
  } catch {
    yield put(importFailed("unreadable"));
    return;
  }

  let content: any;
  try {
    content = JSON.parse(contentStr);
  } catch {
    yield put(importFailed("invalid-json"));
    return;
  }

  if (!isExportedBehaviors(content)) {
    yield put(importFailed("invalid-shape"));
    return;
  }

  const sha1 = content.$sha1;
  delete content.$sha1;
  const contentSha1 = objectHash(content, { algorithm: "sha1" });
  if (sha1 !== contentSha1) {
    yield put(importWarnChecksum());
    const action = yield take(ACTION_ONISAVE_IMPORT_CONFIRM);
    const shouldContinue = action.payload;
    if (!shouldContinue) {
      return;
    }
  }

  const { gameObjectType, behaviors } = content;

  const gameObjectTypesById = yield select(gameObjectTypesByIdSelector);
  if (gameObjectTypesById[gameObjectId] !== gameObjectType) {
    yield put(importFailed("type-mismatch"));
    return;
  }

  yield put(mergeBehaviors(gameObjectId, behaviors));
}

/**
 * Valid JSON is not the same as valid export data. Without this a file that
 * parses but carries nothing useful reaches mergeBehaviors, which then writes
 * undefined into the save.
 *
 * `behaviors` is a record keyed by behavior name, not an array - see
 * buildExportObject in the export saga. Checking for an array here rejects
 * every real export.
 */
function isExportedBehaviors(content: unknown): boolean {
  if (typeof content !== "object" || content === null) {
    return false;
  }
  const { gameObjectType, behaviors } = content as Record<string, unknown>;
  return (
    typeof gameObjectType === "string" &&
    typeof behaviors === "object" &&
    behaviors !== null &&
    !Array.isArray(behaviors)
  );
}

function readFile(file: File): Promise<string> {
  const reader = new FileReader();
  return new Promise<string>((accept, reject) => {
    reader.onload = () => {
      accept(reader.result as string);
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read import file."));
    };
    reader.readAsText(file);
  });
}
