import { UnknownAction } from "redux";

export const ACTION_SET_OFFLINE_ENABLED = "@offline-mode/set-offline-enabled" as const;
export const setOfflineEnabled = (enabled: boolean) => ({
  type: ACTION_SET_OFFLINE_ENABLED,
  payload: { enabled }
});
export type SetOfflineEnabledAction = ReturnType<typeof setOfflineEnabled>;
export function isSetOfflineEnabledAction(
  action: UnknownAction
): action is SetOfflineEnabledAction {
  return action.type === ACTION_SET_OFFLINE_ENABLED;
}
