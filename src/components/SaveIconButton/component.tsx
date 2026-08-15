import * as React from "react";

import { withTranslation, WithTranslation } from "react-i18next";

import IconButton from "@mui/material/IconButton";
import SaveIcon from "@mui/icons-material/Save";

export interface SaveIconButtonProps {
  disabled: boolean;
  onSave(): void;
}

type Props = SaveIconButtonProps & WithTranslation;
const SaveIconButton: React.FC<Props> = ({ disabled, onSave, t }) => (
  <IconButton
    title={t("save-file.verbs.save_titlecase")}
    disabled={disabled}
    onClick={onSave}
  >
    <SaveIcon />
  </IconButton>
);

export default withTranslation()(SaveIconButton);
