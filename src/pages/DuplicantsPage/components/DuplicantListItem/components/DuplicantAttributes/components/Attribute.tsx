import * as React from "react";
import { AIAttributeLevelsBehavior } from "@konove/oni-save-parser";
import { find } from "lodash";

import { Trans, WithTranslation, withTranslation } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";
import Typography from "@mui/material/Typography";
import ErrorIcon from "@mui/icons-material/Error";

import useBehavior from "@/services/oni-save/hooks/useBehavior";

export interface AttributeProps {
  gameObjectId: number;
  attributeId: string;
}

const styles = (theme: Theme) =>
  createStyles({
    // Name first and the value on a right rail, the same way the editor reads,
    // so a column of names scans and the numbers line up under each other.
    root: {
      display: "flex",
      flexDirection: "row",
      alignItems: "baseline",
      gap: theme.spacing(1),
      minWidth: 0,
    },
    name: {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    // A mega duplicant reads +9999 on every attribute; the column has to be
    // wide enough for that without the name giving way.
    level: {
      flexShrink: 0,
      fontVariantNumeric: "tabular-nums",
    },
    unset: {
      color: theme.palette.text.secondary,
    },
  });

type Props = AttributeProps & WithStyles<typeof styles> & WithTranslation;

const Attribute: React.FC<Props> = ({
  classes,
  gameObjectId,
  attributeId,
  t,
}) => {
  const { templateData } = useBehavior(gameObjectId, AIAttributeLevelsBehavior);

  if (!templateData) {
    return (
      <div>
        <Trans i18nKey="conditions.no_data">Error: No Data</Trans>
      </div>
    );
  }

  const attribute = find(
    templateData.saveLoadLevels,
    (x) => x.attributeId === attributeId,
  );
  const unset = !attribute || attribute.level === 0;

  return (
    <div
      className={classes.root}
      title={t(`oni:DUPLICANTS.ATTRIBUTES.${attributeId}.DESC`, {
        defaultValue: "",
      })}
    >
      <Typography
        className={unset ? `${classes.name} ${classes.unset}` : classes.name}
        component="span"
        variant="body2"
      >
        <Trans i18nKey={`oni:DUPLICANTS.ATTRIBUTES.${attributeId}.NAME`}>
          {attributeId}
        </Trans>
      </Typography>
      <Typography
        className={unset ? `${classes.level} ${classes.unset}` : classes.level}
        component="span"
        variant="body2"
      >
        {attribute ? (
          signPrefix(attribute.level)
        ) : (
          <ErrorIcon fontSize="small" />
        )}
      </Typography>
    </div>
  );
};

export default withStyles(styles)(withTranslation()(Attribute));

/**
 * The level, signed, so a bonus reads as one.
 *
 * A negative level already carries its own sign - prefixing another produced
 * "--5", which no save has yet but every trait that subtracts could.
 */
function signPrefix(level: number): string {
  return level > 0 ? `+${level}` : String(level);
}
