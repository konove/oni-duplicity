import * as React from "react";

import { useTranslation } from "react-i18next";

import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export interface BackButtonProps {
  className?: string;
  onClick(): void;
}

type Props = BackButtonProps;
const BackButton: React.FC<Props> = ({ className, onClick }) => {
  const { t } = useTranslation();
  return (
    <IconButton
      className={className}
      color="inherit"
      aria-label={t("verbs.back_titlecase")}
      onClick={onClick}
    >
      <ArrowBackIcon />
    </IconButton>
  );
};

export default BackButton;
