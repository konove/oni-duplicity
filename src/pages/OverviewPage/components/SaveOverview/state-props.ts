import { createSelector } from "reselect";

import { createStructuredSelector } from "@/state";

import { saveGameSelector } from "@/services/oni-save/selectors/save-game";

export interface StateProps {
  saveName: string;
  cycleCount: number;
  duplicantCount: number;
  clusterId: string;
  saveVersion: string;
}

const mapDispatchToProps = createStructuredSelector({
  saveName: createSelector(
    saveGameSelector,
    (game) => (game && game.header.gameInfo.baseName) || "",
  ),
  cycleCount: createSelector(
    saveGameSelector,
    (game) => (game && game.header.gameInfo.numberOfCycles) || 0,
  ),
  duplicantCount: createSelector(
    saveGameSelector,
    (game) => (game && game.header.gameInfo.numberOfDuplicants) || 0,
  ),
  // Namespaced, e.g. "dlc4::clusters/PrehistoricClassicCluster". Absent on
  // saves predating Spaced Out.
  clusterId: createSelector(
    saveGameSelector,
    (game) => (game && game.header.gameInfo.clusterId) || "",
  ),
  saveVersion: createSelector(saveGameSelector, (game) =>
    game ? `${game.version.major}.${game.version.minor}` : "",
  ),
});
export default mapDispatchToProps;
