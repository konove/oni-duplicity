import * as React from "react";

import { Trans, WithTranslation, withTranslation } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";
import Dialog from "@mui/material/Dialog";
import FormGroup from "@mui/material/FormGroup";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

import { effectName, sortEffectsByName } from "@/services/oni-save/effects";

export interface AddEffectDialogProps {
  open: boolean;
  availableEffects: string[];
  onClose(): void;
  onAddEffect(effect: string, time: number): void;
}

const styles = (theme: Theme) =>
  createStyles({
    cycleTime: {
      marginTop: theme.spacing(),
    },
  });

type Props = AddEffectDialogProps & WithTranslation & WithStyles<typeof styles>;

const AddEffectDialog: React.FC<Props> = ({
  classes,
  open,
  availableEffects,
  onClose,
  onAddEffect,
  t,
  i18n,
}) => {
  const [selectedEffect, setSelectedEffect] = React.useState("");
  const [timeRemaining, setTimeRemaining] = React.useState(5);
  return (
    <Dialog open={open} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">
        <Trans i18nKey="duplicant_effects.verbs.add_titlecase">
          Add Effect
        </Trans>
      </DialogTitle>
      <DialogContent>
        <FormGroup>
          <FormControl>
            <InputLabel htmlFor="duplicant-effect">
              <Trans i18nKey="duplicant_effect.noun_titlecase">Effect</Trans>
            </InputLabel>
            <Select
              value={selectedEffect}
              onChange={(e) => setSelectedEffect(e.target.value)}
              inputProps={{ id: "duplicant-effect" }}
            >
              {sortEffectsByName(availableEffects, t, i18n.language).map(
                (effect) => (
                  <MenuItem key={effect} value={effect}>
                    {effectName(effect, t)}
                  </MenuItem>
                ),
              )}
            </Select>
          </FormControl>
          <TextField
            className={classes.cycleTime}
            label={t("time_cycles.noun_titlecase")}
            type="number"
            value={timeRemaining}
            onChange={(e) => setTimeRemaining(Number(e.target.value))}
          />
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()}>
          <Trans i18nKey="dialog.verbs.cancel_titlecase">Cancel</Trans>
        </Button>
        <Button
          disabled={selectedEffect === "" || timeRemaining <= 0}
          onClick={() => {
            setSelectedEffect("");
            onAddEffect(selectedEffect, timeRemaining * 200);
          }}
        >
          <Trans i18nKey="duplicant_effects.verbs.add_titlecase">
            Add Effect
          </Trans>
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withStyles(styles)(withTranslation()(AddEffectDialog));
