import * as React from "react";

import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Divider from "@mui/material/Divider";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import CopyMenuItem from "./components/CopyMenuItem";
import ImportMenuItem from "./components/ImportMenuItem";
import ExportMenuItem from "./components/ExportMenuItem";
import PasteMenuItem from "./components/PasteMenuItem";
import CloneMenuItem from "./components/CloneMenuItem";
import MegaMenuItem from "./components/MegaMenuItem";
import HealMenuItem from "./components/HealMenuItem";

export interface DuplicantMenuProps {
  gameObjectId: number;
  /**
   * Renders a named button rather than a kebab.
   *
   * Every other menu in this app is a bare kebab, and on a list of identical
   * cards that is right - the menu is a detail of the row. In the editor it is
   * not: the most powerful things the editor can do are in here, and nobody
   * opens a kebab on a hunch to find out that "Make Mega Duplicant" rewrites
   * every attribute, trait and interest.
   */
  label?: string;
}

type Props = DuplicantMenuProps;
const DuplicantMenu: React.FC<Props> = ({ gameObjectId, label }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const onOpen = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  }, []);

  const onClose = React.useCallback(() => {
    setAnchorEl(null);
  }, []);

  return (
    <div>
      {label ? (
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          aria-owns={anchorEl ? "duplicant-menu" : undefined}
          aria-haspopup="true"
          onClick={onOpen}
          endIcon={<ExpandMoreIcon />}
        >
          {label}
        </Button>
      ) : (
        <IconButton
          aria-owns={anchorEl ? "duplicant-menu" : undefined}
          aria-haspopup="true"
          onClick={onOpen}
        >
          <MoreVertIcon />
        </IconButton>
      )}
      <Menu
        id="duplicant-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onClose}
        // Without a ceiling the menu grows to the width of its longest
        // sentence, and the one under "Make Mega Duplicant" is thirteen words.
        slotProps={{ paper: { sx: { maxWidth: 340 } } }}
      >
        {/* Grouped by what they do to a duplicant: put one right, move their
            data about, act on the colony. Revive is not here - it is the
            button in the banner, and a duplicant who needs it has one. */}
        <HealMenuItem gameObjectId={gameObjectId} onClick={onClose} />
        <MegaMenuItem gameObjectId={gameObjectId} onClick={onClose} />
        <Divider />
        <CopyMenuItem gameObjectId={gameObjectId} onClose={onClose} />
        <PasteMenuItem gameObjectId={gameObjectId} onClose={onClose} />
        <ImportMenuItem gameObjectId={gameObjectId} onClose={onClose} />
        <ExportMenuItem gameObjectId={gameObjectId} onClose={onClose} />
        <Divider />
        <CloneMenuItem gameObjectId={gameObjectId} onClick={onClose} />
      </Menu>
    </div>
  );
};

export default DuplicantMenu;
