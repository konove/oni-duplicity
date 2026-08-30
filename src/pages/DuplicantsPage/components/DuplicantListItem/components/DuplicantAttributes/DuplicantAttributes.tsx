import * as React from "react";
import classnames from "classnames";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";

import Attribute from "./components/Attribute";

export interface DuplicantAttributesProps {
  className?: string;
  gameObjectId: number;
}

const styles = (theme: Theme) =>
  createStyles({
    // One column, sized to what it holds.
    //
    // This was two columns wrapped inside a fixed 240x160 box, which worked
    // only while every level was a single digit. A mega duplicant reads +9999
    // on all eleven, the second column overran the box, and the card clipped
    // it - so the numbers that had changed were the ones you could not read.
    root: {
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
      maxWidth: theme.spacing(22),
    },
  });

type Props = DuplicantAttributesProps & WithStyles<typeof styles>;

const DuplicantAttributes: React.FC<Props> = ({
  className,
  classes,
  gameObjectId,
}) => (
  <div className={classnames(className, classes.root)}>
    <Attribute gameObjectId={gameObjectId} attributeId="Athletics" />
    <Attribute gameObjectId={gameObjectId} attributeId="Cooking" />
    <Attribute gameObjectId={gameObjectId} attributeId="Digging" />
    <Attribute gameObjectId={gameObjectId} attributeId="Caring" />
    <Attribute gameObjectId={gameObjectId} attributeId="Ranching" />
    <Attribute gameObjectId={gameObjectId} attributeId="Machinery" />

    <Attribute gameObjectId={gameObjectId} attributeId="Construction" />
    <Attribute gameObjectId={gameObjectId} attributeId="Art" />
    <Attribute gameObjectId={gameObjectId} attributeId="Botanist" />
    <Attribute gameObjectId={gameObjectId} attributeId="Learning" />
    <Attribute gameObjectId={gameObjectId} attributeId="Strength" />
  </div>
);

export default withStyles(styles)(DuplicantAttributes);
