import { UnknownAction } from "redux";

import { OniSaveState, defaultOniSaveState } from "../state";

import {
  isImportFailedAction,
  isImportDismissErrorAction,
  isImportBehaviorsAction,
} from "../actions/import-behaviors";

export default function importFailedReducer(
  state: OniSaveState = defaultOniSaveState,
  action: UnknownAction,
): OniSaveState {
  if (isImportFailedAction(action)) {
    return { ...state, importError: action.payload.reason };
  }

  // Clearing on dismiss is obvious; clearing when a new import starts is not,
  // and matters - otherwise a second attempt opens on top of the last failure
  // and the user cannot tell which attempt the message belongs to.
  if (isImportDismissErrorAction(action) || isImportBehaviorsAction(action)) {
    if (state.importError === null) {
      return state;
    }
    return { ...state, importError: null };
  }

  return state;
}
