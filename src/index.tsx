import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import "@/style.css";

import "@/debug";

import * as React from "react";
import { createRoot } from "react-dom/client";

import Root from "./root";

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<Root />);
}
