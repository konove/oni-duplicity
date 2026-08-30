import * as React from "react";
import { AIAttributeLevelsBehavior, AttributeLevel } from "oni-save-parser";
import classnames from "classnames";

import { WithTranslation, withTranslation } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";

import useBehavior from "@/services/oni-save/hooks/useBehavior";
import { sortAttributesByName } from "@/services/oni-save/attributes";

import PanelHeading from "../PanelHeading";

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
    group: {
      marginBottom: theme.spacing(2),
    },
    // Two columns, because seventeen attributes in one would be a column of
    // scrolling and the point of this screen is that nothing scrolls.
    //
    // No row gap - the cells carry a hairline each and butt together into one
    // ruled list, so the eye can follow a row across both columns.
    list: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      columnGap: theme.spacing(2.5),
      rowGap: 0,
    },
    // 30px rather than the 56px a form field wants. The name reads first and
    // the value sits on a right rail, and the hairline is what makes that
    // safe: without it a right-aligned value reads as belonging to the next
    // column's label.
    item: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing(1),
      minWidth: 0,
      height: 30,
      boxSizing: "border-box",
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    // Most of a duplicant's attributes are 0. Dimming them is what makes the
    // handful that are set visible without reading every number.
    itemUnset: {
      color: theme.palette.text.secondary,
    },
    input: {
      flexShrink: 0,
    },
    inputText: {
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      padding: theme.spacing(0.25, 0.75),
      fontSize: 14,
      // The number spinners appear on hover and eat ~17px, which is enough to
      // clip a long value in a field sized to its content.
      MozAppearance: "textfield",
      "&::-webkit-outer-spin-button": { WebkitAppearance: "none", margin: 0 },
      "&::-webkit-inner-spin-button": { WebkitAppearance: "none", margin: 0 },
    },
    // MUI's input sets its own colour, so it does not inherit the dimming the
    // cell applies to the name.
    inputTextUnset: {
      color: theme.palette.text.secondary,
    },
    // Takes the rest of the cell, and ellipsises rather than wrapping to three
    // lines the way "Engie's Tune-Up" did.
    label: {
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

  const setCount = (attributeIds: string[]) =>
    attributeIds.filter((id) => attributeLevel(saveLoadLevels, id) !== 0)
      .length;

  const renderList = (attributeIds: string[]) => (
    <div className={classes.list}>
      {attributeIds.map((attributeId) => {
        const unset = attributeLevel(saveLoadLevels, attributeId) === 0;
        return (
          <div
            key={attributeId}
            className={classnames(classes.item, {
              [classes.itemUnset]: unset,
            })}
            data-unset={unset || undefined}
          >
            <AttributeName
              className={classes.label}
              attributeId={attributeId}
            />
            <AttributeField
              className={classes.input}
              inputClassName={classnames(classes.inputText, {
                [classes.inputTextUnset]: unset,
              })}
              gameObjectId={gameObjectId}
              attributeId={attributeId}
            />
          </div>
        );
      })}
    </div>
  );

  const setLabel = (ids: string[]) => {
    const count = setCount(ids);
    return count === 0
      ? t("duplicant_attribute.conditions.none_set", {
          defaultValue: "none set",
        })
      : t("duplicant_attribute.conditions.set_count", {
          defaultValue: "{{count}} set",
          count,
        });
  };

  return (
    <div>
      <div className={classes.group}>
        <PanelHeading
          i18nKey="duplicant_attribute.primary_titlecase"
          fallback="Attributes — primary"
          detail={setLabel(primary)}
        />
        {renderList(primary)}
      </div>
      <div className={classes.group}>
        <PanelHeading
          i18nKey="duplicant_attribute.secondary_titlecase"
          fallback="Attributes — secondary"
          detail={setLabel(secondary)}
        />
        {renderList(secondary)}
      </div>
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
