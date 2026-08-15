import * as React from "react";
import { useSelector } from "react-redux";

import { dlcIdsSelector, hasDLCs } from "@/services/oni-save/selectors/dlc";

export interface RequireDLCProps {
  /**
   * The content pack, or packs, the children need.
   *
   * Several ids mean "all of these", not "any of these". `DLCIds.None` means
   * the save must have no content packs at all.
   */
  dlcId: string | string[];
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

const RequireDLC: React.FC<RequireDLCProps> = ({
  dlcId,
  fallback,
  children,
}) => {
  const dlcIds = useSelector(dlcIdsSelector);
  if (hasDLCs(dlcIds, dlcId)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

export default RequireDLC;
