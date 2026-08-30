import * as React from "react";

import classnames from "classnames";

import { Theme, makeStyles } from "@/styles";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";

import DuplicantMenu from "@/components/DuplicantMenu";
import DuplicantPortrait from "@/components/DuplicantPortrait";
import DeadChip from "@/components/DeadChip";

import useDuplicantCondition from "@/services/oni-save/hooks/useDuplicantCondition";

import DuplicantName from "./components/DuplicantName";
import DuplicantTraits from "./components/DuplicantTraits";
import DuplicantAttributes from "./components/DuplicantAttributes";
import EditButton from "./components/EditButton";

export interface DuplicantListItemProps {
  className?: string;
  gameObjectId: number;
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: theme.spacing(45),
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(2),
  },
  titleBar: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(),
    marginBottom: theme.spacing(),
  },
  titleControls: {
    display: "flex",
    flexDirection: "row",
    marginLeft: "auto",
  },
  content: {
    display: "flex",
    flexDirection: "row",
    marginTop: theme.spacing(),
  },
  portraitColumn: {
    marginRight: theme.spacing(2),
  },
  attributes: {
    marginLeft: "auto",
  },
  editButton: {
    marginLeft: "auto",
  },
}));

type Props = DuplicantListItemProps;

const DuplicantListItem: React.FC<Props> = ({ className, gameObjectId }) => {
  const classes = useStyles();
  const { isDead } = useDuplicantCondition(gameObjectId);
  return (
    <Paper className={classnames(classes.root, className)}>
      <div className={classes.titleBar}>
        <DuplicantName gameObjectId={gameObjectId} />
        {isDead && <DeadChip />}
        <div className={classes.titleControls}>
          <EditButton
            className={classes.editButton}
            gameObjectId={gameObjectId}
          />
          <DuplicantMenu gameObjectId={gameObjectId} />
        </div>
      </div>
      <Divider />
      <div className={classes.content}>
        <div className={classes.portraitColumn}>
          <DuplicantPortrait gameObjectId={gameObjectId} scale={0.3} />
          <DuplicantTraits gameObjectId={gameObjectId} />
        </div>
        <DuplicantAttributes
          className={classes.attributes}
          gameObjectId={gameObjectId}
        />
      </div>
    </Paper>
  );
};

export default DuplicantListItem;
