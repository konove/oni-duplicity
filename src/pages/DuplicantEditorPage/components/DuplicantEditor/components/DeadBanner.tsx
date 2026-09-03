import * as React from "react";
import { MinionIdentityBehavior } from "@konove/oni-save-parser";

import { WithTranslation, withTranslation } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";
import { alpha } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import useBehavior from "@/services/oni-save/hooks/useBehavior";
import useDuplicantCondition from "@/services/oni-save/hooks/useDuplicantCondition";

export interface DeadBannerProps {
  gameObjectId: number;
}

const styles = (theme: Theme) =>
  createStyles({
    // Almost nobody opens a dead duplicant to adjust their Machinery. They
    // came to bring them back, so the one thing they came for is not buried in
    // a menu.
    //
    // It costs 56px of a screen whose whole premise is fitting in 720, which
    // is why it is only here when there is something to say.
    root: {
      flex: "none",
      boxSizing: "border-box",
      minHeight: 56,
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing(1.5),
      padding: theme.spacing(1, 2),
      background: alpha(theme.palette.warning.light, 0.08),
      borderBottom: `1px solid ${alpha(theme.palette.warning.light, 0.3)}`,
    },
    headline: {
      flexShrink: 0,
    },
    dead: {
      color: theme.palette.warning.light,
    },
    detail: {
      flex: 1,
      minWidth: 0,
    },
    revive: {
      flexShrink: 0,
    },
  });

type Props = DeadBannerProps & WithStyles<typeof styles> & WithTranslation;

const DeadBanner: React.FC<Props> = ({ classes, gameObjectId, t }) => {
  const { templateData } = useBehavior(gameObjectId, MinionIdentityBehavior);
  const { isDead, revive } = useDuplicantCondition(gameObjectId);

  if (!isDead) {
    return null;
  }

  return (
    <div className={classes.root}>
      <Typography className={classes.headline} variant="h6" component="p">
        {t("duplicant.conditions.is_dead", {
          defaultValue: "{{name}} is",
          name: templateData.name,
        })}{" "}
        <span className={classes.dead}>
          {t("duplicant.conditions.dead_titlecase", { defaultValue: "Dead" })}
        </span>
      </Typography>
      <Typography
        className={classes.detail}
        variant="body2"
        color="textSecondary"
      >
        {t("duplicant.conditions.dead_description", { defaultValue: "" })}
      </Typography>
      <Button
        className={classes.revive}
        variant="contained"
        color="primary"
        onClick={revive}
      >
        {t("duplicant.verbs.revive_titlecase", { defaultValue: "Revive" })}
      </Button>
    </div>
  );
};

export default withStyles(styles)(withTranslation()(DeadBanner));
