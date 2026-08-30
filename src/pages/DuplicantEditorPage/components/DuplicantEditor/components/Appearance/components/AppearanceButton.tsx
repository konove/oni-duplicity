import * as React from "react";

import { Trans, useTranslation } from "react-i18next";

import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";

import Appearance from "../Appearance";

export interface AppearanceButtonProps {
  className?: string;
  gameObjectId: number;
}

/**
 * Appearance, behind a button.
 *
 * Thirty-three hairstyles, plus heads and eyes, is a wall of thumbnails - and
 * it is a browse rather than a field. Everything else on this screen is a
 * number or a chip you came to change; this is a thing you go and look
 * through, which is what a dialog is for.
 */
const AppearanceButton: React.FC<AppearanceButtonProps> = ({
  className,
  gameObjectId,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <React.Fragment>
      <Chip
        className={className}
        size="small"
        clickable
        onClick={() => setIsOpen(true)}
        label={t("duplicant_appearance.verbs.change_titlecase", {
          defaultValue: "Change appearance",
        })}
      />
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Trans i18nKey="duplicant_appearance.noun_titlecase">
            Appearance
          </Trans>
        </DialogTitle>
        <DialogContent dividers>
          <Appearance gameObjectId={gameObjectId} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOpen(false)}>
            <Trans i18nKey="dialog.verbs.close_titlecase">Close</Trans>
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

export default AppearanceButton;
