import * as React from "react";

import { Trans } from "react-i18next";
import { AIAttributeLevelsBehavior } from "oni-save-parser";
import { findIndex } from "lodash";

import Typography from "@mui/material/Typography";

import useBehavior from "@/services/oni-save/hooks/useBehavior";

import CommitTextField from "@/components/CommitTextField";

export interface AttributeFieldProps {
  className?: string;
  /** Applied to the <input> itself, for centring the value. */
  inputClassName?: string;
  gameObjectId: number;
  attributeId: string;
}

type Props = AttributeFieldProps;
const AttributeField: React.FC<Props> = ({
  className,
  inputClassName,
  gameObjectId,
  attributeId,
}) => {
  const {
    templateData: { saveLoadLevels },
    onTemplateDataModify,
  } = useBehavior(gameObjectId, AIAttributeLevelsBehavior);

  const attrIndex = findIndex(
    saveLoadLevels,
    (x) => x.attributeId === attributeId,
  );

  if (attrIndex === -1) {
    return (
      <Typography>
        <Trans i18nKey="duplicant_attribute.conditions.missing_titlecase">
          Attribute Not Found
        </Trans>
      </Typography>
    );
  }

  const attr = saveLoadLevels[attrIndex];
  const { level } = attr;

  return (
    <CommitTextField
      className={className}
      type="number"
      // Small, because the cell it sits in is 56px tall and a default outlined
      // input is 56px on its own.
      size="small"
      // A FormControl is block level, so left alone it stretches to the grid
      // column and the value swims in it. Size it from the value instead, in
      // `ch`, which keeps short values compact and lets long ones grow rather
      // than clip. The added padding covers MUI's outlined input inset.
      style={{
        width: `calc(${Math.max(String(level).length, 2)}ch + 34px)`,
      }}
      slotProps={{ htmlInput: { className: inputClassName } }}
      value={level}
      onCommit={(value) => {
        const newLevels = [...saveLoadLevels];
        newLevels[attrIndex] = { ...attr, level: Number(value) };
        onTemplateDataModify({
          saveLoadLevels: newLevels,
        });
      }}
    />
  );
};

export default AttributeField;
