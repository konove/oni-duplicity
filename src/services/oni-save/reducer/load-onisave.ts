import { UnknownAction } from "redux";

import { OniSaveState, defaultOniSaveState } from "../state";
import { isLoadOniSaveAction } from "../actions/load-onisave";

export default function loadExampleSaveReducer(
  state: OniSaveState = defaultOniSaveState,
  action: UnknownAction,
): OniSaveState {
  if (!isLoadOniSaveAction(action)) {
    return state;
  }

  const { file } = action.payload;

  return {
    ...state,
    loadingFile: file,
  };
}
