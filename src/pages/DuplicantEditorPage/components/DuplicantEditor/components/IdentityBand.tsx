import * as React from "react";
import { MinionIdentityBehavior } from "oni-save-parser";

import { WithTranslation, withTranslation, Trans } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import DuplicantPortrait from "@/components/DuplicantPortrait";
import DuplicantMenu from "@/components/DuplicantMenu";
import useBehavior from "@/services/oni-save/hooks/useBehavior";

import Traits from "./Traits";
import Interests from "./Interests";

export interface IdentityBandProps {
  gameObjectId: number;
}

// DuplicantPortrait draws into a 240x270 box before scaling, so this is a
// 100x112 portrait. The band's height follows from it: the identity column
// beside it - name row, traits run, interests run - is sized to fit alongside.
const PORTRAIT_SCALE = 100 / 240;

const styles = (theme: Theme) =>
  createStyles({
    // Replaces the old name row and portrait block, which between them spent
    // 267px on two headings, three dividers and seven chips. Everything here
    // is one row: the portrait, who this is, and what they are good at.
    root: {
      display: "flex",
      flexDirection: "row",
      gap: theme.spacing(2),
      padding: theme.spacing(1.5, 2),
      borderBottom: `1px solid ${theme.palette.divider}`,
      flexGrow: 0,
      flexShrink: 0,
    },
    portrait: {
      flex: "none",
      alignSelf: "flex-start",
    },
    identity: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1),
    },
    nameRow: {
      display: "flex",
      flexDirection: "row",
      alignItems: "baseline",
      gap: theme.spacing(1.5),
      minHeight: 32,
    },
    identityLine: {
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    menu: {
      marginLeft: "auto",
      alignSelf: "center",
    },
    run: {
      display: "flex",
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing(1),
      minWidth: 0,
    },
    // A caption rather than an h6: these label a run of chips, they do not
    // open a section. Fixed width so the two runs start on the same column.
    runLabel: {
      width: 62,
      flex: "none",
      paddingTop: theme.spacing(1),
      color: theme.palette.text.secondary,
      textTransform: "uppercase",
      letterSpacing: "0.09em",
      lineHeight: 1,
    },
  });

type Props = IdentityBandProps & WithStyles<typeof styles> & WithTranslation;

const IdentityBand: React.FC<Props> = ({ classes, gameObjectId, t }) => {
  const { templateData } = useBehavior(gameObjectId, MinionIdentityBehavior);
  const { name, gender, voiceIdx, arrivalTime } = templateData;

  return (
    <div className={classes.root}>
      <Paper className={classes.portrait}>
        <DuplicantPortrait gameObjectId={gameObjectId} scale={PORTRAIT_SCALE} />
      </Paper>
      <div className={classes.identity}>
        <div className={classes.nameRow}>
          <Typography variant="h5">{name}</Typography>
          <Typography
            className={classes.identityLine}
            variant="body2"
            color="textSecondary"
          >
            {t("duplicant.identity_line", {
              // An unrecognised gender reads as whatever the save stored,
              // which is more use than a blank.
              gender: t(`duplicant.gender.${gender}`, {
                defaultValue: String(gender),
              }),
              voice: voiceIdx,
              // MinionIdentity.arrivalTime is the cycle the duplicant printed
              // on, as a float part-way through that cycle.
              cycle: Math.floor(arrivalTime),
            })}
          </Typography>
          <div className={classes.menu}>
            <DuplicantMenu gameObjectId={gameObjectId} />
          </div>
        </div>
        <div className={classes.run}>
          <Typography className={classes.runLabel} variant="caption">
            <Trans i18nKey="duplicant_trait.noun_titlecase_plural">
              Traits
            </Trans>
          </Typography>
          <Traits gameObjectId={gameObjectId} />
        </div>
        <div className={classes.run}>
          <Typography className={classes.runLabel} variant="caption">
            <Trans i18nKey="duplicant_interest.noun_titlecase_plural">
              Interests
            </Trans>
          </Typography>
          <Interests gameObjectId={gameObjectId} />
        </div>
      </div>
    </div>
  );
};

export default withStyles(styles)(withTranslation()(IdentityBand));
