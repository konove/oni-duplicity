import * as React from "react";
import { useSelector } from "react-redux";

import { Navigate } from "react-router";

import { hasSaveSelector } from "@/services/oni-save/selectors/save-game";

const RedirectIfNoSave: React.FC = () => {
  const hasSave = useSelector(hasSaveSelector);
  if (!hasSave) {
    return <Navigate to="/" replace />;
  }
  return null;
};

export default RedirectIfNoSave;
