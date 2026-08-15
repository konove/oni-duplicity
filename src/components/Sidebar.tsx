import * as React from "react";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";

import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

import Nav from "./Nav";
import GithubButton from "./GithubButton";

export interface SidebarProps {
  className?: string;
}

const styles = (theme: Theme) =>
  createStyles({
    toolbar: {
      // MUI types this mixin with its own CSS shape, whose `@font-face` entry
      // does not line up with emotion's CSSObject index signature.
      ...(theme.mixins.toolbar as Record<string, any>),
      display: "flex",
      paddingLeft: theme.spacing(3),
      alignItems: "center",
    },
    ghButton: {
      marginLeft: "auto",
      marginRight: theme.spacing(),
    },
  });

type Props = SidebarProps & WithStyles<typeof styles>;

const Sidebar: React.FC<Props> = ({ className, classes }) => (
  <div className={className}>
    <div className={classes.toolbar}>
      <Typography variant="h6" color="textSecondary">
        Duplicity
      </Typography>
      <GithubButton className={classes.ghButton} />
    </div>
    <Divider />
    <Nav />
  </div>
);
export default withStyles(styles)(Sidebar);
