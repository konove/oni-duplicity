/**
 * Minimal stand-in for node's `util`, aliased in webpack.config.js.
 *
 * webpack 5 stopped auto-polyfilling node core modules. The only consumer in
 * this dependency tree is oni-save-parser, which calls `util.isObject` — a
 * long-deprecated node helper that browsers never had. The full `util` npm
 * polyfill drags in a `process` global and a chain of type-check packages for
 * this one three-line function, so we supply it directly instead.
 *
 * If something ever needs more of `util`, it will fail loudly here rather than
 * silently misbehave — extend this file at that point.
 */

/** Matches node's historical `util.isObject`. */
export function isObject(arg: unknown): boolean {
  return typeof arg === "object" && arg !== null;
}

function unsupported(name: string) {
  return () => {
    throw new Error(
      `util.${name} is not available: src/node-shims/util.ts only implements ` +
        `isObject. Add it there if something now needs it.`
    );
  };
}

// The webpack alias captures every `util` import in the bundle, not just
// oni-save-parser's. Stub the members a dependency is most likely to reach for
// so it throws with a pointer here instead of "x is not a function".
export const inherits = unsupported("inherits");
export const promisify = unsupported("promisify");
export const inspect = unsupported("inspect");
export const format = unsupported("format");
export const deprecate = unsupported("deprecate");
export const callbackify = unsupported("callbackify");

export default {
  isObject,
  inherits,
  promisify,
  inspect,
  format,
  deprecate,
  callbackify,
};
