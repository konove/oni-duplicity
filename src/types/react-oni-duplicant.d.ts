/**
 * Typings for the leaf sprite components of `react-oni-duplicant`.
 *
 * The package ships its declarations under `dts/` rather than alongside the
 * JS in `dist/`, so TypeScript cannot find them for the deep imports we use.
 * We import deeply on purpose: the package barrel pulls in its
 * `DuplicantContainer`, which is built on react-jss@8 and relies on React's
 * legacy context — removed in React 19. `@/components/duplicant` supplies a
 * replacement container, and these four components are plain function
 * components that work as-is.
 *
 * The originals are typed `React.SFC`, which no longer exists in
 * @types/react 19; these declarations restate them as `React.FC`.
 */

declare module "react-oni-duplicant/dist/types" {
  export enum DuplicantDirection {
    Forward = "forward",
    Right = "right",
    Away = "away",
  }
}

declare module "react-oni-duplicant/dist/components/Head" {
  import * as React from "react";
  import { DuplicantDirection } from "react-oni-duplicant/dist/types";

  export interface HeadProps {
    className?: string;
    ordinal: number;
    direction?: DuplicantDirection;
  }

  const Head: React.FC<HeadProps>;
  export default Head;
}

declare module "react-oni-duplicant/dist/components/Hair" {
  import * as React from "react";
  import { DuplicantDirection } from "react-oni-duplicant/dist/types";

  export interface HairProps {
    className?: string;
    ordinal: number;
    direction?: DuplicantDirection;
  }

  const Hair: React.FC<HairProps>;
  export default Hair;
}

declare module "react-oni-duplicant/dist/components/Eyes" {
  import * as React from "react";

  export interface EyesProps {
    className?: string;
    ordinal: number;
  }

  const Eyes: React.FC<EyesProps>;
  export default Eyes;
}

declare module "react-oni-duplicant/dist/components/Body" {
  import * as React from "react";
  import { DuplicantDirection } from "react-oni-duplicant/dist/types";

  export interface BodyProps {
    className?: string;
    ordinal: number;
    direction?: DuplicantDirection;
  }

  const Body: React.FC<BodyProps>;
  export default Body;
}

/**
 * Range checks for the sprite sets. Each leaf component already calls its own
 * before rendering and returns null when the ordinal is out of range, so
 * these exist so callers can anticipate a blank portrait rather than discover
 * one — a duplicant from a content pack newer than these sprites (a bionic
 * one, say) can use parts well past the highest asset shipped here.
 */
declare module "react-oni-duplicant/dist/assets/headshape" {
  export function isValidHead(ordinal: number): boolean;
}

declare module "react-oni-duplicant/dist/assets/hair" {
  export function isValidHair(ordinal: number): boolean;
}

declare module "react-oni-duplicant/dist/assets/eyes" {
  export function isValidEyes(ordinal: number): boolean;
}
