import * as React from "react";

import { useTranslation } from "react-i18next";

import { Theme, makeStyles } from "@/styles";
import Divider from "@mui/material/Divider";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import useGameObjectWorlds from "@/services/oni-save/hooks/useGameObjectWorlds";
import { WorldGroup, worldDisplayName } from "@/services/oni-save/worlds";

import GeyserListItem from "./GeyserListItem";

export interface GeyserListProps {
  gameObjectIds: number[];
}

const ALL = "all";
const ELSEWHERE = "elsewhere";

const useStyles = makeStyles((theme: Theme) => ({
  tabs: {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  count: {
    marginLeft: theme.spacing(),
    opacity: 0.7,
  },
  heading: {
    margin: theme.spacing(2, 1.5, 0),
  },
  list: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    margin: theme.spacing(),
  },
  item: {
    margin: theme.spacing(0.5),
  },
}));

/**
 * The geysers, split by the asteroid each sits on.
 *
 * A tab strip picks one world or all of them; under All, every world gets a
 * heading. Cards are taller than a window, so a heading alone would be off
 * screen most of the time - the strip is what says which asteroids there are.
 * With everything on one world (any base game save, and many clusters) there
 * is nothing to pick, and this is a plain list.
 */
const GeyserList: React.FC<GeyserListProps> = ({ gameObjectIds }) => {
  const { t } = useTranslation();
  const classes = useStyles();
  const groups = useGameObjectWorlds(gameObjectIds);

  const [picked, setPicked] = React.useState<string | number>(ALL);

  const cards = (ids: number[]) => (
    <div className={classes.list}>
      {ids.map((gameObjectId) => (
        <GeyserListItem
          key={gameObjectId}
          className={classes.item}
          gameObjectId={gameObjectId}
        />
      ))}
    </div>
  );

  if (groups.length <= 1) {
    return cards(gameObjectIds);
  }

  const keyOf = (group: WorldGroup) => group.world?.id ?? ELSEWHERE;
  const nameOf = (group: WorldGroup) =>
    group.world
      ? worldDisplayName(group.world.templateData, t)
      : t("world.elsewhere");

  // A new save can drop the world that was picked; All is always there.
  const current = groups.some((group) => keyOf(group) === picked)
    ? picked
    : ALL;
  const shown = groups.find((group) => keyOf(group) === current);

  const label = (name: string, count: number) => (
    <>
      {name}
      <span className={classes.count}>{count}</span>
    </>
  );

  return (
    <>
      <Tabs
        className={classes.tabs}
        value={current}
        onChange={(_, value: string | number) => setPicked(value)}
        aria-label={t("world.pick_titlecase")}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab
          value={ALL}
          label={label(t("world.all_titlecase"), gameObjectIds.length)}
        />
        {groups.map((group) => (
          <Tab
            key={keyOf(group)}
            value={keyOf(group)}
            label={label(nameOf(group), group.gameObjectIds.length)}
          />
        ))}
      </Tabs>
      {shown
        ? cards(shown.gameObjectIds)
        : groups.map((group) => (
            <section key={keyOf(group)}>
              <Typography
                className={classes.heading}
                variant="h6"
                component="h2"
              >
                {nameOf(group)}
              </Typography>
              <Divider />
              {cards(group.gameObjectIds)}
            </section>
          ))}
    </>
  );
};

export default GeyserList;
