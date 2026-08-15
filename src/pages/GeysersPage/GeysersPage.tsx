import * as React from "react";

import { WithTranslation, withTranslation } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";

import useGameObjects from "@/services/oni-save/hooks/useGameObjects";
import {
  GEYSER_GAMEOBJECT_TYPES,
  UNEDITABLE_GEYSER_TYPES,
} from "@/services/oni-save/geysers";

import Typography from "@mui/material/Typography";

import PageContainer from "@/components/PageContainer";
import RedirectIfNoSave from "@/components/RedirectIfNoSave";
import GeyserListItem from "./components/GeyserListItem";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      margin: theme.spacing(),
    },
    item: {
      margin: theme.spacing(0.5),
    },
    empty: {
      margin: theme.spacing(2),
    },
  });

type Props = WithStyles<typeof styles> & WithTranslation;

const GeysersPage: React.FC<Props> = ({ classes, t }) => {
  const gameObjectIds = useGameObjects(GEYSER_GAMEOBJECT_TYPES);

  // A colony can legitimately have no geysers, and an Aquatic one can have
  // geysers this editor cannot touch. Both used to render an empty page with
  // no explanation.
  const uneditable = useGameObjects(UNEDITABLE_GEYSER_TYPES);

  return (
    <PageContainer title={t("geyser.noun_titlecase_plural")}>
      <RedirectIfNoSave />
      {gameObjectIds.length === 0 && (
        <Typography className={classes.empty}>
          {uneditable.length > 0
            ? `This colony's ${uneditable.length} geyser-like features are Aquatic Planet Pack ones, which store no emission settings for the editor to change.`
            : "This colony has no geysers."}
        </Typography>
      )}
      <div className={classes.root}>
        {gameObjectIds.map((gameObjectId) => (
          <GeyserListItem
            key={gameObjectId}
            className={classes.item}
            gameObjectId={gameObjectId}
          />
        ))}
      </div>
    </PageContainer>
  );
};

export default withStyles(styles)(withTranslation()(GeysersPage));
