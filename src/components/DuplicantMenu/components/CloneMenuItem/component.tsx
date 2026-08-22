import * as React from "react";

import { Trans } from "react-i18next";

import MenuItem from "@mui/material/MenuItem";

export interface CloneMenuItemProps {
  onCloneDuplicant(): void;
  onClick(): void;
}

type Props = CloneMenuItemProps;
const CloneMenuItem: React.FC<Props> = ({ onCloneDuplicant, onClick }) => {
  const onMenuItemClick = React.useCallback(() => {
    onCloneDuplicant();
    onClick();
  }, [onCloneDuplicant, onClick]);
  return (
    <MenuItem onClick={onMenuItemClick}>
      <Trans i18nKey="duplicant.verbs.clone_titlecase">Clone</Trans>
    </MenuItem>
  );
};

export default CloneMenuItem;
