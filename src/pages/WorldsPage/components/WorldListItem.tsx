import * as React from "react";

import { useTranslation } from "react-i18next";
import classnames from "classnames";

import { Theme, makeStyles } from "@/styles";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Chip from "@mui/material/Chip";

import useBehavior from "@/services/oni-save/hooks/useBehavior";
import {
  WorldContainerBehavior,
  worldDisplayName,
} from "@/services/oni-save/worlds";

export interface WorldListItemProps {
  gameObjectId: number;
  className?: string;
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: theme.spacing(45),
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(2),
  },
  titleBar: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(),
    marginBottom: theme.spacing(),
  },
  subtitle: {
    marginBottom: theme.spacing(),
  },
  field: {
    marginTop: theme.spacing(),
  },
}));

const TOGGLES = [
  { key: "isDiscovered", i18nKey: "world.discovered" },
  { key: "isDupeVisited", i18nKey: "world.dupe_visited" },
  { key: "isRoverVisited", i18nKey: "world.rover_visited" },
  { key: "isSurfaceRevealed", i18nKey: "world.surface_revealed" },
] as const;

const WorldListItem: React.FC<WorldListItemProps> = ({
  className,
  gameObjectId,
}) => {
  const { t } = useTranslation();
  const styles = useStyles();
  const { templateData, onTemplateDataModify } =
    useBehavior<WorldContainerBehavior>(gameObjectId, WorldContainerBehavior);

  // The Asteroid group also holds rocket interiors, which have no
  // WorldContainer worth showing, and a save may carry one mid-migration.
  if (!templateData) {
    return null;
  }

  const {
    id,
    worldName,
    overrideName,
    worldSize,
    isStartWorld,
    isModuleInterior,
  } = templateData;

  return (
    <Paper className={classnames(className, styles.root)}>
      <div className={styles.titleBar}>
        <Typography variant="h6">
          {worldDisplayName(templateData, t)}
        </Typography>
        {isStartWorld && (
          <Chip size="small" label={t("world.starting_world")} />
        )}
        {isModuleInterior && (
          <Chip size="small" label={t("world.rocket_interior")} />
        )}
      </div>
      <Typography
        className={styles.subtitle}
        variant="body2"
        color="textSecondary"
      >
        #{id} &middot; {worldName} &middot; {worldSize.x}&times;{worldSize.y}
      </Typography>
      <Divider />

      <TextField
        className={styles.field}
        label={t("world.name_titlecase")}
        variant="standard"
        // The game falls back to the world's own name when this is empty, so
        // an empty field is meaningful rather than missing.
        placeholder={worldName.slice(worldName.lastIndexOf("/") + 1)}
        value={overrideName}
        onChange={(e) => onTemplateDataModify({ overrideName: e.target.value })}
      />

      {TOGGLES.map(({ key, i18nKey }) => (
        <FormControlLabel
          key={key}
          control={
            <Switch
              checked={Boolean(templateData[key])}
              onChange={(e) =>
                onTemplateDataModify({ [key]: e.target.checked })
              }
            />
          }
          label={t(i18nKey)}
        />
      ))}

      <TextField
        className={styles.field}
        label={t("world.sunlight_titlecase")}
        variant="standard"
        type="number"
        value={templateData.sunlight}
        onChange={(e) =>
          onTemplateDataModify({ sunlight: Number(e.target.value) })
        }
      />
      <TextField
        className={styles.field}
        label={t("world.cosmic_radiation_titlecase")}
        variant="standard"
        type="number"
        value={templateData.cosmicRadiation}
        onChange={(e) =>
          onTemplateDataModify({ cosmicRadiation: Number(e.target.value) })
        }
      />
    </Paper>
  );
};

export default WorldListItem;
