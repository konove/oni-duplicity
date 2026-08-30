import * as React from "react";

import { Trans } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";

export interface ExperienceProps {
  className?: string;
  experience: number;
  setExperience(experience: number): void;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing(1),
      minWidth: 0,
    },
    label: {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    field: {
      flexShrink: 0,
    },
    fieldText: {
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      padding: theme.spacing(0.25, 0.75),
      fontSize: 16,
      MozAppearance: "textfield",
      "&::-webkit-outer-spin-button": { WebkitAppearance: "none", margin: 0 },
      "&::-webkit-inner-spin-button": { WebkitAppearance: "none", margin: 0 },
    },
  });

type Props = ExperienceProps & WithStyles<typeof styles>;

const Experience: React.FC<Props> = ({
  className,
  classes,
  experience,
  setExperience,
}) => {
  const onSetExperience = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setExperience(Number(e.target.value));
    },
    [setExperience],
  );

  // The game writes this as a long float; two places is as much as anyone can
  // act on, and the full value is one keystroke away in the field itself.
  const shown = Number.isInteger(experience)
    ? String(experience)
    : experience.toFixed(2);

  return (
    <div className={className}>
      <div className={classes.root}>
        <Typography className={classes.label} variant="body1">
          <Trans i18nKey="duplicant_skills.experience_titlecase">
            Experience
          </Trans>
        </Typography>
        <TextField
          className={classes.field}
          variant="standard"
          type="number"
          style={{ width: `calc(${Math.max(shown.length, 4)}ch + 12px)` }}
          slotProps={{ htmlInput: { className: classes.fieldText } }}
          value={shown}
          onChange={onSetExperience}
        />
      </div>
    </div>
  );
};

export default withStyles(styles)(Experience);
