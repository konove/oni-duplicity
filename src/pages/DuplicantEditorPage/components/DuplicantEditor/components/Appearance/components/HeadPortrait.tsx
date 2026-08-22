import * as React from "react";

import classnames from "classnames";

import ButtonBase from "@mui/material/ButtonBase";

import { DuplicantContainer, Hair, Head, Eyes } from "@/components/duplicant";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";

export interface HeadPortraitProps {
  className?: string;
  clickable?: boolean;
  hairOrdinal: number;
  headOrdinal: number;
  eyesOrdinal: number;
  /** Accessible name for the control, required when onClick is set. */
  label?: string;
  onClick?(e: React.MouseEvent<HTMLElement>): void;
}

const styles = (theme: Theme) =>
  createStyles({
    portraitContainer: {
      position: "relative",
      width: 110,
      height: 100,
    },
    portrait: {
      position: "absolute",
      top: 85,
      left: 56,
      width: 250,
      height: 250,
      transform: "scale(.4)",
      transformOrigin: "top left",
    },
    clickable: {
      cursor: "pointer",
    },
    // ButtonBase marks the focused element but draws nothing by itself; a tab
    // stop with no visible focus is only half an improvement.
    focusVisible: {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
  });

type Props = HeadPortraitProps & WithStyles<typeof styles>;

const HeadPortrait: React.FC<Props> = ({
  className,
  classes,
  hairOrdinal,
  headOrdinal,
  eyesOrdinal,
  clickable,
  label,
  onClick,
}) => {
  const sprites = (
    <div className={classes.portrait}>
      <DuplicantContainer>
        <Head
          className={classnames(clickable && classes.clickable)}
          ordinal={headOrdinal}
        />
        <Eyes
          className={classnames(clickable && classes.clickable)}
          ordinal={eyesOrdinal}
        />
        <Hair
          className={classnames(clickable && classes.clickable)}
          ordinal={hairOrdinal}
        />
      </DuplicantContainer>
    </div>
  );

  // A div with an onClick is invisible to the keyboard: no tab stop, no Enter
  // or Space. ButtonBase renders a real button, so the appearance picker can
  // be operated without a mouse.
  if (onClick) {
    return (
      <ButtonBase
        className={classnames(className, classes.portraitContainer)}
        focusVisibleClassName={classes.focusVisible}
        onClick={onClick}
        aria-label={label}
      >
        {sprites}
      </ButtonBase>
    );
  }

  return (
    <div className={classnames(className, classes.portraitContainer)}>
      {sprites}
    </div>
  );
};

export default withStyles(styles)(HeadPortrait);
