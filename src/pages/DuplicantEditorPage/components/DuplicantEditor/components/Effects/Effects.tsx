import * as React from "react";
import { AIEffectsBehavior } from "oni-save-parser";
import { merge } from "lodash";

import { WithTranslation, withTranslation } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";
import Typography from "@mui/material/Typography";

import useBehavior from "@/services/oni-save/hooks/useBehavior";
import { effectName, sortEffectsByName } from "@/services/oni-save/effects";

import CommitTextField from "@/components/CommitTextField";

import PanelHeading from "../PanelHeading";
import AddEffectButton from "./components/AddEffectButton";

export interface EffectsProps {
  gameObjectId: number;
}

/**
 * What the editor has always divided `timeRemaining` by to show cycles.
 *
 * Inherited, and not verified against the game: a cycle is 600 seconds, so if
 * `timeRemaining` is seconds this is out by a factor of three. Left alone
 * because changing it would silently move every number the editor has ever
 * shown, and nothing here establishes which is right.
 */
const TIME_PER_CYCLE = 200;

const styles = (theme: Theme) =>
  createStyles({
    row: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing(1),
      minWidth: 0,
      height: 30,
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    name: {
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
      fontSize: 13,
      MozAppearance: "textfield",
      "&::-webkit-outer-spin-button": { WebkitAppearance: "none", margin: 0 },
      "&::-webkit-inner-spin-button": { WebkitAppearance: "none", margin: 0 },
    },
    unit: {
      flexShrink: 0,
    },
    add: {
      marginTop: theme.spacing(1),
    },
    none: {
      minHeight: 30,
      display: "flex",
      alignItems: "center",
    },
  });

type Props = EffectsProps & WithStyles<typeof styles> & WithTranslation;

const Effects: React.FC<Props> = ({ classes, gameObjectId, t, i18n }) => {
  const { templateData, onTemplateDataModify } = useBehavior(
    gameObjectId,
    AIEffectsBehavior,
  );

  // Display order only. Committing below still uses each effect's original
  // index, so reordering the rows cannot edit the wrong entry.
  const ordered = sortEffectsByName(
    templateData.saveLoadEffects.map((x) => x.id),
    t,
    i18n.language,
  ).map((id) => {
    const index = templateData.saveLoadEffects.findIndex((x) => x.id === id);
    return { ...templateData.saveLoadEffects[index], index };
  });

  return (
    <div>
      <PanelHeading
        i18nKey="duplicant_effect.noun_titlecase_plural"
        fallback="Effects"
        detail={t("duplicant_effect.conditions.running_count", {
          defaultValue: "{{count}} running",
          count: ordered.length,
        })}
      />
      {ordered.length === 0 && (
        <Typography
          className={classes.none}
          variant="body2"
          color="textSecondary"
        >
          {t("duplicant_effect.conditions.none", { defaultValue: "None" })}
        </Typography>
      )}
      {ordered.map(({ id, timeRemaining, index }) => (
        <div key={id} className={classes.row}>
          <Typography className={classes.name} variant="body2">
            {effectName(id, t)}
          </Typography>
          <CommitTextField
            className={classes.field}
            variant="standard"
            type="number"
            style={{ width: "6ch" }}
            slotProps={{ htmlInput: { className: classes.fieldText } }}
            value={(timeRemaining / TIME_PER_CYCLE).toFixed(2)}
            onCommit={(value) =>
              onTemplateDataModify({
                saveLoadEffects: merge([], templateData.saveLoadEffects, {
                  [index]: {
                    id,
                    timeRemaining: Number(value) * TIME_PER_CYCLE,
                  },
                }),
              })
            }
          />
          <Typography
            className={classes.unit}
            variant="caption"
            color="textSecondary"
          >
            {t("time_cycles.noun_lowercase_plural", { defaultValue: "cycles" })}
          </Typography>
        </div>
      ))}
      <div className={classes.add}>
        <AddEffectButton gameObjectId={gameObjectId} />
      </div>
    </div>
  );
};

export default withStyles(styles)(withTranslation()(Effects));
