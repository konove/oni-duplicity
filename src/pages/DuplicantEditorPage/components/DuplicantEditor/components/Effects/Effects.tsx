import * as React from "react";
import { AIEffectsBehavior } from "oni-save-parser";
import { merge } from "lodash";

import { Trans, WithTranslation, withTranslation } from "react-i18next";

import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";

import useBehavior from "@/services/oni-save/hooks/useBehavior";
import { effectName, sortEffectsByName } from "@/services/oni-save/effects";

import CommitTextField from "@/components/CommitTextField";

import AddEffectButton from "./components/AddEffectButton";

export interface EffectsProps {
  gameObjectId: number;
}

type Props = EffectsProps & WithTranslation;
const Effects: React.FC<Props> = ({ gameObjectId, t, i18n }) => {
  const { templateData, onTemplateDataModify } = useBehavior(
    gameObjectId,
    AIEffectsBehavior,
  );

  // Display order only. Committing below still uses each effect's original
  // index, so reordering the rows cannot edit the wrong entry.
  const ordered = sortEffectsByName(
    templateData.saveLoadEffects.map((x) => x.id),
    t,
    i18n.language,
  ).map((id) => {
    const index = templateData.saveLoadEffects.findIndex((x) => x.id === id);
    return { ...templateData.saveLoadEffects[index], index };
  });
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>
            <Trans i18nKey="duplicant_effect.noun_titlecase">Effect</Trans>
          </TableCell>
          <TableCell align="right">
            <Trans i18nKey="time_cycles.noun_titlecase">Time (cycles)</Trans>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {ordered.map(({ id, timeRemaining, index: i }) => (
          <TableRow key={id}>
            <TableCell component="th" scope="row">
              {effectName(id, t)}
            </TableCell>
            <TableCell align="right">
              <CommitTextField
                type="number"
                value={timeRemaining / 200}
                onCommit={(value) =>
                  onTemplateDataModify({
                    saveLoadEffects: merge([], templateData.saveLoadEffects, {
                      [i]: { id, timeRemaining: Number(value) * 200 },
                    }),
                  })
                }
              />
            </TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell colSpan={2} align="right">
            <AddEffectButton gameObjectId={gameObjectId} />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default withTranslation()(Effects);
