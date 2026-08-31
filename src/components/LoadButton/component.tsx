import * as React from "react";

import { Trans } from "react-i18next";

import Button from "@mui/material/Button";

import AbstractLoadButton from "@/components/AbstractLoadButton";

const LoadButton: React.FC = () => {
  return (
    <AbstractLoadButton>
      {({ disabled, onClick }) => (
        <Button variant="contained" disabled={disabled} onClick={onClick}>
          <Trans i18nKey="save-file.verbs.choose_titlecase">
            Choose a save file
          </Trans>
        </Button>
      )}
    </AbstractLoadButton>
  );
};

export default LoadButton;
