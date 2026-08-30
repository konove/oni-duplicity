import * as React from "react";

import { useTranslation } from "react-i18next";

import ActionMenuItem from "../ActionMenuItem";

export interface CloneMenuItemProps {
  onCloneDuplicant(): void;
  onClick(): void;
}

type Props = CloneMenuItemProps;
const CloneMenuItem: React.FC<Props> = ({ onCloneDuplicant, onClick }) => {
  const { t } = useTranslation();
  const onMenuItemClick = React.useCallback(() => {
    onCloneDuplicant();
    onClick();
  }, [onCloneDuplicant, onClick]);
  return (
    <ActionMenuItem
      label={t("duplicant.verbs.clone_titlecase", { defaultValue: "Clone" })}
      description={t("duplicant.verbs.clone_description", {
        defaultValue: "",
      })}
      onClick={onMenuItemClick}
    />
  );
};

export default CloneMenuItem;
