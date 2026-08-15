/**
 * Replacements for the MUI v4 styling APIs (`makeStyles`, `withStyles`,
 * `createStyles`), which were dropped in MUI v5+ along with `@mui/styles`.
 *
 * These are backed by emotion — the same engine MUI itself uses — rather than
 * the old JSS pipeline, so they work under React 19. The API surface here
 * covers exactly what this codebase uses: single-argument
 * `withStyles(styles)(C)` and zero-argument `useStyles()`.
 *
 * Rule objects are handed to emotion untouched, so anything emotion accepts
 * works — including nested selectors such as `"&::-webkit-inner-spin-button"`.
 * What is *not* supported is the JSS-specific syntax MUI v4 layered on top,
 * like `$ruleName` references between rules.
 *
 * Note on specificity: emotion appends these classes after MUI's own component
 * styles, which are inserted by the prepending cache configured in `root.tsx`.
 * That ordering is what lets `className={classes.foo}` win over a component's
 * built-in styles, matching the old JSS behaviour.
 */
import * as React from "react";

import { css as emotionCss } from "@emotion/css";
import type { CSSObject } from "@emotion/react";

import { useTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";

export type { Theme };

export type StyleRules = Record<string, CSSObject>;
export type Styles<T extends StyleRules> = T | ((theme: Theme) => T);
export type ClassNameMap<T extends StyleRules> = { [K in keyof T]: string };

/** Resolves the rule object of a `Styles` value, for use in `WithStyles`. */
type RulesOf<S> = S extends (theme: Theme) => infer R
  ? R extends StyleRules
    ? R
    : never
  : S extends StyleRules
    ? S
    : never;

/** Props injected by `withStyles`. */
export type WithStyles<S> = {
  classes: ClassNameMap<RulesOf<S>>;
};

/**
 * Identity helper kept for source compatibility. In MUI v4 this existed purely
 * to improve type inference; the types here infer correctly without it, but
 * keeping it avoids churn across ~40 call sites.
 */
export function createStyles<T extends StyleRules>(styles: T): T {
  return styles;
}

function resolveStyles<T extends StyleRules>(
  styles: Styles<T>,
  theme: Theme,
): T {
  return typeof styles === "function" ? styles(theme) : styles;
}

function toClassNames<T extends StyleRules>(rules: T): ClassNameMap<T> {
  const classes = {} as ClassNameMap<T>;
  for (const key of Object.keys(rules) as (keyof T)[]) {
    classes[key] = emotionCss(rules[key]);
  }
  return classes;
}

export function makeStyles<T extends StyleRules>(
  styles: Styles<T>,
): () => ClassNameMap<T> {
  return function useStyles(): ClassNameMap<T> {
    const theme = useTheme();
    return React.useMemo(
      () => toClassNames(resolveStyles(styles, theme)),
      [theme],
    );
  };
}

export function withStyles<T extends StyleRules>(styles: Styles<T>) {
  const useStyles = makeStyles(styles);

  return function wrap<P extends { classes: ClassNameMap<T> }>(
    Component: React.ComponentType<P>,
  ): React.FC<Omit<P, "classes">> {
    const Styled: React.FC<Omit<P, "classes">> = (props) => {
      const classes = useStyles();
      return <Component {...(props as P)} classes={classes} />;
    };

    Styled.displayName = `WithStyles(${
      Component.displayName || Component.name || "Component"
    })`;

    return Styled;
  };
}
