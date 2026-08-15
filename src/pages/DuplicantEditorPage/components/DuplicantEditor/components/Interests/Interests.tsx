import * as React from "react";
import {
  MinionSkillGroupNames,
  MinionResumeBehavior,
  getHashedString,
  HashedString,
} from "oni-save-parser";
import { findIndex, find, difference } from "lodash";

import { WithTranslation, withTranslation } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";
import Chip from "@mui/material/Chip";

import useBehavior from "@/services/oni-save/hooks/useBehavior";

import {
  skillGroupDescKey,
  skillGroupNameKey,
  sortSkillGroupsByName,
} from "@/services/oni-save/skill-groups";

import AddAptitudeButton from "./components/AddAptitudeButton";

export interface InterestsProps {
  gameObjectId: number;
}

const styles = (theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
    },
    chip: {
      margin: theme.spacing(0.5),
    },
  });

type Props = InterestsProps & WithStyles<typeof styles> & WithTranslation;

const Interests: React.FC<Props> = ({ classes, gameObjectId, t, i18n }) => {
  const {
    templateData: { AptitudeBySkillGroup },
    onTemplateDataModify,
  } = useBehavior(gameObjectId, MinionResumeBehavior);

  const availableAptitudes = MinionSkillGroupNames.filter(
    (aptitudeName) => aptitudeValue(AptitudeBySkillGroup, aptitudeName) === 0,
  );

  const selectedAptitudes = sortSkillGroupsByName(
    difference(MinionSkillGroupNames, availableAptitudes),
    t,
    i18n.language,
  );

  function removeAptitude(aptitudeName: string) {
    const hashStr = getHashedString(aptitudeName);
    const index = findIndex(
      AptitudeBySkillGroup,
      (x) => x[0].hash === hashStr.hash,
    );
    if (index === -1) {
      return;
    }
    onTemplateDataModify({
      AptitudeBySkillGroup: [
        ...AptitudeBySkillGroup.slice(0, index),
        ...AptitudeBySkillGroup.slice(index + 1),
      ],
    });
  }

  function addAptitude(aptitudeName: string) {
    const hashStr = getHashedString(aptitudeName);
    const index = findIndex(
      AptitudeBySkillGroup,
      (x) => x[0].hash === hashStr.hash,
    );
    if (index === -1) {
      onTemplateDataModify({
        AptitudeBySkillGroup: [...AptitudeBySkillGroup, [hashStr, 1]],
      });
    } else {
      onTemplateDataModify({
        AptitudeBySkillGroup: [
          ...AptitudeBySkillGroup.slice(0, index),
          [hashStr, 1],
          ...AptitudeBySkillGroup.slice(index + 1),
        ],
      });
    }
  }

  return (
    <div className={classes.root}>
      {selectedAptitudes.map((aptitudeName) => (
        <Chip
          key={aptitudeName}
          className={classes.chip}
          label={t(skillGroupNameKey(aptitudeName), {
            defaultValue: aptitudeName,
          })}
          title={t(skillGroupDescKey(aptitudeName), { defaultValue: "" })}
          onDelete={removeAptitude.bind(null, aptitudeName)}
        />
      ))}
      <AddAptitudeButton
        className={classes.chip}
        availableAptitudes={availableAptitudes}
        onAddAptitude={addAptitude}
      />
    </div>
  );
};

export default withStyles(styles)(withTranslation()(Interests));

function aptitudeValue(
  aptitudes: [HashedString, number][],
  aptitudeName: string,
): number {
  const hash = getHashedString(aptitudeName).hash;
  const aptitude = find(aptitudes, (x) => x[0].hash === hash);
  if (!aptitude) {
    return 0;
  }
  return aptitude[1];
}
