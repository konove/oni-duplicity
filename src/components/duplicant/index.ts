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

import DuplicantContainer from "./DuplicantContainer";

export type { HeadProps } from "react-oni-duplicant/dist/components/Head";
export type { HairProps } from "react-oni-duplicant/dist/components/Hair";
export type { EyesProps } from "react-oni-duplicant/dist/components/Eyes";
export type { BodyProps } from "react-oni-duplicant/dist/components/Body";
export type { DuplicantContainerProps } from "./DuplicantContainer";

export { DuplicantContainer, Head, Hair, Eyes, Body };
