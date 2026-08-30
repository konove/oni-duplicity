import * as React from "react";

import { useTranslation } from "react-i18next";

import Chip from "@mui/material/Chip";

export interface DeadChipProps {
  className?: string;
}

/**
 * The marker a dead duplicant carries, beside their name.
 *
 * It says the same thing in both places it appears - on the list card, where
 * it is how you find out at all, and in the editor's identity band, where it
 * says why the numbers look the way they do.
 */
const DeadChip: React.FC<DeadChipProps> = ({ className }) => {
  const { t } = useTranslation();
  return (
    <Chip
      className={className}
      size="small"
      color="error"
      variant="outlined"
      label={t("duplicant.conditions.dead_titlecase", {
        defaultValue: "Dead",
      })}
      title={t("duplicant.conditions.dead_description", { defaultValue: "" })}
    />
  );
};

export default DeadChip;
