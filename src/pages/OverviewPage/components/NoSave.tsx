import * as React from "react";

import { Trans, WithTranslation, withTranslation } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

import { OSType } from "@/runtime-env";

import PageContainer from "@/components/PageContainer";
import LoadButton from "@/components/LoadButton";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
      maxWidth: "640px",
    },
    paper: {
      padding: theme.spacing(2),
      margin: theme.spacing(2),
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
  });

const SaveFilePaths: Record<OSType, string | null> = {
  windows: "Documents/Klei/OxygenNotIncluded/save_files",
  mac: null,
  linux: "~/.config/unity3d/Klei/Oxygen Not Included/save_files",
  unknown: null,
};
const saveFilePath = SaveFilePaths[OSType];

type Props = WithStyles<typeof styles> & WithTranslation;

const NoSave: React.FC<Props> = ({ classes, t }) => (
  <PageContainer title={t("overview-page.no-save.title")}>
    <div className={classes.root}>
      <Paper className={classes.paper}>
        <Typography variant="h6" color="error">
          <Trans i18nKey="overview-page.no-save.backup_warning">
            Always back up a save before editing it. Editing can corrupt a
            colony, and a clean load here is no guarantee the game will accept
            the result.
          </Trans>
        </Typography>
        <Typography variant="body1">
          <Trans i18nKey="overview-page.no-save.supported_saves">
            Reads and writes base game and Spaced Out! saves, including the
            Frosty Planet, Bionic Booster, Prehistoric Planet and Aquatic Planet
            packs.
          </Trans>
        </Typography>
      </Paper>
      <Divider />
      <div>
        <Typography variant="h5">
          <Trans i18nKey="overview-page.no-save.prompt">
            Load a save using the controls on the upper left.
          </Trans>
        </Typography>
      </div>
      {SaveFilePaths[OSType] && (
        <Typography component="div" variant="body1">
          <Trans
            i18nKey="overview-page.no-save.save-location"
            values={{ path: saveFilePath }}
          >
            Save files can be found at <code>{"{{path}}"}</code>
          </Trans>
        </Typography>
      )}
      <LoadButton />
      {/* <Typography component="div">
        Have no save file? Want to preview the editor?
      </Typography>
      <LoadExampleButton /> */}
    </div>
  </PageContainer>
);
export default withStyles(styles)(withTranslation()(NoSave));
