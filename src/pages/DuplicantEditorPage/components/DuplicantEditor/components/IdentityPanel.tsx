import * as React from "react";
import { MinionIdentityBehavior } from "oni-save-parser";

import { WithTranslation, withTranslation } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";
import Typography from "@mui/material/Typography";

import DuplicantPortrait from "@/components/DuplicantPortrait";
import DuplicantMenu from "@/components/DuplicantMenu";
import useBehavior from "@/services/oni-save/hooks/useBehavior";

import AppearanceButton from "./Appearance/components/AppearanceButton";

export interface IdentityPanelProps {
  gameObjectId: number;
}

// DuplicantPortrait frames a head in a 275x250 box before scaling, so this is
// an 88x80 portrait - small enough to leave the name room in a 344px column.
const PORTRAIT_SCALE = 88 / 275;

const styles = (theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing(1.5),
      minWidth: 0,
    },
    portrait: {
      flex: "none",
    },
    details: {
      flex: 1,
      minWidth: 0,
    },
    nameRow: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing(1),
      minWidth: 0,
    },
    name: {
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    identityLine: {
      display: "block",
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    appearance: {
      marginTop: theme.spacing(1),
    },
    // The actions act on the whole duplicant; everything else on this screen
    // edits one field. This is the only panel that is the whole duplicant.
    actions: {
      flex: "none",
      marginLeft: "auto",
    },
  });

type Props = IdentityPanelProps & WithStyles<typeof styles> & WithTranslation;

/**
 * Who this duplicant is: the portrait, the name, and the actions.
 *
 * Death is not marked here. The portrait greys out on its own, and DeadBanner
 * says the rest at the top of the screen - a chip beside the name as well
 * would be the same news twice, a hundred pixels apart.
 */
const IdentityPanel: React.FC<Props> = ({ classes, gameObjectId, t }) => {
  const { templateData } = useBehavior(gameObjectId, MinionIdentityBehavior);
  const { name, gender, voiceIdx } = templateData;

  return (
    <div className={classes.root}>
      <div className={classes.portrait}>
        <DuplicantPortrait gameObjectId={gameObjectId} scale={PORTRAIT_SCALE} />
      </div>
      <div className={classes.details}>
        <div className={classes.nameRow}>
          <Typography className={classes.name} variant="h5">
            {name}
          </Typography>
          <div className={classes.actions}>
            <DuplicantMenu
              gameObjectId={gameObjectId}
              label={t("duplicant.verbs.actions_titlecase", {
                defaultValue: "Actions",
              })}
            />
          </div>
        </div>
        <Typography
          className={classes.identityLine}
          variant="body2"
          color="textSecondary"
        >
          {t("duplicant.identity_line_short", {
            defaultValue: "{{gender}} · Voice {{voice}}",
            // An unrecognised gender reads as whatever the save stored, which
            // is more use than a blank.
            gender: t(`duplicant.gender.${gender}`, {
              defaultValue: String(gender),
            }),
            voice: voiceIdx,
          })}
        </Typography>
        <AppearanceButton
          className={classes.appearance}
          gameObjectId={gameObjectId}
        />
      </div>
    </div>
  );
};

export default withStyles(styles)(withTranslation()(IdentityPanel));
