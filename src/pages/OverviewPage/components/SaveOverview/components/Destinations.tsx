import * as React from "react";

import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useSelector } from "react-redux";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { dlcIdsSelector, hasDLCs } from "@/services/oni-save/selectors/dlc";
import useGameObjects from "@/services/oni-save/hooks/useGameObjects";
import { useMaterialList } from "@/services/oni-save/hooks/useMaterials";
import { DUPLICANT_GAMEOBJECT_TYPES } from "@/services/oni-save/duplicants";
import { GEYSER_GAMEOBJECT_TYPES } from "@/services/oni-save/geysers";
import { CREATURE_GAMEOBJECT_TYPES } from "@/services/oni-save/creatures";
import { WORLD_GAMEOBJECT_TYPE } from "@/services/oni-save/worlds";

import NavItems, { NavItem } from "@/nav-links";

interface Destination {
  /** The nav path, which is what ties a card to the entry it stands for. */
  path: string;
  /** How many of the thing this colony has, or null where a count is meaningless. */
  count: number | null;
  detailKey: string;
  cautionKey?: string;
}

/**
 * The Overview used to be a colony name and four numbers, which told a new
 * arrival nothing about where to go or what was safe to touch. These are the
 * editor's pages, each with what this save actually holds and - where it
 * matters - what makes it riskier than the rest.
 */
function useDestinations(): Destination[] {
  const duplicants = useGameObjects(DUPLICANT_GAMEOBJECT_TYPES).length;
  const geysers = useGameObjects(GEYSER_GAMEOBJECT_TYPES).length;
  const creatures = useGameObjects(CREATURE_GAMEOBJECT_TYPES).length;
  const worlds = useGameObjects(WORLD_GAMEOBJECT_TYPE).length;
  const materials = useMaterialList().length;

  return [
    {
      path: "/duplicants",
      count: duplicants,
      detailKey: "overview-page.destination_duplicants",
    },
    {
      path: "/geysers",
      count: geysers,
      detailKey: "overview-page.destination_geysers",
    },
    {
      path: "/creatures",
      count: creatures,
      detailKey: "overview-page.destination_creatures",
    },
    {
      path: "/worlds",
      count: worlds,
      detailKey: "overview-page.destination_worlds",
    },
    {
      path: "/materials",
      count: materials,
      detailKey: "overview-page.destination_materials",
      cautionKey: "overview-page.caution_materials",
    },
    {
      path: "/raw",
      count: null,
      detailKey: "overview-page.destination_raw",
      cautionKey: "overview-page.caution_raw",
    },
  ];
}

const Destinations: React.FC = () => {
  const { t } = useTranslation();
  const dlcIds = useSelector(dlcIdsSelector);
  const destinations = useDestinations();

  const navItemsByPath = new Map<string, NavItem>(
    NavItems.map((item) => [item.path, item]),
  );

  // The sidebar keeps a pack-gated entry visible and greyed, so the list never
  // changes length. Here the job is different: this is an inventory of one
  // save, and an area that save cannot contain is not part of it.
  const available = destinations.filter(({ path }) => {
    const requireDLC = navItemsByPath.get(path)?.requireDLC;
    return requireDLC === undefined || hasDLCs(dlcIds, requireDLC);
  });

  return (
    <Box>
      <Typography variant="h6" component="h2">
        <Trans i18nKey="overview-page.destinations_titlecase">
          What you can change
        </Trans>
      </Typography>
      <Box
        sx={{
          mt: 1.5,
          // Three to a row, on purpose rather than by whatever happens to fit:
          // the six destinations split into the four object pages and the two
          // that reach across the whole colony.
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 2,
        }}
      >
        {available.map(({ path, count, detailKey, cautionKey }) => {
          const item = navItemsByPath.get(path);
          const empty = count === 0;
          return (
            <Paper
              key={path}
              component={Link}
              to={path}
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                textDecoration: "none",
                color: "inherit",
                opacity: empty ? 0.6 : 1,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography
                  variant="subtitle1"
                  component="h3"
                  sx={{ flex: 1, minWidth: 0, fontWeight: 500 }}
                >
                  {item ? t(item.i18nKey, { defaultValue: item.name }) : path}
                </Typography>
                {count !== null && (
                  <Typography
                    variant="h6"
                    component="span"
                    sx={{
                      color: empty ? "text.disabled" : "primary.main",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {count}
                  </Typography>
                )}
              </Box>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mt: 0.5 }}
              >
                {empty ? (
                  <Trans i18nKey="overview-page.destination_empty">
                    Nothing of this kind in this colony.
                  </Trans>
                ) : (
                  <Trans i18nKey={detailKey} />
                )}
              </Typography>
              {cautionKey && (
                <Box
                  sx={{
                    mt: "auto",
                    pt: 1.25,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    color: "warning.light",
                  }}
                >
                  <WarningAmberIcon sx={{ fontSize: 14 }} />
                  <Typography variant="caption">
                    <Trans i18nKey={cautionKey} />
                  </Typography>
                </Box>
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
};
export default Destinations;
