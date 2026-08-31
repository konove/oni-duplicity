import * as React from "react";
import Markdown from "react-markdown";

import { WithTranslation, withTranslation } from "react-i18next";

import { makeStyles, Theme } from "@/styles";

import ChangelogContent from "@changelog";

import PageContainer from "@/components/PageContainer";

type Props = WithTranslation;

const useStyles = makeStyles((theme: Theme) => ({
  markdown: {
    margin: theme.spacing(2),
    // react-markdown emits bare <a> elements. MUI never sees them, so without
    // this they render in the browser's default #0000EE on a dark page.
    "& a": {
      color: theme.palette.primary.main,
    },
    "& a:hover": {
      color: theme.palette.primary.light,
    },
  },
}));

const ChangelogPage: React.FC<Props> = ({ t }) => {
  const styles = useStyles();
  return (
    <PageContainer title={t("changelog.title")} back>
      {/* react-markdown no longer takes a className, so the spacing lives on
          a wrapper instead. */}
      <div className={styles.markdown}>
        <Markdown>{ChangelogContent}</Markdown>
      </div>
    </PageContainer>
  );
};

export default withTranslation()(ChangelogPage);
