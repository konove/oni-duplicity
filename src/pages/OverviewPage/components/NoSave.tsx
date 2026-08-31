import * as React from "react";

import { Trans, useTranslation } from "react-i18next";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import { OSType } from "@/runtime-env";
import { saveFilePath } from "@/save-file-paths";

import PageContainer from "@/components/PageContainer";
import LoadButton from "@/components/LoadButton";

const path = saveFilePath(OSType);

interface StepProps {
  number: number;
  title: React.ReactNode;
  children?: React.ReactNode;
}

const Step: React.FC<StepProps> = ({ number, title, children }) => (
  <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
    <Box
      aria-hidden
      sx={{
        width: 28,
        height: 28,
        flex: "none",
        borderRadius: "50%",
        bgcolor: "action.selected",
        color: "primary.main",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      {number}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 500 }}>
        {title}
      </Typography>
      {children}
    </Box>
  </Box>
);

const Mono: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <Box
    component="code"
    sx={{
      fontFamily: "ui-monospace, Consolas, monospace",
      color: "text.primary",
    }}
  >
    {children}
  </Box>
);

const NoSave: React.FC = () => {
  const { t } = useTranslation();

  return (
    <PageContainer title={t("overview-page.no-save.title")}>
      <Box sx={{ display: "flex", justifyContent: "center", pt: 7, px: 3 }}>
        <Box sx={{ width: "100%", maxWidth: 736 }}>
          <Typography variant="h4" component="h1">
            <Trans i18nKey="overview-page.no-save.headline">
              Edit a saved colony
            </Trans>
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
            <Trans i18nKey="overview-page.no-save.intro">
              Duplicity opens an Oxygen Not Included save file, lets you change
              what is inside it, and writes a new one back out. Everything
              happens in this browser tab — the save is never uploaded anywhere.
            </Trans>
          </Typography>

          {/* This used to be an h6 in error red, which read as a failure the
              page had already suffered rather than as advice. */}
          <Alert severity="warning" variant="outlined" sx={{ mt: 3 }}>
            <strong>
              <Trans i18nKey="overview-page.no-save.backup_lead">
                Back up the save first.
              </Trans>
            </strong>{" "}
            <Trans i18nKey="overview-page.no-save.backup_detail">
              Duplicity can write a file the game refuses to load, and a clean
              load here is no proof the game will accept the result.
            </Trans>
          </Alert>

          <Paper sx={{ mt: 3, p: 3 }}>
            <Step
              number={1}
              title={
                <Trans i18nKey="overview-page.no-save.step_open_title">
                  Open your save file
                </Trans>
              }
            >
              {path && (
                <Typography variant="body2" color="textSecondary">
                  <Trans
                    i18nKey="overview-page.no-save.save-location"
                    values={{ path }}
                  >
                    Save files can be found at <Mono>{"{{path}}"}</Mono>
                  </Trans>
                </Typography>
              )}
              <Box sx={{ mt: 2 }}>
                <LoadButton />
              </Box>
            </Step>

            <Divider sx={{ my: 2.5 }} />

            <Step
              number={2}
              title={
                <Trans i18nKey="overview-page.no-save.step_edit_title">
                  Change what you came for
                </Trans>
              }
            >
              <Typography variant="body2" color="textSecondary">
                <Trans i18nKey="overview-page.no-save.step_edit_detail">
                  Duplicants, geysers, creatures, asteroids and stored materials
                  each get a page in the sidebar. They stay locked until a save
                  is open, and the Overview then says what this colony actually
                  has.
                </Trans>
              </Typography>
            </Step>

            <Divider sx={{ my: 2.5 }} />

            {/* The step nothing said before: saving hands back a download, so
                the colony does not change until the file is moved into place. */}
            <Step
              number={3}
              title={
                <Trans i18nKey="overview-page.no-save.step_save_title">
                  Save, then move the file back
                </Trans>
              }
            >
              <Typography variant="body2" color="textSecondary">
                <Trans
                  i18nKey="overview-page.no-save.step_save_detail"
                  components={{ sav: <Mono />, dir: <Mono /> }}
                />
              </Typography>
            </Step>
          </Paper>

          <Typography
            variant="caption"
            color="textSecondary"
            component="p"
            sx={{ mt: 3 }}
          >
            <Trans i18nKey="overview-page.no-save.supported_saves">
              Reads and writes base game and Spaced Out! saves, including the
              Frosty Planet, Bionic Booster, Prehistoric Planet and Aquatic
              Planet packs.
            </Trans>{" "}
            <Trans i18nKey="overview-page.no-save.save_versions">
              Save versions 7.28 through 7.38; a newer save loads only behind an
              explicit override.
            </Trans>
          </Typography>
        </Box>
      </Box>
    </PageContainer>
  );
};
export default NoSave;
