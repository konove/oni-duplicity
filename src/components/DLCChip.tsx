import * as React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import Chip from "@mui/material/Chip";

import { dlcIdsSelector } from "@/services/oni-save/selectors/dlc";

export interface DLCChipProps {
  className?: string;
}

const DLCChip: React.FC<DLCChipProps> = ({ className }) => {
  const { t } = useTranslation();
  const dlcIds = useSelector(dlcIdsSelector);
  return (
    <div className={className} style={{ display: "flex", gap: 4 }}>
      {dlcIds.map((dlcId) => (
        <Chip
          key={dlcId}
          color="secondary"
          label={t(`oni:dlc_id.${dlcId}`, { defaultValue: dlcId })}
        />
      ))}
    </div>
  );
};
export default DLCChip;
