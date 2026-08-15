import * as React from "react";

import { Theme, makeStyles } from "@/styles";
import Typography from "@mui/material/Typography";

import useGameObjects from "@/services/oni-save/hooks/useGameObjects";
import { WORLD_GAMEOBJECT_TYPE } from "@/services/oni-save/worlds";

import PageContainer from "@/components/PageContainer";
import RedirectIfNoSave from "@/components/RedirectIfNoSave";

import WorldListItem from "./components/WorldListItem";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    overflow: "auto",
    margin: theme.spacing(),
  },
  item: {
    margin: theme.spacing(0.5),
  },
  empty: {
    margin: theme.spacing(2),
  },
}));

const WorldsPage: React.FC = () => {
  const classes = useStyles();
  const gameObjectIds = useGameObjects(WORLD_GAMEOBJECT_TYPE);

  return (
    <PageContainer title="Worlds">
      <RedirectIfNoSave />
      {gameObjectIds.length === 0 && (
        <Typography className={classes.empty}>
          This save has no asteroids. Only Spaced Out! saves model the colony as
          a cluster of worlds.
        </Typography>
      )}
      <div className={classes.root}>
        {gameObjectIds.map((id) => (
          <WorldListItem key={id} className={classes.item} gameObjectId={id} />
        ))}
      </div>
    </PageContainer>
  );
};

export default WorldsPage;
