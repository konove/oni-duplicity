import * as React from "react";
import { AIAttributeLevelsBehavior, AttributeLevel } from "oni-save-parser";

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
    header: {
      marginTop: theme.spacing(),
      marginLeft: theme.spacing(),
    },
    divider: {
      marginTop: theme.spacing(),
      marginBottom: theme.spacing(),
    },
    // A grid rather than a fixed-height column wrap: that laid columns out
    // from the tallest item and left huge gaps between them, and it could not
    // reflow when a name or value grew.
    attributeList: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: theme.spacing(),
      padding: theme.spacing(),
    },
    attributeItem: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing(),
      minWidth: 0,
    },
    // Width comes from the value's length, set by AttributeField itself.
    attributeInput: {
      flexShrink: 0,
    },
    attributeInputText: {
      textAlign: "center",
      // The number spinners appear on hover and eat ~17px, which is enough to
      // clip a long value in a field sized to its content.
      MozAppearance: "textfield",
      "&::-webkit-outer-spin-button": { WebkitAppearance: "none", margin: 0 },
      "&::-webkit-inner-spin-button": { WebkitAppearance: "none", margin: 0 },
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
    i18n.language
  );
  return (
    <div className={classes.root}>
      <Typography className={classes.header} variant="h6">
        <Trans i18nKey="duplicant_attribute.primary_titlecase">Primary</Trans>
      </Typography>
      <Divider className={classes.divider} />
      <div className={classes.attributeList}>
        {primary.map((attributeId) => (
          <div key={attributeId} className={classes.attributeItem}>
            <AttributeField
              className={classes.attributeInput}
              inputClassName={classes.attributeInputText}
              gameObjectId={gameObjectId}
              attributeId={attributeId}
            />
            <AttributeName
              className={classes.attributeLabel}
              attributeId={attributeId}
            />
          </div>
        ))}
      </div>
      <Typography className={classes.header} variant="h6">
        <Trans i18nKey="duplicant_attribute.secondary_titlecase">
          Secondary
        </Trans>
      </Typography>
      <Divider className={classes.divider} />
      <div className={classes.attributeList}>
        {secondary.map((attributeId) => (
          <div key={attributeId} className={classes.attributeItem}>
            <AttributeField
              className={classes.attributeInput}
              inputClassName={classes.attributeInputText}
              gameObjectId={gameObjectId}
              attributeId={attributeId}
            />
            <AttributeName
              className={classes.attributeLabel}
              attributeId={attributeId}
            />
          </div>
        ))}
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
