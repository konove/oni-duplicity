import * as React from "react";

import { css, cx } from "@emotion/css";

/**
 * Positions the duplicant sprite layers relative to one another.
 *
 * This replaces the `DuplicantContainer` exported by `react-oni-duplicant`,
 * which is built on react-jss@8 and depends on React's legacy context API —
 * removed in React 19. The offsets below are carried over verbatim from that
 * component; the sprite children still tag themselves with the
 * `duplicant-*` class names these selectors target.
 */
const containerClass = css({
  position: "relative",

  "& .duplicant-hair": {
    position: "absolute",
    left: 7,
    top: -120,
  },
  "& .duplicant-head": {
    position: "absolute",
    left: 0,
    top: 0,
  },
  "& .duplicant-eyes": {
    position: "absolute",
    left: 10,
    top: -80,
    transform: "rotate(-12deg)",
  },
  "& .duplicant-body": {
    position: "absolute",
    left: 0,
    top: 95,
  },
});

export interface DuplicantContainerProps {
  className?: string;
  children?: React.ReactNode;
}

const DuplicantContainer: React.FC<DuplicantContainerProps> = ({
  className,
  children,
}) => <div className={cx(containerClass, className)}>{children}</div>;

export default DuplicantContainer;
