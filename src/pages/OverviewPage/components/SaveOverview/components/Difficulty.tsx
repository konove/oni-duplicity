import * as React from "react";

import { Trans, useTranslation } from "react-i18next";
import { QualityLevelSettingValues } from "oni-save-parser";

import { createStyles, withStyles, WithStyles } from "@/styles";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
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
  table: {
    display: "grid",
    gridTemplateColumns: "minmax(min-content, 200px) auto",
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
      <Typography variant="h6">
        <Trans i18nKey="overview-page.difficulty_titlecase">Difficulty</Trans>
      </Typography>
      <Divider />
      {difficulty[SANDBOX] != null && (
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
      )}
      <div className={classes.table}>
        {keysOfType(difficulty)
          .filter((name) => name !== SANDBOX)
          .map((name) => (
            <React.Fragment key={name}>
              <Typography>{settingName(name)}</Typography>
              <Select
                value={difficulty[name]}
                onChange={(e) => onModifyDifficulty(name, e.target.value)}
              >
                {QualityLevelSettingValues[name].map((value) => (
                  <MenuItem key={value} value={value}>
                    {levelName(name, value)}
                  </MenuItem>
                ))}
              </Select>
            </React.Fragment>
          ))}
      </div>
    </div>
  );
};

export default withStyles(styles)(Difficulty);
