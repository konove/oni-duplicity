import * as React from "react";
import { AIAttributeLevelsBehavior, AttributeLevel } from "oni-save-parser";
import classnames from "classnames";

import { Trans, WithTranslation, withTranslation } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

import useBehavior from "@/services/oni-save/hooks/useBehavior";
import { sortAttributesByName } from "@/services/oni-save/attributes";

import AttributeName from "./components/AttributeName";
import AttributeField from "./components/AttributeField";

// The attributes duplicants level up through work. Everything else a save
// carries renders under "secondary".
const PRIMARY_ATTRIBUTES = [
  "Athletics",
  "Cooking",
  "Digging",
  "Caring",
  "Ranching",
  "Machinery",
  "Construction",
  "Art",
  "Botanist",
  "Learning",
  "Strength",
  // Spaced Out's rocket piloting attribute, shown in game as "Piloting".
  "SpaceNavigation",
];

export interface AttributesProps {
  gameObjectId: number;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      height: "100%",
    },
    // Lines up with the band's portrait above it.
    header: {
      marginTop: theme.spacing(),
      marginLeft: theme.spacing(2),
    },
    divider: {
      marginTop: theme.spacing(),
      marginBottom: theme.spacing(),
    },
    // A grid rather than a fixed-height column wrap: that laid columns out
    // from the tallest item and left huge gaps between them, and it could not
    // reflow when a name or value grew.
    //
    // No row gap - the cells carry a hairline each and butt together into one
    // ruled list, so the eye can follow a row across the columns.
    attributeList: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      columnGap: theme.spacing(2.5),
      rowGap: 0,
      padding: theme.spacing(0, 2),
    },
    // The name reads first and the value sits on a right rail, so a column of
    // names scans as a list. The hairline is what makes that safe: without it
    // a right-aligned value reads as belonging to the next column's label.
    attributeItem: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing(1.5),
      minWidth: 0,
      height: 56,
      boxSizing: "border-box",
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    // Most of a duplicant's attributes are 0. Dimming them is what makes the
    // handful that are set visible without reading every number.
    attributeItemUnset: {
      color: theme.palette.text.secondary,
    },
    attributeInput: {
      flexShrink: 0,
    },
    attributeInputText: {
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      // The number spinners appear on hover and eat ~17px, which is enough to
      // clip a long value in a field sized to its content.
      MozAppearance: "textfield",
      "&::-webkit-outer-spin-button": { WebkitAppearance: "none", margin: 0 },
      "&::-webkit-inner-spin-button": { WebkitAppearance: "none", margin: 0 },
    },
    // MUI's input sets its own colour, so it does not inherit the dimming the
    // cell applies to the name.
    attributeInputTextUnset: {
      color: theme.palette.text.secondary,
    },
    // Takes the rest of the cell, and ellipsises rather than wrapping to three
    // lines the way "Engie's Tune-Up" did.
    attributeLabel: {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
  });

type Props = AttributesProps & WithStyles<typeof styles> & WithTranslation;

const Attributes: React.FC<Props> = ({ classes, gameObjectId, t, i18n }) => {
  const {
    templateData: { saveLoadLevels },
  } = useBehavior(gameObjectId, AIAttributeLevelsBehavior);

  const primary = sortAttributesByName(PRIMARY_ATTRIBUTES, t, i18n.language);
  const secondary = sortAttributesByName(
    nonPrimaryAttributeIds(saveLoadLevels),
    t,
    i18n.language,
  );

  const renderList = (attributeIds: string[]) => (
    <div className={classes.attributeList}>
      {attributeIds.map((attributeId) => {
        const unset = attributeLevel(saveLoadLevels, attributeId) === 0;
        return (
          <div
            key={attributeId}
            className={classnames(classes.attributeItem, {
              [classes.attributeItemUnset]: unset,
            })}
            data-unset={unset || undefined}
          >
            <AttributeName
              className={classes.attributeLabel}
              attributeId={attributeId}
            />
            <AttributeField
              className={classes.attributeInput}
              inputClassName={classnames(classes.attributeInputText, {
                [classes.attributeInputTextUnset]: unset,
              })}
              gameObjectId={gameObjectId}
              attributeId={attributeId}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={classes.root}>
      <Typography className={classes.header} variant="h6">
        <Trans i18nKey="duplicant_attribute.primary_titlecase">Primary</Trans>
      </Typography>
      <Divider className={classes.divider} />
      {renderList(primary)}
      <Typography className={classes.header} variant="h6">
        <Trans i18nKey="duplicant_attribute.secondary_titlecase">
          Secondary
        </Trans>
      </Typography>
      <Divider className={classes.divider} />
      {renderList(secondary)}
    </div>
  );
};

export default withStyles(styles)(withTranslation()(Attributes));

function nonPrimaryAttributeIds(attributes: AttributeLevel[]): string[] {
  return attributes
    .map((x) => x.attributeId)
    .filter((x) => PRIMARY_ATTRIBUTES.indexOf(x) === -1);
}

/**
 * An attribute the save does not carry counts as 0 here - AttributeField still
 * says so in its own words, and the cell should dim either way.
 */
function attributeLevel(
  attributes: AttributeLevel[],
  attributeId: string,
): number {
  const attribute = attributes.find((x) => x.attributeId === attributeId);
  return attribute ? attribute.level : 0;
}
