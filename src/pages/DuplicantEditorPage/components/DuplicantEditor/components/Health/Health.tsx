import * as React from "react";
import { MinionModifiersBehavior } from "@konove/oni-save-parser";
import { find } from "lodash";

import { Trans, useTranslation } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

import useBehavior from "@/services/oni-save/hooks/useBehavior";
import {
  DISEASE_AMOUNTS,
  FITNESS_AMOUNTS,
  IMMUNITY_AMOUNT,
  MIND_AMOUNTS,
  statName,
} from "@/services/oni-save/health";

import PanelHeading from "../PanelHeading";
import Amount from "./components/Amount";

export interface HealthProps {
  gameObjectId: number;
}

const styles = (theme: Theme) =>
  createStyles({
    group: {
      marginBottom: theme.spacing(2),
    },
    summary: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing(1),
      minHeight: 30,
    },
    // Wraps rather than ellipsising: naming what is in the group is the whole
    // point of collapsing it, and "Toxicity, Food Poisoning, Slime..." names
    // nothing.
    summaryText: {
      flex: 1,
      minWidth: 0,
    },
  });

type Props = HealthProps & WithStyles<typeof styles>;

const Health: React.FC<Props> = ({ classes, gameObjectId }) => {
  const { t } = useTranslation();
  const [showDiseases, setShowDiseases] = React.useState(false);
  const {
    extraData: { amounts },
  } = useBehavior(gameObjectId, MinionModifiersBehavior);

  const valueOf = (id: string) => {
    const amount = find(amounts, (x) => x.name === id);
    return (amount && amount.value.value) || 0;
  };

  // Eleven germ counters, and on a healthy duplicant every one of them is
  // zero. Eleven rows of nothing is what pushed the numbers that matter off
  // the screen, so they collapse until one of them is not zero or the reader
  // asks.
  const present = DISEASE_AMOUNTS.filter((id) => valueOf(id) > 0);
  const expanded = showDiseases || present.length > 0;

  return (
    <div>
      <div className={classes.group}>
        <PanelHeading
          i18nKey="duplicant_health.fitness_titlecase"
          fallback="Fitness"
        />
        {FITNESS_AMOUNTS.map((amountId) => (
          <Amount
            key={amountId}
            gameObjectId={gameObjectId}
            amountId={amountId}
          />
        ))}
      </div>

      <div className={classes.group}>
        <PanelHeading
          i18nKey="duplicant_health.mind_titlecase"
          fallback="Mind"
        />
        {MIND_AMOUNTS.map((amountId) => (
          <Amount
            key={amountId}
            gameObjectId={gameObjectId}
            amountId={amountId}
          />
        ))}
      </div>

      <div className={classes.group}>
        <PanelHeading
          i18nKey="duplicant_health.disease_titlecase"
          fallback="Disease"
          detail={
            present.length === 0
              ? t("duplicant_health.conditions.nothing_present", {
                  defaultValue: "nothing present",
                })
              : undefined
          }
        />
        <Amount gameObjectId={gameObjectId} amountId={IMMUNITY_AMOUNT} />
        {expanded ? (
          DISEASE_AMOUNTS.map((amountId) => (
            <Amount
              key={amountId}
              gameObjectId={gameObjectId}
              amountId={amountId}
            />
          ))
        ) : (
          <div className={classes.summary}>
            <Typography
              className={classes.summaryText}
              variant="body1"
              color="textSecondary"
            >
              {DISEASE_AMOUNTS.slice(0, 3)
                .map((id) => statName(id, t))
                .join(", ")}
              {DISEASE_AMOUNTS.length > 3 &&
                t("duplicant_health.conditions.and_more", {
                  defaultValue: " + {{count}} more",
                  count: DISEASE_AMOUNTS.length - 3,
                })}
            </Typography>
            <Link
              component="button"
              variant="body2"
              underline="hover"
              onClick={() => setShowDiseases(true)}
            >
              <Trans i18nKey="duplicant_health.conditions.all_zero">
                all 0
              </Trans>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default withStyles(styles)(Health);
