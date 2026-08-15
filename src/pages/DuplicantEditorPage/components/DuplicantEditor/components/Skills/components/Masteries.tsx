import * as React from "react";
import { MinionResumeBehavior, MinionSkillNames } from "oni-save-parser";
import { find, findIndex } from "lodash";

import { Trans } from "react-i18next";

import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Checkbox from "@mui/material/Checkbox";

import useBehavior from "@/services/oni-save/hooks/useBehavior";

export interface MasteriesProps {
  gameObjectId: number;
}

type Props = MasteriesProps;
const Masteries: React.FC<Props> = ({ gameObjectId }) => {
  const { templateData: { MasteryBySkillID }, onTemplateDataModify } = useBehavior(gameObjectId, MinionResumeBehavior);

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
        {MinionSkillNames.map(skillName => (
          <TableRow key={skillName}>
            <TableCell>{skillName}</TableCell>
            <TableCell>
              <Checkbox
                checked={getMastery(MasteryBySkillID, skillName)}
                onChange={(_, value) => onChangeMastery(skillName, value)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
export default Masteries;

function getMastery(masteries: [string, boolean][], mastery: string): boolean {
  const entry = find(masteries, x => x[0] === mastery);
  if (!entry) {
    return false;
  }
  return entry[1];
}
