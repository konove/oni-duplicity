import * as React from "react";
import { MinionModifiersBehavior } from "oni-save-parser";
import { find, findIndex, merge } from "lodash";

import { useTranslation } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";

import useBehavior from "@/services/oni-save/hooks/useBehavior";
import CommitTextField from "@/components/CommitTextField";
import {
  amountFill,
  amountMaximum,
  formatAmount,
  isOffScale,
  statDescKey,
  statName,
} from "@/services/oni-save/health";

export interface AmountProps {
  className?: string;
  gameObjectId: number;
  amountId: string;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {
      marginBottom: theme.spacing(1.25),
    },
    row: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing(1),
      minWidth: 0,
      marginBottom: theme.spacing(0.5),
    },
    label: {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    // Sized to the value, like the attribute fields, so a six-digit calorie
    // count and a two-digit stress do not both reserve room for the worst case.
    field: {
      flexShrink: 0,
    },
    fieldText: {
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      padding: theme.spacing(0.25, 0.75),
      fontSize: 13,
      // The spinners appear on hover and eat ~17px, which clips a value in a
      // field sized to its content.
      MozAppearance: "textfield",
      "&::-webkit-outer-spin-button": { WebkitAppearance: "none", margin: 0 },
      "&::-webkit-inner-spin-button": { WebkitAppearance: "none", margin: 0 },
    },
    maximum: {
      flexShrink: 0,
      fontVariantNumeric: "tabular-nums",
    },
    track: {
      height: 4,
      borderRadius: 2,
    },
    // A value the scale cannot hold is worth saying out loud rather than
    // drawing as a full bar - see the bundled save's 200 breath out of 100.
    offScale: {
      color: theme.palette.warning.light,
    },
  });

type Props = AmountProps & WithStyles<typeof styles>;

/**
 * One health number: what it is, what it is, and how full that is.
 *
 * The old control was a bare slider labelled with a raw id, which could say
 * neither what the number was nor what it was out of - dragging one to a
 * precise value was guesswork, and a value past the end of the scale looked
 * exactly like a full one.
 */
const Amount: React.FC<Props> = ({
  className,
  classes,
  gameObjectId,
  amountId,
}) => {
  const { t } = useTranslation();
  const {
    extraData: { amounts },
    onExtraDataModify,
  } = useBehavior(gameObjectId, MinionModifiersBehavior);

  const amount = find(amounts, (x) => x.name === amountId);
  const value = (amount && amount.value.value) || 0;
  const maximum = amountMaximum(amountId);
  const offScale = isOffScale(value, maximum);

  const onCommit = React.useCallback(
    (committed: string) => {
      const index = findIndex(amounts, (x) => x.name === amountId);
      if (index === -1) {
        return;
      }
      // The field is text rather than a number input so the value can carry
      // its thousands separators, so what comes back has to be read as a
      // number rather than trusted as one.
      const parsed = Number(committed.replace(/[^0-9.eE+-]/g, ""));
      if (!Number.isFinite(parsed)) {
        return;
      }
      onExtraDataModify({
        amounts: merge([], amounts, {
          [index]: { name: amountId, value: { value: parsed } },
        }),
      });
    },
    [onExtraDataModify, amounts, amountId],
  );

  // Trailing digits on a float the game wrote are noise: 99.04344177246094
  // reads as 99.04, and a seven-digit calorie count needs its thousands marked
  // to be read at all - which a number input cannot do, hence the text field.
  const shown = formatAmount(value);

  return (
    <div className={className}>
      <div className={classes.root}>
        <div className={classes.row}>
          <Typography
            className={classes.label}
            variant="body2"
            title={t(statDescKey(amountId), { defaultValue: "" })}
          >
            {statName(amountId, t)}
          </Typography>
          <CommitTextField
            className={classes.field}
            variant="standard"
            style={{ width: `calc(${Math.max(shown.length, 3)}ch + 12px)` }}
            slotProps={{
              htmlInput: {
                className: classes.fieldText,
                inputMode: "decimal",
                "aria-label": statName(amountId, t),
              },
            }}
            value={shown}
            onCommit={onCommit}
          />
          <Typography
            className={
              offScale
                ? `${classes.maximum} ${classes.offScale}`
                : classes.maximum
            }
            variant="caption"
            color={offScale ? undefined : "textSecondary"}
          >
            {`/ ${formatAmount(maximum)}`}
          </Typography>
        </div>
        <LinearProgress
          className={classes.track}
          variant="determinate"
          color={offScale ? "warning" : "primary"}
          value={amountFill(value, maximum)}
        />
      </div>
    </div>
  );
};

export default withStyles(styles)(Amount);
