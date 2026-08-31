import * as React from "react";
import classnames from "classnames";

import { useTranslation } from "react-i18next";

import { Theme, makeStyles } from "@/styles";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Slider from "@mui/material/Slider";
import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp";

import useGeyser from "@/services/oni-save/hooks/useGeyser";
import {
  geyserDisplayName,
  geyserTypesByName,
} from "@/services/oni-save/geysers";
import {
  SECONDS_PER_CYCLE,
  formatCycles,
  formatDuration,
  formatSeconds,
  formatTemperature,
  geyserReadout,
  geyserTypeInfo,
  isBestCase,
  rollForValue,
} from "@/services/oni-save/geyser-configuration";
import { elementDisplayName, formatMass } from "@/services/oni-save/materials";

export interface GeyserListItemProps {
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
    alignItems: "baseline",
    marginBottom: theme.spacing(),
  },
  temperature: {
    marginLeft: "auto",
  },
  sliderSection: {
    marginTop: theme.spacing(),
  },
  valueLabel: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: theme.spacing(),
  },
  // A value that wraps mid-number reads as two numbers. The label is the part
  // that gives way when the row is too narrow for both.
  value: {
    whiteSpace: "nowrap",
  },
  secondaryValue: {
    marginRight: theme.spacing(),
  },
  rangeLabel: {
    display: "flex",
    justifyContent: "space-between",
  },
  bestCase: {
    marginTop: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  bestCaseDescription: {
    marginTop: theme.spacing(0.5),
  },
  summary: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: "rgba(127, 127, 127, 0.08)",
  },
  summaryGrid: {
    marginTop: theme.spacing(),
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    columnGap: theme.spacing(1.5),
    rowGap: theme.spacing(0.5),
  },
  summaryValue: {
    textAlign: "right",
  },
}));

const GeyserListItem: React.FC<GeyserListItemProps> = ({
  className,
  gameObjectId,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();

  const {
    geyserType,
    rolls,
    onChangeGeyserType,
    onChangeEmitRate,
    onChangeYearLength,
    onChangeYearActive,
    onChangeEmitActive,
    onChangeEmitLength,
    onApplyBestCase,
  } = useGeyser(gameObjectId);

  const onGeyserTypeSelected = React.useCallback(
    (e: SelectChangeEvent<string>) => {
      onChangeGeyserType(e.target.value);
    },
    [onChangeGeyserType],
  );

  // The dropdown lists the types the editor knows. A save from a newer game
  // can hold one it does not, and a Select given a value with no matching
  // option warns and renders an empty box - which reads as "this geyser has no
  // type" rather than "this is a type I cannot help you with". Carry the
  // save's own value as an extra option so the card says what is actually
  // stored, and picking a known type from the list still repairs it.
  const knownTypes = geyserTypesByName(t);
  const selectableTypes =
    geyserType && !knownTypes.includes(geyserType)
      ? [geyserType, ...knownTypes]
      : knownTypes;

  const typeName = geyserType ? geyserDisplayName(geyserType, t) : "";
  const info = geyserType ? geyserTypeInfo(geyserType) : null;
  const readout = info && rolls ? geyserReadout(info, rolls) : null;
  const alreadyBest = rolls != null && isBestCase(rolls);

  const perSecond = (kilograms: number) =>
    t("material.per_second", { mass: formatMass(kilograms, t) });

  return (
    <Paper className={classnames(className, styles.root)}>
      <div className={styles.titleBar}>
        <Typography variant="h6">{typeName}</Typography>
        {info && (
          <Typography
            className={styles.temperature}
            variant="caption"
            color="textSecondary"
          >
            {formatTemperature(info.temperature, t)}
          </Typography>
        )}
      </div>
      <Divider />
      <Select value={geyserType || ""} onChange={onGeyserTypeSelected}>
        {selectableTypes.map((type) => (
          <MenuItem key={type} value={type}>
            {geyserDisplayName(type, t)}
          </MenuItem>
        ))}
      </Select>
      {!info || !readout ? (
        // A save from a newer game than the parser knows. The type dropdown
        // still works, so this is recoverable rather than a dead card.
        <Typography className={styles.sliderSection} color="textSecondary">
          {t("geyser.unknown_type")}
        </Typography>
      ) : (
        <>
          <ValueSlider
            className={styles.sliderSection}
            label={t("geyser.eruption_cycle")}
            value={readout.iterationLength}
            min={info.minIterationLength}
            max={info.maxIterationLength}
            step={1}
            format={(seconds) => formatSeconds(seconds, t)}
            onCommit={(seconds) =>
              onChangeEmitLength(
                rollForValue(
                  seconds,
                  info.minIterationLength,
                  info.maxIterationLength,
                ),
              )
            }
          />
          <ValueSlider
            className={styles.sliderSection}
            label={t("geyser.erupting")}
            // Stored as a share of the eruption cycle, so the slider sets the
            // share: an absolute range here would silently re-scale whenever
            // the row above it moved.
            value={readout.iterationPercent * 100}
            min={info.minIterationPercent * 100}
            max={info.maxIterationPercent * 100}
            step={0.1}
            format={(percent) => t("geyser.percent", { count: round(percent) })}
            secondary={formatSeconds(readout.onDuration, t)}
            onCommit={(percent) =>
              onChangeEmitActive(
                rollForValue(
                  percent / 100,
                  info.minIterationPercent,
                  info.maxIterationPercent,
                ),
              )
            }
          />
          <ValueSlider
            className={styles.sliderSection}
            label={t("geyser.full_cycle")}
            value={readout.yearLength / SECONDS_PER_CYCLE}
            min={info.minYearLength / SECONDS_PER_CYCLE}
            max={info.maxYearLength / SECONDS_PER_CYCLE}
            step={0.1}
            format={(cycles) => formatCycles(cycles * SECONDS_PER_CYCLE, t)}
            onCommit={(cycles) =>
              onChangeYearLength(
                rollForValue(
                  cycles * SECONDS_PER_CYCLE,
                  info.minYearLength,
                  info.maxYearLength,
                ),
              )
            }
          />
          <ValueSlider
            className={styles.sliderSection}
            label={t("geyser.active")}
            value={readout.yearPercent * 100}
            min={info.minYearPercent * 100}
            max={info.maxYearPercent * 100}
            step={0.1}
            format={(percent) => t("geyser.percent", { count: round(percent) })}
            secondary={formatDuration(readout.yearOnDuration, t)}
            onCommit={(percent) =>
              onChangeYearActive(
                rollForValue(
                  percent / 100,
                  info.minYearPercent,
                  info.maxYearPercent,
                ),
              )
            }
          />
          <ValueSlider
            className={styles.sliderSection}
            label={t("geyser.output")}
            value={readout.massPerCycle}
            min={info.minRate}
            max={info.maxRate}
            step={1}
            format={(kilograms) =>
              t("geyser.kilograms_per_cycle", { count: Math.round(kilograms) })
            }
            onCommit={(kilograms) =>
              onChangeEmitRate(
                rollForValue(kilograms, info.minRate, info.maxRate),
              )
            }
          />
          {/* Disabled once there is nothing left to do, because the click
              would not be free: every reducer sets `isModified`, so a no-op
              best case would mark the save dirty for a change that did not
              happen. The caption says why rather than leaving a dead control
              to explain itself. */}
          <div className={styles.bestCase}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<KeyboardDoubleArrowUpIcon />}
              disabled={alreadyBest}
              onClick={onApplyBestCase}
            >
              {t("geyser.best_case_titlecase")}
            </Button>
            <Typography
              className={styles.bestCaseDescription}
              variant="caption"
              color="textSecondary"
            >
              {alreadyBest
                ? t("geyser.best_case_already")
                : t("geyser.best_case_description")}
            </Typography>
          </div>
          <div className={styles.summary}>
            <Typography variant="overline" color="textSecondary">
              {t("geyser.in_game_this_reads_titlecase")}
            </Typography>
            <div className={styles.summaryGrid}>
              <Typography variant="body2" color="textSecondary">
                {elementDisplayName(info.element, t)}
              </Typography>
              <Typography className={styles.summaryValue} variant="body2">
                {perSecond(readout.emitRate)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t("geyser.eruption_period_titlecase")}
              </Typography>
              <Typography className={styles.summaryValue} variant="body2">
                {t("geyser.eruption_period_value", {
                  on: formatSeconds(readout.onDuration, t),
                  total: formatSeconds(readout.iterationLength, t),
                })}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t("geyser.active_period_titlecase")}
              </Typography>
              <Typography className={styles.summaryValue} variant="body2">
                {t("geyser.active_period_value", {
                  on: formatDuration(readout.yearOnDuration, t),
                  total: formatDuration(readout.yearLength, t),
                })}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t("geyser.average_output_titlecase")}
              </Typography>
              <Typography className={styles.summaryValue} variant="body2">
                {perSecond(readout.averageEmission)}
              </Typography>
            </div>
          </div>
        </>
      )}
    </Paper>
  );
};

interface ValueSliderProps {
  className?: string;
  label: string;
  /** In whatever units the row reads in - seconds, cycles, percent, kilograms. */
  value: number;
  min: number;
  max: number;
  step: number;
  format(value: number): string;
  /** A dimmed second reading of the same row: what a percentage works out to. */
  secondary?: string;
  onCommit(value: number): void;
}

/**
 * One geyser setting, in the units the game shows rather than a bare roll.
 *
 * Controlled rather than `defaultValue`: an uncontrolled slider keeps whatever
 * it was mounted with, so switching a geyser's type - which leaves the rolls
 * alone but changes the range they land in - left the handles showing the
 * previous type's numbers. It also lets the readout track the drag.
 */
const ValueSlider: React.FC<ValueSliderProps> = ({
  className,
  label,
  value,
  min,
  max,
  step,
  format,
  secondary,
  onCommit,
}) => {
  const styles = useStyles();

  // Held only while the handle is being dragged, so the readout can follow it.
  // Cleared on release rather than synced from the stored value in an effect -
  // setState in an effect cascades renders, and the store is the source of
  // truth the moment the drag ends.
  const [dragged, setDragged] = React.useState<number | null>(null);
  const shown = dragged ?? value;

  const labelId = React.useId();

  return (
    <div className={className}>
      <Typography className={styles.valueLabel} component="div">
        {/* The id sits on the label alone: naming the slider with the whole row
            would fold the current value into its accessible name. */}
        <span id={labelId}>{label}</span>
        <span className={styles.value}>
          {secondary && (
            <Typography
              className={styles.secondaryValue}
              component="span"
              variant="body2"
              color="textSecondary"
            >
              {secondary}
            </Typography>
          )}
          <span>{format(shown)}</span>
        </span>
      </Typography>
      {/* The oil fissure pins two of its settings to a single value; a slider
          with no width to it would only mislead. */}
      {min < max && (
        <Slider
          aria-labelledby={labelId}
          value={shown}
          min={min}
          max={max}
          step={step}
          onChange={(_, next) => setDragged(next)}
          onChangeCommitted={(_, next) => {
            setDragged(null);
            onCommit(next);
          }}
        />
      )}
      <Typography
        className={styles.rangeLabel}
        component="div"
        variant="caption"
        color="textSecondary"
      >
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </Typography>
    </div>
  );
};

/** One decimal at most, matching how the game writes a percentage. */
function round(value: number): number {
  return Number(value.toFixed(1));
}

export default GeyserListItem;
