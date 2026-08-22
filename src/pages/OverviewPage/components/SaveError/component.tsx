import * as React from "react";

import { Trans, useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";

import { Theme, createStyles, makeStyles } from "@/styles";

import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";

import {
  loadingErrorSelector,
  loadingFileSelector,
} from "@/services/oni-save/selectors/loading-status";

import PageContainer from "@/components/PageContainer";
import { E_VERSION_MAJOR, E_VERSION_MINOR } from "oni-save-parser";
import { loadOniSave } from "@/services/oni-save/actions/load-onisave";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(),
    },
    errorMessage: {
      marginTop: theme.spacing(),
    },
  }),
);

const SaveError: React.FC = () => {
  const { t } = useTranslation();
  const classes = useStyles();
  const dispatch = useDispatch();
  const saveError: any = useSelector(loadingErrorSelector);
  const saveFile = useSelector(loadingFileSelector);

  const onForceLoad = React.useCallback(() => {
    if (saveFile) {
      dispatch(loadOniSave(saveFile, true));
    }
  }, [saveFile, dispatch]);

  let errorContent: React.JSX.Element;
  if (saveError.code === E_VERSION_MAJOR) {
    errorContent = (
      <>
        <Trans i18nKey="save-file.conditions.version_major">
          This save file indicates it is for a version of the game that is
          incompatible with this editor.
        </Trans>
        <Divider />
        <Typography variant="caption" className={classes.errorMessage}>
          {saveError.message}
        </Typography>
      </>
    );
  } else if (saveError.code === E_VERSION_MINOR) {
    errorContent = (
      <>
        <p>
          <Trans i18nKey="save-file.conditions.version_minor">
            This save is from a version of the game the editor has not been
            checked against.
          </Trans>
        </p>
        <p>
          <Trans i18nKey="save-file.conditions.version_minor_detail">
            Saves describe their own structure, so a version that only adds or
            reorders fields usually still reads correctly. It may well be
            editable.
          </Trans>
        </p>
        <Typography color="error">
          <Trans i18nKey="save-file.conditions.version_minor_warning">
            WARNING: Editing it may still produce corrupt data, leading to
            crashes and game breaking bugs later. Back up the save first, and
            load it at your own risk.
          </Trans>
        </Typography>
        <Button onClick={onForceLoad}>
          <Trans i18nKey="save-file.verbs.force_load">
            Override safety checks and load the save
          </Trans>
        </Button>
        <Divider />
        <Typography variant="caption" className={classes.errorMessage}>
          {saveError.message}
        </Typography>
      </>
    );
  } else {
    errorContent = (
      <Typography className={classes.errorMessage}>
        {saveError.message}
      </Typography>
    );
  }

  return (
    <PageContainer title={t("save-file.conditions.load_failed_titlecase")}>
      <div className={classes.root}>
        <Typography variant="h5">
          <Trans i18nKey="save-file.conditions.load_failed">
            Error loading save
          </Trans>
        </Typography>
        <Divider />
        {errorContent}
      </div>
    </PageContainer>
  );
};

export default SaveError;
