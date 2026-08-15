import * as React from "react";
import { last } from "lodash";

import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import { UnconnectedEditorProps } from "../EditorProps";

const BooleanFieldEditor: React.FC<UnconnectedEditorProps> = ({
  path,
  value,
  onValueChanged
}) => {
  const label = last(path)!;
  const onChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChanged(e.target.checked)
  }, [onValueChanged]);
  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={Boolean(value)}
          onChange={onChange}
          color="primary"
        />
      }
      label={label}
    />

  );
};

export default BooleanFieldEditor;
