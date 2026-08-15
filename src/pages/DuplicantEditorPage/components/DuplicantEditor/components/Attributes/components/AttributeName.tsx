import * as React from "react";

import { WithTranslation, withTranslation } from "react-i18next";

import Typography from "@mui/material/Typography";

export interface AttributeNameProps {
  className?: string;
  attributeId: string;
}

type Props = AttributeNameProps & WithTranslation;
const AttributeName: React.FC<Props> = ({ className, attributeId, t }) => (
  <Typography
    className={className}
    component="span"
    variant="body1"
    title={t(`oni:DUPLICANTS.ATTRIBUTES.${attributeId}.DESC`, {
      defaultValue: ""
    })}
  >
    {t(`oni:DUPLICANTS.ATTRIBUTES.${attributeId}.NAME`, {
      defaultValue: attributeId
    })}
  </Typography>
);

export default withTranslation()(AttributeName);
