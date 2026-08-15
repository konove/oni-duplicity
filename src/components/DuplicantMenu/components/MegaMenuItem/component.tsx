import * as React from "react";

import MenuItem from "@mui/material/MenuItem";

export interface MegaMenuItemProps {
  onMegaDuplicant(): void;
  onClick(): void;
}

type Props = MegaMenuItemProps;
const MegaMenuItem: React.FC<Props> = ({ onMegaDuplicant, onClick }) => {
  const onMenuItemClick = React.useCallback(() => {
    onMegaDuplicant();
    onClick();
  }, [onMegaDuplicant, onClick]);
  return (
    <MenuItem
      onClick={onMenuItemClick}
      title="Max out every attribute, replace all traits with the good ones, take every interest, and grant full experience"
    >
      Make Mega Duplicant
    </MenuItem>
  );
};

export default MegaMenuItem;
