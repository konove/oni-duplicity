import * as React from "react";
import { AI_TRAIT_IDS, AITraitsBehavior } from "oni-save-parser";
import { difference } from "lodash";

import { WithTranslation, withTranslation } from "react-i18next";

import {
  Theme,
  createStyles,
  withStyles,
  WithStyles
} from "@/styles";
import Chip from "@mui/material/Chip";

import useBehavior from "@/services/oni-save/hooks/useBehavior";
import {
  sortTraitsByName,
  traitDescKey,
  traitNameKey,
} from "@/services/oni-save/traits";

import AddTraitButton from "./components/AddTraitButton";

const CANDIDATE_TRAITS = AI_TRAIT_IDS.filter(x => x !== "None");

export interface TraitsProps {
  gameObjectId: number;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap"
    },
    chip: {
      margin: theme.spacing(0.5)
    }
  });

type Props = TraitsProps & WithStyles<typeof styles> & WithTranslation;

const Traits: React.FC<Props> = ({ classes, gameObjectId, t, i18n }) => {
  const { templateData, onTemplateDataModify } = useBehavior(gameObjectId, AITraitsBehavior);
  const { TraitIds } = templateData;
  const availableTraits = difference(CANDIDATE_TRAITS, TraitIds);

  // Display order only - the save keeps its own order, and removal below still
  // works off the original index so a duplicated id cannot delete the wrong one.
  const ordered = sortTraitsByName(
    TraitIds.map((trait: string, index: number) => ({ trait, index })),
    ({ trait }) => trait,
    t,
    i18n.language
  );
  return (
    <div className={classes.root}>
      {ordered.map(({ trait, index }) => (
        <Chip
          key={trait}
          className={classes.chip}
          label={t(traitNameKey(trait), { defaultValue: trait })}
          title={t(traitDescKey(trait), { defaultValue: "" })}
          onDelete={() => {
            const newTraitIds = [...TraitIds];
            newTraitIds.splice(index, 1);
            onTemplateDataModify({
              TraitIds: newTraitIds
            });
          }}
        />
      ))}
      <AddTraitButton
        className={classes.chip}
        availableTraits={availableTraits}
        onAddTrait={trait =>
          onTemplateDataModify({ TraitIds: [...TraitIds, trait] })
        }
      />
    </div>
  );
};

export default withStyles(styles)(withTranslation()(Traits));
