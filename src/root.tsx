import * as React from "react";

import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

import { HashRouter } from "react-router";

import theme from "@/theme";

import StoreProvider from "@/store/components/StoreProvider";

import I18NProvider from "@/services/i18n/components/I18NProvider";

import LoadingDialog from "@/components/LoadingDialog";
import ImportWarningDialog from "@/components/ImportWarningDialog";
import ImportErrorDialog from "@/components/ImportErrorDialog";

import Routes from "@/routes";

// `prepend` puts MUI's own component styles at the top of <head>, so the
// classes produced by @/styles (inserted afterwards by emotion's default
// cache) win on equal specificity. This reproduces the JSS ordering the
// `classes` overrides throughout this app were written against.
const muiCache = createCache({ key: "mui", prepend: true });

const Root: React.FC = () => (
  <CacheProvider value={muiCache}>
    <I18NProvider>
      <StoreProvider>
        <HashRouter>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <LoadingDialog />
            <ImportWarningDialog />
            <ImportErrorDialog />
            <Routes />
          </ThemeProvider>
        </HashRouter>
      </StoreProvider>
    </I18NProvider>
  </CacheProvider>
);

export default Root;
