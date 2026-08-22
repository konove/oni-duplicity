import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { isProd } from "@/runtime-env";

// TODO: Use backends to save on file space
//  Deferring until I get a chance to focus on splitting the bundles.
// import Backend from "i18next-xhr-backend";

// Initialisation is asynchronous but nothing awaits it; react-i18next
// re-renders consumers once resources are ready.
void i18n.use(initReactI18next).init({
  fallbackLng: "en",

  ns: ["common", "oni"],
  defaultNS: "common",

  resources: {
    cs: {
      common: require("@/translations/cs/common.json"),
      oni: require("@/translations/cs/oni.json"),
    },
    en: {
      common: require("@/translations/en/common.json"),
      oni: require("@/translations/en/oni.json"),
    },
    es: {
      common: require("@/translations/es/common.json"),
      oni: require("@/translations/es/oni.json"),
    },
    ko: {
      common: require("@/translations/ko/common.json"),
      oni: require("@/translations/ko/oni.json"),
    },
    ru: {
      common: require("@/translations/ru/common.json"),
      oni: require("@/translations/ru/oni.json"),
    },
    zh: {
      common: require("@/translations/zh/common.json"),
      oni: require("@/translations/zh/oni.json"),
    },
  },

  debug: !isProd,

  interpolation: {
    escapeValue: false, // not needed for react!!
  },
});

export default i18n;
