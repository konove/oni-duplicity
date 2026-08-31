import i18n from "./i18n";

// `debug: !isProd` treated "not production" as "development", but there are
// three environments and jest runs in the third. Every spec that imports this
// module for real translations dumped i18next's whole init config into the CI
// log, which buries the warnings worth reading.
it("does not run in debug mode outside development", () => {
  expect(i18n.options.debug).toBe(false);
});

it("still loads the English strings the components render", () => {
  expect(i18n.getResource("en", "common", "overview-page.title")).toBe(
    "Overview",
  );
});
