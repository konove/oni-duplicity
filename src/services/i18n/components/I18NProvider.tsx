import * as React from "react";

import { I18nextProvider } from "react-i18next";

import i18n from "../i18n";

export interface I18NProviderProps {
  children?: React.ReactNode;
}

const I18NProvider: React.FC<I18NProviderProps> = ({ children }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);
export default I18NProvider;
