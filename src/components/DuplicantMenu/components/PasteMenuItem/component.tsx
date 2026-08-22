import * as React from "react";

import { Trans } from "react-i18next";

import MenuItem from "@mui/material/MenuItem";

export interface PasteMenuItemProps {
  gameObjectId: number;
  disabled: boolean;
  onPasteBehaviors(): void;
  onClose(): void;
}

type Props = PasteMenuItemProps;

const PasteMenuItem: React.FC<Props> = ({
  disabled,
  onPasteBehaviors,
  onClose,
}) => {
  const onClick = React.useCallback(() => {
    onClose();
    onPasteBehaviors();
  }, [onClose, onPasteBehaviors]);
  return (
    <MenuItem disabled={disabled} onClick={onClick}>
      <Trans i18nKey="duplicant.verbs.paste_titlecase">Paste</Trans>
    </MenuItem>
  );
};

export default PasteMenuItem;
