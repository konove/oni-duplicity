import * as React from "react";

import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";

export interface ActionMenuItemProps {
  label: React.ReactNode;
  /**
   * What the action does, for the ones that rewrite a duplicant.
   *
   * "Make Mega Duplicant" was a row of three words that maxed every attribute,
   * replaced every trait and granted full experience, and the sentence saying
   * so was already written in en/common.json with nothing rendering it. The
   * entries that only move bytes around do not need one.
   */
  description?: React.ReactNode;
  onClick(): void;
}

const ActionMenuItem: React.FC<ActionMenuItemProps> = ({
  label,
  description,
  onClick,
}) => (
  // MenuItem sets nowrap on its children, which would turn the description
  // into one long line and drag the whole menu out to its width.
  <MenuItem onClick={onClick} sx={{ whiteSpace: "normal" }}>
    <ListItemText
      primary={label}
      secondary={description}
      slotProps={{
        primary: { variant: "body1" },
        secondary: { variant: "caption" },
      }}
    />
  </MenuItem>
);

export default ActionMenuItem;
