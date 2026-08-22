import { I18NState, defaultI18NState } from "@/services/i18n/state";
import { OniSaveState, defaultOniSaveState } from "@/services/oni-save/state";
import {
  OfflineModeState,
  defaultOfflineModeState,
} from "@/services/offline-mode/state";

export * from "./utils";

// Routing state is owned by react-router, not redux; nothing in the app ever
// selected off it, so there is no router slice here.
export interface AppState {
  services: {
    i18n: I18NState;
    oniSave: OniSaveState;
    offlineMode: OfflineModeState;
  };
}

export const defaultAppState: Readonly<AppState> = {
  services: {
    i18n: defaultI18NState,
    oniSave: defaultOniSaveState,
    offlineMode: defaultOfflineModeState,
  },
};
Object.freeze(defaultAppState);
