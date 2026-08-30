import * as React from "react";

import { Trans, useTranslation } from "react-i18next";

import MenuItem from "@mui/material/MenuItem";

import useDuplicantCondition from "@/services/oni-save/hooks/useDuplicantCondition";

export interface ReviveMenuItemProps {
  gameObjectId: number;
  onClick(): void;
}

type Props = ReviveMenuItemProps;
const ReviveMenuItem: React.FC<Props> = ({ gameObjectId, onClick }) => {
  const { t } = useTranslation();
  const { revive } = useDuplicantCondition(gameObjectId);

  const onMenuItemClick = React.useCallback(() => {
    revive();
    onClick();
  }, [revive, onClick]);

  return (
    <MenuItem
      onClick={onMenuItemClick}
      title={t("duplicant.verbs.revive_description", { defaultValue: "" })}
    >
      <Trans i18nKey="duplicant.verbs.revive_titlecase">Revive</Trans>
    </MenuItem>
  );
};

export default ReviveMenuItem;
