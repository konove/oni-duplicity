import * as React from "react";

import { WithTranslation, withTranslation } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";

import PageContainer from "@/components/PageContainer";

import IdentityPanel from "./components/IdentityPanel";
import PanelHeading from "./components/PanelHeading";
import Traits from "./components/Traits";
import Interests from "./components/Interests";
import Attributes from "./components/Attributes";
import Skills from "./components/Skills";
import Effects from "./components/Effects";
import Health from "./components/Health";

export interface DuplicantEditorProps {
  gameObjectId: number;
}

/**
 * Below this the three columns will not fit, so they stack and the page
 * scrolls. Everything stays reachable; only the no-scrolling promise goes.
 */
const THREE_COLUMN_MINIMUM = 1100;

const styles = (theme: Theme) =>
  createStyles({
    // The whole duplicant at once, and no tabs.
    //
    // Five mutually exclusive views meant no question spanning two of them
    // could be answered without switching - is Medicine 5 why this duplicant
    // holds the Doctor interest? - and the identity block was re-paid on every
    // one of them. This fits by refusing to give everything equal space
    // instead: attributes are a ruled list rather than a grid of form fields,
    // health is meters, and the sections that are nearly all "off" say what is
    // on and offer to add.
    root: {
      display: "flex",
      flexDirection: "row",
      alignItems: "stretch",
      width: "100%",
      height: "100%",
      overflow: "auto",
      [`@media (max-width: ${THREE_COLUMN_MINIMUM - 1}px)`]: {
        flexDirection: "column",
        alignItems: "stretch",
        height: "auto",
      },
    },
    column: {
      boxSizing: "border-box",
      padding: theme.spacing(2),
      minWidth: 0,
      [`@media (max-width: ${THREE_COLUMN_MINIMUM - 1}px)`]: {
        width: "100%",
        borderRight: "none",
        borderBottom: `1px solid ${theme.palette.divider}`,
      },
    },
    // The stacked widths have to be restated here: these rules come after
    // `column` in source order, so its media query alone would not win.
    identityColumn: {
      width: 344,
      flex: "none",
      borderRight: `1px solid ${theme.palette.divider}`,
      [`@media (max-width: ${THREE_COLUMN_MINIMUM - 1}px)`]: {
        width: "100%",
      },
    },
    attributesColumn: {
      width: 400,
      flex: "none",
      borderRight: `1px solid ${theme.palette.divider}`,
      [`@media (max-width: ${THREE_COLUMN_MINIMUM - 1}px)`]: {
        width: "100%",
      },
    },
    healthColumn: {
      flex: 1,
    },
    section: {
      marginTop: theme.spacing(2),
    },
  });

type Props = DuplicantEditorProps & WithTranslation & WithStyles<typeof styles>;

const DuplicantEditor: React.FC<Props> = ({ classes, gameObjectId, t }) => (
  <PageContainer title={t("duplicant.verbs.edit_titlecase")} back>
    <div className={classes.root}>
      <div className={`${classes.column} ${classes.identityColumn}`}>
        <IdentityPanel gameObjectId={gameObjectId} />
        <div className={classes.section}>
          <PanelHeading
            i18nKey="duplicant_trait.noun_titlecase_plural"
            fallback="Traits"
          />
          <Traits gameObjectId={gameObjectId} />
        </div>
        <div className={classes.section}>
          <PanelHeading
            i18nKey="duplicant_interest.noun_titlecase_plural"
            fallback="Interests"
          />
          <Interests gameObjectId={gameObjectId} />
        </div>
        <div className={classes.section}>
          <Skills gameObjectId={gameObjectId} />
        </div>
        <div className={classes.section}>
          <Effects gameObjectId={gameObjectId} />
        </div>
      </div>
      <div className={`${classes.column} ${classes.attributesColumn}`}>
        <Attributes gameObjectId={gameObjectId} />
      </div>
      <div className={`${classes.column} ${classes.healthColumn}`}>
        <Health gameObjectId={gameObjectId} />
      </div>
    </div>
  </PageContainer>
);

export default withStyles(styles)(withTranslation()(DuplicantEditor));
