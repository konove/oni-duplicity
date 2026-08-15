import * as React from "react";
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
  { key: "isDiscovered", label: "Discovered" },
  { key: "isDupeVisited", label: "Visited by a duplicant" },
  { key: "isRoverVisited", label: "Visited by a rover" },
  { key: "isSurfaceRevealed", label: "Surface revealed" },
] as const;

const WorldListItem: React.FC<WorldListItemProps> = ({
  className,
  gameObjectId,
}) => {
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
        <Typography variant="h6">{worldDisplayName(templateData)}</Typography>
        {isStartWorld && <Chip size="small" label="Starting world" />}
        {isModuleInterior && <Chip size="small" label="Rocket interior" />}
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
        label="Name"
        variant="standard"
        // The game falls back to the world's own name when this is empty, so
        // an empty field is meaningful rather than missing.
        placeholder={worldName.slice(worldName.lastIndexOf("/") + 1)}
        value={overrideName}
        onChange={(e) => onTemplateDataModify({ overrideName: e.target.value })}
      />

      {TOGGLES.map(({ key, label }) => (
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
          label={label}
        />
      ))}

      <TextField
        className={styles.field}
        label="Sunlight"
        variant="standard"
        type="number"
        value={templateData.sunlight}
        onChange={(e) =>
          onTemplateDataModify({ sunlight: Number(e.target.value) })
        }
      />
      <TextField
        className={styles.field}
        label="Cosmic radiation"
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
