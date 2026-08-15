import * as React from "react";
import { BehaviorName } from "oni-save-parser";

import { withTranslation, WithTranslation } from "react-i18next";

import Dialog from "@mui/material/Dialog";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";

export interface BehaviorChoice {
  name: string;
  i18nKey: string;
  behavior: BehaviorName<any>;
}

export interface BehaviorChooserDialogProps {
  title: string;
  applyText: string;
  open: boolean;
  choices: BehaviorChoice[];
  onApply(behaviors: string[]): void;
  onCancel(): void;
}
type Props = BehaviorChooserDialogProps & WithTranslation;
const BehaviorChooserDialog: React.FC<Props> = ({
  title,
  applyText,
  open,
  choices,
  onApply,
  onCancel,
  t
}) => {
  const [selectedTargets, setSelectedTargets] = React.useState<string[]>([]);
  const onCheckboxChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        // Add item
        setSelectedTargets([...selectedTargets, e.target.value]);
      } else {
        // Remove item
        setSelectedTargets(selectedTargets.filter(x => x !== e.target.value));
      }
    },
    [selectedTargets, setSelectedTargets]
  );
  const onApplyClick = React.useCallback(() => {
    onApply(selectedTargets);
  }, [selectedTargets, onApply]);
  return (
    <Dialog open={open} airia-labeledby="behavior-chooser-dialog-title">
      {open && (
        <React.Fragment>
          <DialogTitle id="behavior-chooser-dialog-title">{title}</DialogTitle>
          <DialogContent>
            {choices.map(({ name, i18nKey, behavior }) => (
              <FormControlLabel
                key={behavior}
                control={
                  <Checkbox
                    checked={selectedTargets.indexOf(behavior) !== -1}
                    value={behavior}
                    onChange={onCheckboxChange}
                    color="primary"
                  />
                }
                label={t(i18nKey, { defaultValue: name })}
              />
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={onCancel}>
              {t("dialog.verbs.cancel_titlecase", { defaultValue: "Cancel" })}
            </Button>
            <Button onClick={onApplyClick} autoFocus>
              {applyText}
            </Button>
          </DialogActions>
        </React.Fragment>
      )}
    </Dialog>
  );
};

export default withTranslation()(BehaviorChooserDialog);
