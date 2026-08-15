import * as React from "react";

import { Provider } from "react-redux";

import store from "../store";

export interface StoreProviderProps {
  children?: React.ReactNode;
}

const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => (
  <Provider store={store}>{children}</Provider>
);
export default StoreProvider;
