import * as React from "react";

import { Trans } from "react-i18next";

import MenuItem from "@mui/material/MenuItem";

export interface ImportMenuItemProps {
  onImportDuplicant(file: File): void;
  onClose(): void;
}

type Props = ImportMenuItemProps;
const ImportMenuItem: React.FC<Props> = ({ onImportDuplicant, onClose }) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const onMenuItemClick = React.useCallback(() => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }, [inputRef]);

  const onFileChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];

      onImportDuplicant(file);
      onClose();
    },
    [onImportDuplicant, onClose],
  );

  return (
    <>
      <MenuItem onClick={onMenuItemClick}>
        <Trans i18nKey="data.verbs.import_titlecase">Import</Trans>
      </MenuItem>
      <input
        ref={inputRef}
        style={{ display: "none" }}
        type="file"
        accept=".json"
        onChange={onFileChange}
      />
    </>
  );
};

export default ImportMenuItem;
