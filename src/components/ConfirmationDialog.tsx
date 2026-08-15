import * as React from "react";

import { Trans } from "react-i18next";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export interface ConfirmationDialogProps {
  title: string;
  message: string;
  onConfirm(): void;
  onCancel?(): void;
  children(props: ConfirmationDialogRenderProps): React.ReactNode;
}
export interface ConfirmationDialogRenderProps {
  onClick(): void;
}

type Props = ConfirmationDialogProps;
const ConfirmationDialog: React.FC<Props> = ({
  title,
  message,
  onConfirm,
  onCancel,
  children
}) => {
  const [isOpen, setOpen] = React.useState(false);

  const onCancelClick = React.useCallback(() => {
    setOpen(false);
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  const onConfirmClick = React.useCallback(() => {
    setOpen(false);
    onConfirm();
  }, [onConfirm]);

  return (
    <>
      {children({ onClick: () => setOpen(true) })}
      <Dialog open={isOpen}>
        {isOpen && (
          <>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
              <Typography>{message}</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={onCancelClick}>
                <Trans i18nKey="dialog.verbs.cancel_titlecase" />
              </Button>
              <Button onClick={onConfirmClick}>
                <Trans i18nKey="dialog.verbs.confirm_titlecase" />
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};
export default ConfirmationDialog;
