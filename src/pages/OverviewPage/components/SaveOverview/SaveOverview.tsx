import * as React from "react";

import { Trans, useTranslation } from "react-i18next";
import { connect } from "react-redux";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import PageContainer from "@/components/PageContainer";

import Destinations from "./components/Destinations";
import Difficulty from "./components/Difficulty";

import mapStateToProps, { StateProps } from "./state-props";

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

type Props = StateProps;

const SaveOverview: React.FC<Props> = ({
  saveName,
  cycleCount,
  duplicantCount,
  clusterId,
  saveVersion,
}) => {
  const { t } = useTranslation();
  return (
    <PageContainer title={t("overview-page.title")}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <Typography variant="h4" component="h1">
            {saveName}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {t("overview-page.colony_summary", {
              cycles: cycleCount,
              duplicants: duplicantCount,
            })}
          </Typography>
        </Box>
        <Typography variant="caption" color="textSecondary" component="p">
          {saveVersion &&
            t("overview-page.save_version", {
              version: saveVersion,
            })}
          {saveVersion && clusterId && " · "}
          {clusterId}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Destinations />

        <Divider sx={{ mt: 2.5, mb: 2 }} />

        <Difficulty />

        {/* Saving hands back a download rather than writing over the file that
            was opened, and until this said so the last step of the job was
            left to guesswork. */}
        <Box
          sx={{
            mt: 2.5,
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            p: "12px 16px",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            color: "text.secondary",
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 20, flex: "none" }} />
          <Typography variant="body2">
            <Trans
              i18nKey="overview-page.hand_back"
              values={{ file: `${saveName}.sav` }}
              components={{ file: <Mono />, dir: <Mono /> }}
            />
          </Typography>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default connect(mapStateToProps)(SaveOverview);
