import { combineReducers, AnyAction } from "redux";

import { AppState, defaultAppState } from "@/state";

import i18nReducer from "@/services/i18n/reducer";
import oniSaveReducer from "@/services/oni-save/reducer";
import offlineModeReducer from "@/services/offline-mode/reducer";

const servicesReducer = combineReducers({
  i18n: i18nReducer,
  oniSave: oniSaveReducer,
  offlineMode: offlineModeReducer
});

export default function reducer(
  state: AppState = defaultAppState,
  action: AnyAction
): AppState {
  return {
    services: servicesReducer(state.services, action)
  };
}
