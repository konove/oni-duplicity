import * as React from "react";

import { useTranslation } from "react-i18next";

import ActionMenuItem from "../ActionMenuItem";

export interface MegaMenuItemProps {
  onMegaDuplicant(): void;
  onClick(): void;
}

type Props = MegaMenuItemProps;
const MegaMenuItem: React.FC<Props> = ({ onMegaDuplicant, onClick }) => {
  const { t } = useTranslation();
  const onMenuItemClick = React.useCallback(() => {
    onMegaDuplicant();
    onClick();
  }, [onMegaDuplicant, onClick]);
  return (
    <ActionMenuItem
      label={t("duplicant.verbs.mega_titlecase", {
        defaultValue: "Make Mega Duplicant",
      })}
      description={t("duplicant.verbs.mega_description", { defaultValue: "" })}
      onClick={onMenuItemClick}
    />
  );
};

export default MegaMenuItem;
