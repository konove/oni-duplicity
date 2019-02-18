import * as React from "react";

import { createStyles, withStyles } from "@material-ui/core/styles";

import Drawer from "@material-ui/core/Drawer";

import Sidebar from "@/components/Sidebar";
import Appbar from "@/components/Appbar";

const SIDEBAR_WIDTH = 255;

const styles = createStyles({
  root: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    height: "100%"
  },
  sidebar: {
    width: SIDEBAR_WIDTH
  },
  appRoot: {
    display: "flex",
    flexDirection: "column",
    width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
    height: "100%",
    marginLeft: SIDEBAR_WIDTH
  },
  content: {
    width: "100%",
    height: "100%"
  }
});

export interface PageContainerProps {
  title: string;
}

type Props = PageContainerProps & StyleProps<typeof styles>;
const PageContainer: React.SFC<Props> = ({ classes, title, children }) => (
  <div className={classes.root}>
    <Drawer variant="permanent" anchor="left">
      <Sidebar className={classes.sidebar} />
    </Drawer>
    <div className={classes.appRoot}>
      <Appbar title={title} />
      <div className={classes.content}>{children}</div>
    </div>
  </div>
);
export default withStyles(styles)(PageContainer);
