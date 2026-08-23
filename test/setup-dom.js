// jest-dom's matchers only make sense against a DOM. The default environment
// here is node, so this guard keeps the pure-logic suites from importing a
// library that expects `document` to exist.
if (typeof document !== "undefined") {
  require("@testing-library/jest-dom");
}
