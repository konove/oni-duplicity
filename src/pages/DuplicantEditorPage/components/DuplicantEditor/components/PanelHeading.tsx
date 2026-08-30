import * as React from "react";

import { Trans } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";
import Typography from "@mui/material/Typography";

export interface PanelHeadingProps {
  i18nKey: string;
  fallback: string;
  /** The count or state the section can summarise in a few words. */
  detail?: string;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: theme.spacing(1),
      marginBottom: theme.spacing(0.75),
    },
    // A caption rather than an h6. Six sections on one screen is a lot of
    // heading if each one shouts; these label a panel, they do not open a
    // chapter.
    label: {
      textTransform: "uppercase",
      letterSpacing: "0.09em",
      lineHeight: 1,
    },
    detail: {
      flexShrink: 0,
    },
  });

type Props = PanelHeadingProps & WithStyles<typeof styles>;

const PanelHeading: React.FC<Props> = ({
  classes,
  i18nKey,
  fallback,
  detail,
}) => (
  <div className={classes.root}>
    <Typography
      className={classes.label}
      variant="caption"
      component="h2"
      color="textSecondary"
    >
      <Trans i18nKey={i18nKey}>{fallback}</Trans>
    </Typography>
    {detail && (
      <Typography
        className={classes.detail}
        variant="caption"
        color="textSecondary"
      >
        {detail}
      </Typography>
    )}
  </div>
);

export default withStyles(styles)(PanelHeading);
