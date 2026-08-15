import * as React from "react";

import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export interface BackButtonProps {
  className?: string;
  onClick(): void;
}

type Props = BackButtonProps;
const BackButton: React.FC<Props> = ({ className, onClick }) => (
  <IconButton
    className={className}
    color="inherit"
    aria-label="Back"
    onClick={onClick}
  >
    <ArrowBackIcon />
  </IconButton>
);

export default BackButton;
