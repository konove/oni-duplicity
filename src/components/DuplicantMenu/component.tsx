import * as React from "react";

import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Divider from "@mui/material/Divider";

import MoreVertIcon from "@mui/icons-material/MoreVert";

import CopyMenuItem from "./components/CopyMenuItem";
import ImportMenuItem from "./components/ImportMenuItem";
import ExportMenuItem from "./components/ExportMenuItem";
import PasteMenuItem from "./components/PasteMenuItem";
import CloneMenuItem from "./components/CloneMenuItem";

export interface DuplicantMenuProps {
  gameObjectId: number;
}

type Props = DuplicantMenuProps;
const DuplicantMenu: React.FC<Props> = ({ gameObjectId }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const onOpen = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  }, []);

  const onClose = React.useCallback(() => {
    setAnchorEl(null);
  }, []);

  return (
    <div>
      <IconButton
        aria-owns={anchorEl ? "duplicant-menu" : undefined}
        aria-haspopup="true"
        onClick={onOpen}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="duplicant-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onClose}
      >
        <CopyMenuItem gameObjectId={gameObjectId} onClose={onClose} />
        <PasteMenuItem gameObjectId={gameObjectId} onClose={onClose} />
        <Divider />
        <ImportMenuItem gameObjectId={gameObjectId} onClose={onClose} />
        <ExportMenuItem gameObjectId={gameObjectId} onClose={onClose} />
        <Divider />
        <CloneMenuItem gameObjectId={gameObjectId} onClick={onClose} />
      </Menu>
    </div>
  );
};

export default DuplicantMenu;
