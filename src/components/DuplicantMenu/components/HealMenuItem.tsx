import * as React from "react";
import { MinionModifiersBehavior } from "oni-save-parser";

import { useTranslation } from "react-i18next";

import useBehavior from "@/services/oni-save/hooks/useBehavior";
import { healTarget } from "@/services/oni-save/health";

import ActionMenuItem from "./ActionMenuItem";

export interface HealMenuItemProps {
  gameObjectId: number;
  onClick(): void;
}

/**
 * Everything a duplicant needs to stop being in trouble, in one write.
 *
 * It is a bundle of edits the editor could already make one slider at a time -
 * which is exactly why it is worth having as an entry: nobody wants to drag
 * eleven germ counters back to zero by hand.
 */
const HealMenuItem: React.FC<HealMenuItemProps> = ({
  gameObjectId,
  onClick,
}) => {
  const { t } = useTranslation();
  const { extraData, onExtraDataModify } = useBehavior(
    gameObjectId,
    MinionModifiersBehavior,
  );

  const onMenuItemClick = React.useCallback(() => {
    if (extraData && extraData.amounts) {
      onExtraDataModify({
        amounts: extraData.amounts.map((amount) => {
          const target = healTarget(amount.name, amount.value.value);
          return target === undefined
            ? amount
            : { ...amount, value: { ...amount.value, value: target } };
        }),
        // Shallow-assigned rather than deep-merged, so this really does empty
        // the list.
        sicknesses: [],
      });
    }
    onClick();
  }, [extraData, onExtraDataModify, onClick]);

  return (
    <ActionMenuItem
      label={t("duplicant.verbs.heal_titlecase", {
        defaultValue: "Heal and de-stress",
      })}
      description={t("duplicant.verbs.heal_description", { defaultValue: "" })}
      onClick={onMenuItemClick}
    />
  );
};

export default HealMenuItem;
