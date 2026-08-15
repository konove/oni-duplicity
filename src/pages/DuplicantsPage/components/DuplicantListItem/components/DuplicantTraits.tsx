import * as React from "react";
import { AITraitsBehavior } from "oni-save-parser";

import { WithTranslation, withTranslation } from "react-i18next";

import {
  Theme,
  createStyles,
  withStyles,
  WithStyles
} from "@/styles";
import Typography from "@mui/material/Typography";

import useBehavior from "@/services/oni-save/hooks/useBehavior";
import {
  sortTraitIdsByName,
  traitDescKey,
  traitNameKey,
} from "@/services/oni-save/traits";

export interface DuplicantTraitsProps {
  gameObjectId: number;
}

const styles = (_theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flexDirection: "column"
    },
    trait: {
      textAlign: "center",
      whiteSpace: "nowrap"
    }
  });

type Props = DuplicantTraitsProps & WithStyles<typeof styles> & WithTranslation;

const DuplicantTraits: React.FC<Props> = ({
  classes,
  gameObjectId,
  t,
  i18n
}) => {
  const { templateData } = useBehavior(gameObjectId, AITraitsBehavior);
  const traits = sortTraitIdsByName(
    (templateData || { TraitIds: [] }).TraitIds,
    t,
    i18n.language
  );
  return (
    <div className={classes.root}>
      {traits.map(trait => (
        <Typography
          key={trait}
          className={classes.trait}
          variant="body2"
          component="div"
          title={t(traitDescKey(trait), { defaultValue: "" })}
        >
          {t(traitNameKey(trait), { defaultValue: trait })}
        </Typography>
      ))}
    </div>
  );
}

export default withStyles(styles)(withTranslation()(DuplicantTraits));
