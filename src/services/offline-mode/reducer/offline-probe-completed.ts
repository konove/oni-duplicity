import { UnknownAction } from "redux";

import { defaultOfflineModeState, OfflineModeState } from "../state";
import { isOfflineProbeCompletedAction } from "../actions/offline-probe-completed";

export default function offlineProbeCompletedReducer(
  state: OfflineModeState = defaultOfflineModeState,
  action: UnknownAction,
): OfflineModeState {
  if (!isOfflineProbeCompletedAction(action)) {
    return state;
  }

  const { offlineEnabled, offlineSupported } = action.payload;
  return {
    ...state,
    enabled: offlineEnabled,
    supported: offlineSupported,
  };
}
