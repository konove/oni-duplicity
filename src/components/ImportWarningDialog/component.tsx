import * as React from "react";

import { Trans } from "react-i18next";

import { createStyles, withStyles, WithStyles } from "@/styles";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

export interface ImportWarningDialogProps {
  isOpen: boolean;
  onConfirm(): void;
  onCancel(): void;
}
const styles = createStyles({
  description: {
    whiteSpace: "pre-line"
  }
});

type Props = ImportWarningDialogProps & WithStyles<typeof styles>;
const ImportWarningDialog: React.FC<Props> = ({
  classes,
  isOpen,
  onConfirm,
  onCancel
}) => (
  <Dialog open={isOpen}>
    <DialogTitle>
      <Trans i18nKey="data.conditions.modified_titlecase">Data Modified</Trans>
    </DialogTitle>
    <DialogContent>
      <Typography className={classes.description}>
        <Trans i18nKey="data.prompts.modified-description" />
      </Typography>
      <Typography>
        <Trans i18nKey="dialog.queries.continue" />
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>
        <Trans i18nKey="dialog.verbs.cancel_titlecase">Cancel</Trans>
      </Button>
      <Button onClick={onConfirm}>
        <Trans i18nKey="data.verbs.import_titlecase">Import</Trans>
      </Button>
    </DialogActions>
  </Dialog>
);

export default withStyles(styles)(ImportWarningDialog);
