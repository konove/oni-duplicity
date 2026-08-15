import * as React from "react";
import { useSelector } from "react-redux";

import { Trans } from "react-i18next";

import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";

import { hasSaveSelector } from "@/services/oni-save/selectors/save-game";
import { dlcIdsSelector, hasDLCs } from "@/services/oni-save/selectors/dlc";
import ListItemLink from "@/components/ListItemLink";
import NavItems from "@/nav-links";

const Nav: React.FC = () => {
  const hasSave = useSelector(hasSaveSelector);
  const dlcIds = useSelector(dlcIdsSelector);
  return (
    <List component="nav">
      {NavItems.filter(
        ({ requireDLC }) =>
          requireDLC === undefined || hasDLCs(dlcIds, requireDLC),
      ).map(({ name, path, i18nKey, saveRequired }) => (
        <ListItemLink
          key={name}
          to={path}
          autoselect
          disabled={saveRequired ? !hasSave : false}
        >
          <ListItemText>
            <Trans i18nKey={i18nKey}>{name}</Trans>
          </ListItemText>
        </ListItemLink>
      ))}
    </List>
  );
};
export default Nav;
