import * as React from "react";
import { useSelector } from "react-redux";
import { MinionIdentityBehavior, MinionResumeBehavior } from "oni-save-parser";
import { findIndex } from "lodash";

import { WithTranslation, withTranslation } from "react-i18next";

import { Theme, createStyles, withStyles, WithStyles } from "@/styles";
import Chip from "@mui/material/Chip";

import useBehavior from "@/services/oni-save/hooks/useBehavior";
import { dlcIdsSelector } from "@/services/oni-save/selectors/dlc";
import { availableSkills, skillName } from "@/services/oni-save/skills";

import PanelHeading from "../PanelHeading";

import Experience from "./components/Experience";
import AddSkillButton from "./components/AddSkillButton";

export interface SkillsProps {
  gameObjectId: number;
}

const styles = (theme: Theme) =>
  createStyles({
    chips: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing(0.75),
    },
    experience: {
      marginTop: theme.spacing(1),
    },
  });

type Props = SkillsProps & WithStyles<typeof styles> & WithTranslation;

/**
 * The skills a duplicant has mastered, plus a way to add one.
 *
 * This was a table of every skill in the game with a checkbox beside it -
 * fifty-four rows to say a duplicant had mastered one. What is true of a
 * duplicant is a short list; what is merely possible does not need to be on
 * screen until someone goes looking for it.
 */
const Skills: React.FC<Props> = ({ classes, gameObjectId, t, i18n }) => {
  const {
    templateData: { MasteryBySkillID },
    onTemplateDataModify,
  } = useBehavior(gameObjectId, MinionResumeBehavior);
  const { templateData: identity } = useBehavior(
    gameObjectId,
    MinionIdentityBehavior,
  );
  const dlcIds = useSelector(dlcIdsSelector);

  const skills = availableSkills(dlcIds, identity?.model?.name);
  const mastered = MasteryBySkillID.filter(([, isMastered]) => isMastered).map(
    ([skillId]) => skillId,
  );
  const unmastered = skills
    .map(({ id }) => id)
    .filter((id) => mastered.indexOf(id) === -1);

  const collator = new Intl.Collator(i18n.language, { sensitivity: "base" });
  const ordered = [...mastered].sort((a, b) =>
    collator.compare(skillName(a, t), skillName(b, t)),
  );

  function removeMastery(skillId: string) {
    const index = findIndex(MasteryBySkillID, (x) => x[0] === skillId);
    if (index === -1) {
      return;
    }
    onTemplateDataModify({
      MasteryBySkillID: [
        ...MasteryBySkillID.slice(0, index),
        ...MasteryBySkillID.slice(index + 1),
      ],
    });
  }

  function addMastery(skillId: string) {
    const index = findIndex(MasteryBySkillID, (x) => x[0] === skillId);
    if (index === -1) {
      onTemplateDataModify({
        MasteryBySkillID: [...MasteryBySkillID, [skillId, true]],
      });
      return;
    }
    onTemplateDataModify({
      MasteryBySkillID: [
        ...MasteryBySkillID.slice(0, index),
        [skillId, true],
        ...MasteryBySkillID.slice(index + 1),
      ],
    });
  }

  return (
    <div>
      <PanelHeading
        i18nKey="duplicant_skills.noun_titlecase_plural"
        fallback="Skills"
        detail={t("duplicant_skills.conditions.mastered_count", {
          defaultValue: "{{count}} of {{total}} mastered",
          count: mastered.length,
          total: skills.length,
        })}
      />
      <div className={classes.chips}>
        {ordered.map((skillId) => (
          <Chip
            key={skillId}
            label={skillName(skillId, t)}
            onDelete={() => removeMastery(skillId)}
          />
        ))}
        <AddSkillButton availableSkills={unmastered} onAddSkill={addMastery} />
      </div>
      <Experience className={classes.experience} gameObjectId={gameObjectId} />
    </div>
  );
};

export default withStyles(styles)(withTranslation()(Skills));
