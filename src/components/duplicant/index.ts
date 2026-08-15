/**
 * Duplicant portrait sprites.
 *
 * The sprite leaves come straight from `react-oni-duplicant`, imported by
 * deep path so that the package barrel — and with it react-jss@8, which
 * cannot run on React 19 — never enters the bundle. Only the container needed
 * reimplementing; see `./DuplicantContainer`.
 */
import Head from "react-oni-duplicant/dist/components/Head";
import Hair from "react-oni-duplicant/dist/components/Hair";
import Eyes from "react-oni-duplicant/dist/components/Eyes";
import Body from "react-oni-duplicant/dist/components/Body";

// The sprite leaves already refuse an ordinal they have no art for, so a
// duplicant using parts this package predates renders blank rather than
// crashing. Re-export the range checks so callers can tell that apart from a
// duplicant that simply has no portrait, and draw something instead.
import { isValidHead } from "react-oni-duplicant/dist/assets/headshape";
import { isValidHair } from "react-oni-duplicant/dist/assets/hair";
import { isValidEyes } from "react-oni-duplicant/dist/assets/eyes";

import DuplicantContainer from "./DuplicantContainer";

export type { HeadProps } from "react-oni-duplicant/dist/components/Head";
export type { HairProps } from "react-oni-duplicant/dist/components/Hair";
export type { EyesProps } from "react-oni-duplicant/dist/components/Eyes";
export type { BodyProps } from "react-oni-duplicant/dist/components/Body";
export type { DuplicantContainerProps } from "./DuplicantContainer";

export {
  DuplicantContainer,
  Head,
  Hair,
  Eyes,
  Body,
  isValidHead,
  isValidHair,
  isValidEyes,
};
