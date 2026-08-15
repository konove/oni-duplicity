import * as React from "react";

import { useNavigate } from "react-router";

import IconButton from "@mui/material/IconButton";

import SettingsIcon from "@mui/icons-material/Settings";

const SettingsButton: React.FC = () => {
  const navigate = useNavigate();
  const onClick = React.useCallback(() => navigate("/settings"), [navigate]);

  return (
    <IconButton color="inherit" onClick={onClick}>
      <SettingsIcon />
    </IconButton>
  );
};

export default SettingsButton;
