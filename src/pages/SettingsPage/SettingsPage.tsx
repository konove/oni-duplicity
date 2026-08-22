import * as React from "react";

import { Trans, useTranslation } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

import useOfflineModeSettings from "@/services/offline-mode/hooks/useOfflineModeSettings";

import PageContainer from "@/components/PageContainer";

import Language from "./components/Language";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(),
    },
  });

type Props = WithStyles<typeof styles>;

const SettingsPage: React.FC<Props> = ({ classes }) => {
  const { t } = useTranslation();
  const { enabled, supported, setEnabled } = useOfflineModeSettings();
  const onOfflineChecked = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEnabled(e.target.checked);
    },
    [setEnabled],
  );

  return (
    <PageContainer title={t("settings-page.title")} back>
      <div className={classes.root}>
        <div>
          <Typography variant="h5">
            <Trans i18nKey="settings-page.offline_titlecase">
              Offline Mode
            </Trans>
          </Typography>
          {!supported && (
            <Typography>
              <Trans i18nKey="settings-page.offline_unsupported">
                Offline mode is not supported in your browser.
              </Trans>
            </Typography>
          )}
          {supported && (
            <>
              <Typography>
                <Trans i18nKey="settings-page.offline_supported">
                  Your browser supports offline mode.
                </Trans>
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox checked={enabled} onChange={onOfflineChecked} />
                }
                label={t("settings-page.offline_enable")}
              />
              {enabled && (
                <Typography>
                  <Trans i18nKey="settings-page.offline_enabled">
                    Offline Mode is now enabled. This web page will be available
                    without internet access.
                  </Trans>
                </Typography>
              )}
            </>
          )}
        </div>
        <div>
          <Typography variant="h5">
            <Trans i18nKey="settings-page.language_titlecase">Language</Trans>
          </Typography>
          <Language />
        </div>
      </div>
    </PageContainer>
  );
};
export default withStyles(styles)(SettingsPage);
