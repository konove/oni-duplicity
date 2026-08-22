import * as React from "react";

import { Trans, useTranslation } from "react-i18next";

import MenuItem from "@mui/material/MenuItem";

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
    <MenuItem
      onClick={onMenuItemClick}
      title={t("duplicant.verbs.mega_description")}
    >
      <Trans i18nKey="duplicant.verbs.mega_titlecase">
        Make Mega Duplicant
      </Trans>
    </MenuItem>
  );
};

export default MegaMenuItem;
