import * as React from "react";

import { useSelector, useDispatch } from "react-redux";
import { Trans, useTranslation } from "react-i18next";

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import {
  ImportFailureReason,
  importDismissError,
} from "@/services/oni-save/actions/import-behaviors";
import { importErrorSelector } from "@/services/oni-save/selectors/ui-state";

// The saga reports a reason; the wording lives here so it can be translated.
const REASON_KEYS: Record<ImportFailureReason, string> = {
  unreadable: "data.errors.unreadable",
  "invalid-json": "data.errors.invalid_json",
  "invalid-shape": "data.errors.invalid_shape",
  "type-mismatch": "data.errors.type_mismatch",
};

const ImportErrorDialog: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const reason = useSelector(importErrorSelector);

  const onDismiss = React.useCallback(() => {
    dispatch(importDismissError());
  }, [dispatch]);

  return (
    <Dialog open={reason != null} onClose={onDismiss}>
      <DialogTitle>
        <Trans i18nKey="data.conditions.import_failed_titlecase">
          Import Failed
        </Trans>
      </DialogTitle>
      <DialogContent>
        <Typography>{reason ? t(REASON_KEYS[reason]) : null}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onDismiss}>
          <Trans i18nKey="dialog.verbs.close_titlecase">Close</Trans>
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportErrorDialog;
