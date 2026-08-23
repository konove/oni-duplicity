import { UnknownAction } from "redux";

export const ACTION_ONISAVE_IMPORT_BEHAVIORS = "oni-save/import-behaviors";
export const importBehaviors = (gameObjectId: number, file: File) => ({
  type: ACTION_ONISAVE_IMPORT_BEHAVIORS as typeof ACTION_ONISAVE_IMPORT_BEHAVIORS,
  payload: { gameObjectId, file },
});
export type ImportBehaviorsAction = ReturnType<typeof importBehaviors>;

export const ACTION_ONISAVE_IMPORT_WARN_CHECKSUM =
  "oni-save/import/warn-checksum";
export const importWarnChecksum = () => ({
  type: ACTION_ONISAVE_IMPORT_WARN_CHECKSUM as typeof ACTION_ONISAVE_IMPORT_WARN_CHECKSUM,
});
export type ImportWarnChecksumAction = ReturnType<typeof importWarnChecksum>;
export function isImportWarnChecksumAction(
  action: UnknownAction,
): action is ImportWarnChecksumAction {
  return action.type === ACTION_ONISAVE_IMPORT_WARN_CHECKSUM;
}

export const ACTION_ONISAVE_IMPORT_CONFIRM = "oni-save/import/confirm";
export const importConfirm = (doImport: boolean) => ({
  type: ACTION_ONISAVE_IMPORT_CONFIRM as typeof ACTION_ONISAVE_IMPORT_CONFIRM,
  payload: doImport,
});
export type ImportConfirmAction = ReturnType<typeof importConfirm>;
export function isImportConfirmAction(
  action: UnknownAction,
): action is ImportWarnChecksumAction {
  return action.type === ACTION_ONISAVE_IMPORT_CONFIRM;
}

/**
 * Why an import did not happen. A reason rather than a message, so the text
 * stays in the translation files instead of being built in a saga.
 */
export type ImportFailureReason =
  "unreadable" | "invalid-json" | "invalid-shape" | "type-mismatch";

export const ACTION_ONISAVE_IMPORT_FAILED = "oni-save/import/failed";
export const importFailed = (reason: ImportFailureReason) => ({
  type: ACTION_ONISAVE_IMPORT_FAILED as typeof ACTION_ONISAVE_IMPORT_FAILED,
  payload: { reason },
});
export type ImportFailedAction = ReturnType<typeof importFailed>;
export function isImportFailedAction(
  action: UnknownAction,
): action is ImportFailedAction {
  return action.type === ACTION_ONISAVE_IMPORT_FAILED;
}

export const ACTION_ONISAVE_IMPORT_DISMISS_ERROR =
  "oni-save/import/dismiss-error";
export const importDismissError = () => ({
  type: ACTION_ONISAVE_IMPORT_DISMISS_ERROR as typeof ACTION_ONISAVE_IMPORT_DISMISS_ERROR,
});
export type ImportDismissErrorAction = ReturnType<typeof importDismissError>;
export function isImportDismissErrorAction(
  action: UnknownAction,
): action is ImportDismissErrorAction {
  return action.type === ACTION_ONISAVE_IMPORT_DISMISS_ERROR;
}

export function isImportBehaviorsAction(
  action: UnknownAction,
): action is ImportBehaviorsAction {
  return action.type === ACTION_ONISAVE_IMPORT_BEHAVIORS;
}
