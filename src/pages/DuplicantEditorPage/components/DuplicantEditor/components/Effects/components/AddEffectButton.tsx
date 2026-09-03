import * as React from "react";
import { AI_EFFECT_IDS, AIEffectsBehavior } from "@konove/oni-save-parser";
import { difference } from "lodash";

import { Trans } from "react-i18next";

import Chip from "@mui/material/Chip";

import useBehavior from "@/services/oni-save/hooks/useBehavior";

import AddEffectDialog from "./AddEffectDialog";

export interface AddEffectButtonProps {
  gameObjectId: number;
}

type Props = AddEffectButtonProps;
const AddEffectButton: React.FC<Props> = ({ gameObjectId }) => {
  const [isAddingEffect, setIsAddingEffect] = React.useState(false);
  const { templateData, onTemplateDataModify } = useBehavior(
    gameObjectId,
    AIEffectsBehavior,
  );

  const currentEffects = templateData.saveLoadEffects.map((x) => x.id);
  const availableEffects = difference(AI_EFFECT_IDS, currentEffects);

  return (
    <React.Fragment>
      <Chip
        color="primary"
        clickable
        onClick={() => setIsAddingEffect(true)}
        label={
          <Trans i18nKey="duplicant_effect.verbs.add_titlecase">
            Add effect
          </Trans>
        }
      />
      <AddEffectDialog
        open={isAddingEffect}
        availableEffects={availableEffects}
        onClose={() => setIsAddingEffect(false)}
        onAddEffect={(id, timeRemaining) => {
          setIsAddingEffect(false);
          onTemplateDataModify({
            saveLoadEffects: [
              ...templateData.saveLoadEffects,
              { id, timeRemaining },
            ],
          });
        }}
      />
    </React.Fragment>
  );
};

export default AddEffectButton;
