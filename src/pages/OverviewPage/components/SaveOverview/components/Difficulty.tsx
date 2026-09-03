import * as React from "react";

import { Trans, useTranslation } from "react-i18next";
import { QualityLevelSettingValues } from "@konove/oni-save-parser";

import { createStyles, withStyles, WithStyles } from "@/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";

import useDifficulty from "@/services/oni-save/hooks/useDifficulty";
import { keysOfType } from "@/utils";

// Sandbox mode has been asked for three times on the tracker while shipping the
// whole time, because it sat in this grid labelled "SandboxMode" between
// "CalorieBurn" and "ImmuneSystem". It gets its own switch.
const SANDBOX: keyof typeof QualityLevelSettingValues = "SandboxMode";

const styles = createStyles({
  // Five three-value dropdowns used to be one two-column grid whose second
  // column was `auto`, so every Select stretched the full width of the page.
  // One setting per row, each Select the same readable width, so the list reads
  // top to bottom and the values line up against each other.
  table: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginTop: "8px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  // Wide enough for "Stress Reactions" to stay on one line.
  label: {
    width: "160px",
    flex: "none",
  },
  select: {
    width: "320px",
    flex: "none",
  },
});

export interface DifficultyProps {
  className?: string;
}

type Props = DifficultyProps & WithStyles<typeof styles>;

const Difficulty: React.FC<Props> = ({ className, classes }) => {
  const { t } = useTranslation();
  const { difficulty, onModifyDifficulty } = useDifficulty();

  // The game's own words. It calls ImmuneSystem "Disease" and CalorieBurn
  // "Hunger", and its levels are things like "Germ Susceptible" rather than
  // "Weak" - so the raw keys were not just ugly, they were the wrong words.
  const settingName = (setting: string) =>
    t(`oni:DIFFICULTY.${setting}.NAME`, { defaultValue: setting });
  const levelName = (setting: string, value: string) =>
    t(`oni:DIFFICULTY.${setting}.${value.toUpperCase()}`, {
      defaultValue: value,
    });

  return (
    <div className={className}>
      <Typography variant="h6" component="h2">
        <Trans i18nKey="overview-page.difficulty_titlecase">Difficulty</Trans>
      </Typography>
      {difficulty[SANDBOX] != null && (
        <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
          <FormControlLabel
            control={
              <Switch
                checked={difficulty[SANDBOX] === "Enabled"}
                onChange={(e) =>
                  onModifyDifficulty(
                    SANDBOX,
                    e.target.checked ? "Enabled" : "Disabled",
                  )
                }
              />
            }
            label={settingName(SANDBOX)}
          />
          <Typography variant="body2" color="textSecondary">
            <Trans i18nKey="overview-page.sandbox_hint">
              Unlocks the game&apos;s own build-anything tools next time you
              play.
            </Trans>
          </Typography>
        </Box>
      )}
      <div className={classes.table}>
        {keysOfType(difficulty)
          .filter((name) => name !== SANDBOX)
          .map((name) => (
            <div key={name} className={classes.row}>
              <Typography className={classes.label}>
                {settingName(name)}
              </Typography>
              <Select
                className={classes.select}
                value={difficulty[name]}
                onChange={(e) => onModifyDifficulty(name, e.target.value)}
              >
                {QualityLevelSettingValues[name].map((value) => (
                  <MenuItem key={value} value={value}>
                    {levelName(name, value)}
                  </MenuItem>
                ))}
              </Select>
            </div>
          ))}
      </div>
    </div>
  );
};

export default withStyles(styles)(Difficulty);
