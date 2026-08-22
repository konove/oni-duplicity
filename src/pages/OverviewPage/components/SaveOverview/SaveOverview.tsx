import * as React from "react";

import { useTranslation } from "react-i18next";
import { connect } from "react-redux";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

import PageContainer from "@/components/PageContainer";

import Difficulty from "./components/Difficulty";

import mapStateToProps, { StateProps } from "./state-props";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(),
    },
    difficulty: {
      marginTop: theme.spacing(),
    },
  });

type Props = StateProps & WithStyles<typeof styles>;

const SaveOverview: React.FC<Props> = ({
  classes,
  saveName,
  cycleCount,
  duplicantCount,
  clusterId,
  saveVersion,
}) => {
  const { t } = useTranslation();
  return (
    <PageContainer title={t("overview-page.title")}>
      <div className={classes.root}>
        <Typography variant="h4">{saveName}</Typography>
        <Divider />
        <Typography>
          {t("overview-page.colony_summary", {
            cycles: cycleCount,
            duplicants: duplicantCount,
          })}
        </Typography>
        {clusterId && (
          <Typography variant="body2" color="textSecondary">
            {clusterId}
          </Typography>
        )}
        {saveVersion && (
          <Typography variant="body2" color="textSecondary">
            {t("overview-page.save_version", { version: saveVersion })}
          </Typography>
        )}
        <Difficulty className={classes.difficulty} />
      </div>
    </PageContainer>
  );
};

export default connect(mapStateToProps)(withStyles(styles)(SaveOverview));
