// @ts-check

/** @type {import("jest").Config} */
const config = {
  roots: ["<rootDir>/src"],

  // These suites are pure logic - reducers and save-file transforms - and touch
  // no DOM. A component test opts back in with a `@jest-environment jsdom`
  // docblock; jest-environment-jsdom stays installed for that.
  testEnvironment: "node",

  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "src/tsconfig.json" }],
  },

  // Registers jest-dom matchers for the suites that opt into jsdom.
  setupFilesAfterEnv: ["<rootDir>/test/setup-dom.js"],

  testRegex: "(\\.|/)(test|spec)\\.tsx?$",

  moduleNameMapper: {
    // Asset patterns come first: mappers are applied in order, so with the
    // "@/" alias ahead of them "@/style.css" would resolve to the real file and
    // then be parsed as JavaScript.
    "\\.(css|less|scss)$": "<rootDir>/test/style-stub.js",
    "\\.(png|jpe?g|gif|svg|woff2?|ttf|eot)$": "<rootDir>/test/file-stub.js",

    // Support our local "@/foo" root alias.
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

module.exports = config;
