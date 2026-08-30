// jest-dom's matchers only make sense against a DOM. The default environment
// here is node, so this guard keeps the pure-logic suites from importing a
// library that expects `document` to exist.
if (typeof document !== "undefined") {
  require("@testing-library/jest-dom");

  // jsdom ships no TextEncoder/TextDecoder, though every browser has had them
  // for years and node has them globally. Without these, any component that
  // reaches code touching bytes - reading a duplicant's state machines, say -
  // dies with "TextEncoder is not defined" in a way that looks like a bug in
  // the component rather than a gap in the environment.
  const { TextEncoder, TextDecoder } = require("node:util");
  if (typeof global.TextEncoder === "undefined") {
    global.TextEncoder = TextEncoder;
  }
  if (typeof global.TextDecoder === "undefined") {
    global.TextDecoder = TextDecoder;
  }
}
