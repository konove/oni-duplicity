import * as React from "react";
import { useSelector } from "react-redux";
import { MinionIdentityBehavior, MinionResumeBehavior } from "oni-save-parser";
import { find, findIndex } from "lodash";

import { Trans, WithTranslation, withTranslation } from "react-i18next";

import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Checkbox from "@mui/material/Checkbox";

import useBehavior from "@/services/oni-save/hooks/useBehavior";
import { dlcIdsSelector } from "@/services/oni-save/selectors/dlc";
import { availableSkills, skillName } from "@/services/oni-save/skills";

export interface MasteriesProps {
  gameObjectId: number;
}

type Props = MasteriesProps & WithTranslation;
const Masteries: React.FC<Props> = ({ gameObjectId, t }) => {
  const { templateData: { MasteryBySkillID }, onTemplateDataModify } = useBehavior(gameObjectId, MinionResumeBehavior);
  const { templateData: identity } = useBehavior(gameObjectId, MinionIdentityBehavior);
  const dlcIds = useSelector(dlcIdsSelector);

  const skills = availableSkills(dlcIds, identity?.model?.name);

  function onChangeMastery(skillName: string, value: boolean) {
    const index = findIndex(MasteryBySkillID, x => x[0] === skillName);
    if (value) {
      if (index !== -1) {
        onTemplateDataModify({
          MasteryBySkillID: [
            ...MasteryBySkillID.slice(0, index),
            [skillName, true],
            ...MasteryBySkillID.slice(index + 1)
          ]
        });
      } else {
        onTemplateDataModify({
          MasteryBySkillID: [...MasteryBySkillID, [skillName, true]]
        });
      }
    } else if (index !== -1) {
      onTemplateDataModify({
        MasteryBySkillID: [
          ...MasteryBySkillID.slice(0, index),
          ...MasteryBySkillID.slice(index + 1)
        ]
      });
    }
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>
            <Trans i18nKey="duplicant_skills.noun_titlecase">Skill</Trans>
          </TableCell>
          <TableCell>
            <Trans i18nKey="duplicant_skills.mastery_titlecase">
              Mastery
                </Trans>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {skills.map(({ id }) => (
          <TableRow key={id}>
            <TableCell>{skillName(id, t)}</TableCell>
            <TableCell>
              <Checkbox
                checked={getMastery(MasteryBySkillID, id)}
                onChange={(_, value) => onChangeMastery(id, value)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
export default withTranslation()(Masteries);

function getMastery(masteries: [string, boolean][], mastery: string): boolean {
  const entry = find(masteries, x => x[0] === mastery);
  if (!entry) {
    return false;
  }
  return entry[1];
}
