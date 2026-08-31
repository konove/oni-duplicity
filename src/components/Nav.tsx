import * as React from "react";
import { useSelector } from "react-redux";

import { Trans, useTranslation } from "react-i18next";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import { hasSaveSelector } from "@/services/oni-save/selectors/save-game";
import { dlcIdsSelector, hasDLCs } from "@/services/oni-save/selectors/dlc";
import ListItemLink from "@/components/ListItemLink";
import NavItems, { NavItem } from "@/nav-links";

const Nav: React.FC = () => {
  const { t } = useTranslation();
  const hasSave = useSelector(hasSaveSelector);
  const dlcIds = useSelector(dlcIdsSelector);

  // Without a save there are no dlc ids to test, so every gated entry would
  // report "your save lacks this pack" when the truth is that there is no save
  // yet. The lock note below covers that case; the per-item reason is only
  // meaningful once a save has actually answered the question.
  const dlcMissing = ({ requireDLC }: NavItem) =>
    hasSave && requireDLC !== undefined && !hasDLCs(dlcIds, requireDLC);

  return (
    <List component="nav">
      {NavItems.map((item, index) => {
        const { name, path, i18nKey, saveRequired, requireDLCI18nKey } = item;
        const reason = dlcMissing(item) ? t(requireDLCI18nKey ?? "") : null;
        const disabled = (saveRequired && !hasSave) || reason !== null;

        // The note explains the run of save-gated entries, so it belongs after
        // the last of them rather than at a hardcoded index.
        const endsLockedRun =
          !hasSave &&
          saveRequired === true &&
          NavItems[index + 1]?.saveRequired !== true;

        return (
          <React.Fragment key={name}>
            <Box sx={{ position: "relative" }}>
              <ListItemLink to={path} autoselect disabled={disabled}>
                <ListItemText>
                  <Trans i18nKey={i18nKey}>{name}</Trans>
                </ListItemText>
              </ListItemLink>
              {reason && (
                // Outside the link on purpose: a disabled ListItemButton sets
                // `pointer-events: none`, so an icon inside it never sees the
                // hover that opens the tooltip.
                <Tooltip title={reason}>
                  <Box
                    component="span"
                    role="img"
                    aria-label={reason}
                    tabIndex={0}
                    sx={{
                      position: "absolute",
                      right: 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      display: "flex",
                      color: "text.secondary",
                    }}
                  >
                    <InfoOutlinedIcon fontSize="small" />
                  </Box>
                </Tooltip>
              )}
            </Box>
            {endsLockedRun && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                    px: 2,
                    pt: 0.5,
                    pb: 1.5,
                    color: "text.disabled",
                  }}
                >
                  <LockOutlinedIcon sx={{ fontSize: 14, mt: "1px" }} />
                  <Typography variant="caption">
                    <Trans i18nKey="nav.locked_until_save">
                      Locked until a save is open
                    </Trans>
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
              </>
            )}
          </React.Fragment>
        );
      })}
    </List>
  );
};
export default Nav;
