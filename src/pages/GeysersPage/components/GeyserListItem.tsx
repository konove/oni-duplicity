import * as React from "react";
import classnames from "classnames";

import { useTranslation } from "react-i18next";

import { Theme, makeStyles } from "@/styles";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Slider from "@mui/material/Slider";

import useGeyser from "@/services/oni-save/hooks/useGeyser";
import {
  geyserDisplayName,
  geyserTypesByName,
} from "@/services/oni-save/geysers";

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
    marginBottom: theme.spacing(),
  },
  titleControls: {
    display: "flex",
    flexDirection: "row",
    marginLeft: "auto",
  },
  sliderSection: {
    marginTop: theme.spacing(),
  },
  valueLabel: {
    marginBottom: theme.spacing(),
    display: "flex",
    justifyContent: "space-between",
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
    emitRate,
    yearLength,
    yearActive,
    emitActive,
    emitLength,
    onChangeEmitRate,
    onChangeGeyserType,
    onChangeYearLength,
    onChangeYearActive,
    onChangeEmitActive,
    onChangeEmitLength,
  } = useGeyser(gameObjectId);

  const onGeyserTypeSelected = React.useCallback(
    (e: SelectChangeEvent<string>) => {
      onChangeGeyserType(e.target.value);
    },
    [onChangeGeyserType],
  );

  const typeName = geyserType ? geyserDisplayName(geyserType, t) : "";

  return (
    <Paper className={classnames(className, styles.root)}>
      <div className={styles.titleBar}>
        <Typography variant="h6">{typeName}</Typography>
        <div className={styles.titleControls} />
      </div>
      <Divider />
      <Select value={geyserType || ""} onChange={onGeyserTypeSelected}>
        {geyserTypesByName(t).map((type) => (
          <MenuItem key={type} value={type}>
            {geyserDisplayName(type, t)}
          </MenuItem>
        ))}
      </Select>
      <RollSlider
        className={styles.sliderSection}
        labelClassName={styles.valueLabel}
        label={t("geyser.total_lifecycle_time")}
        value={yearLength}
        onCommit={onChangeYearLength}
      />
      <RollSlider
        className={styles.sliderSection}
        labelClassName={styles.valueLabel}
        label={t("geyser.active_time")}
        value={yearActive}
        onCommit={onChangeYearActive}
      />
      <RollSlider
        className={styles.sliderSection}
        labelClassName={styles.valueLabel}
        label={t("geyser.iteration_length")}
        value={emitLength}
        onCommit={onChangeEmitLength}
      />
      <RollSlider
        className={styles.sliderSection}
        labelClassName={styles.valueLabel}
        label={t("geyser.emission_length")}
        value={emitActive}
        onCommit={onChangeEmitActive}
      />
      <RollSlider
        className={styles.sliderSection}
        labelClassName={styles.valueLabel}
        label={t("geyser.emission_rate")}
        value={emitRate}
        onCommit={onChangeEmitRate}
      />
    </Paper>
  );
};

interface RollSliderProps {
  className?: string;
  labelClassName?: string;
  label: string;
  /** The stored roll, 0 to 1. */
  value: number | null;
  onCommit(fraction: number): void;
}

/**
 * One geyser configuration roll.
 *
 * Controlled rather than `defaultValue`: an uncontrolled slider keeps whatever
 * it was mounted with, so changing the geyser's type - which rerolls the
 * configuration - left the handles showing the previous geyser's numbers. It
 * also means the percentage beside the label can track the drag.
 */
const RollSlider: React.FC<RollSliderProps> = ({
  className,
  labelClassName,
  label,
  value,
  onCommit,
}) => {
  const percent = Math.round((value ?? 0) * 100);

  // Held only while the handle is being dragged, so the readout can follow it.
  // Cleared on release rather than synced from the stored value in an effect -
  // setState in an effect cascades renders, and the store is the source of
  // truth the moment the drag ends.
  const [dragged, setDragged] = React.useState<number | null>(null);
  const shown = dragged ?? percent;

  const labelId = React.useId();

  return (
    <div className={className}>
      <Typography className={labelClassName} id={labelId} component="div">
        <span>{label}</span>
        <span>{shown}%</span>
      </Typography>
      <Slider
        aria-labelledby={labelId}
        value={shown}
        onChange={(_, next) => setDragged(next)}
        onChangeCommitted={(_, next) => {
          setDragged(null);
          onCommit(next / 100);
        }}
      />
    </div>
  );
};

export default GeyserListItem;
