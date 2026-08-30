import * as React from "react";

import { WithTranslation, withTranslation } from "react-i18next";

import { createStyles, withStyles, WithStyles } from "@/styles";
import Paper from "@mui/material/Paper";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import PageContainer from "@/components/PageContainer";

import IdentityBand from "./components/IdentityBand";
import Attributes from "./components/Attributes";
import Appearance from "./components/Appearance";
import Skills from "./components/Skills";
import Effects from "./components/Effects";
import Health from "./components/Health";

export interface DuplicantEditorProps {
  gameObjectId: number;
}

const styles = createStyles({
  // No padding of its own: the band paints its own inset and its bottom rule
  // has to run the full width, and the tab bar sits flush under it.
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
  },
  tabRow: {
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    height: "100%",
  },
  tabContent: {
    width: "100%",
    height: "100%",
    overflow: "auto",
  },
});

type Props = DuplicantEditorProps & WithTranslation & WithStyles<typeof styles>;

const DuplicantEditor: React.FC<Props> = ({ classes, gameObjectId, t }) => {
  const [tab, setTab] = React.useState(0);
  return (
    <PageContainer title={t("duplicant.verbs.edit_titlecase")} back>
      <div className={classes.root}>
        <IdentityBand gameObjectId={gameObjectId} />
        <div className={classes.tabRow}>
          <Paper square>
            <Tabs
              textColor="secondary"
              value={tab}
              onChange={(_, value) => setTab(value)}
            >
              <Tab
                label={t("duplicant_attribute.noun_titlecase_plural", {
                  defaultValue: "Attributes",
                })}
              />
              <Tab
                label={t("duplicant_appearance.noun_titlecase", {
                  defaultValue: "Appearance",
                })}
              />
              <Tab
                label={t("duplicant_health.noun_titlecase", {
                  defaultValue: "Health",
                })}
              />
              <Tab
                label={t("duplicant_skills.noun_titlecase_plural", {
                  defaultValue: "Skills",
                })}
              />
              <Tab
                label={t("duplicant_effect.noun_titlecase_plural", {
                  defaultValue: "Effects",
                })}
              />
            </Tabs>
          </Paper>
          <div className={classes.tabContent}>
            {tab === 0 && <Attributes gameObjectId={gameObjectId} />}
            {tab === 1 && <Appearance gameObjectId={gameObjectId} />}
            {tab === 2 && <Health gameObjectId={gameObjectId} />}
            {tab === 3 && <Skills gameObjectId={gameObjectId} />}
            {tab === 4 && <Effects gameObjectId={gameObjectId} />}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default withStyles(styles)(withTranslation()(DuplicantEditor));
