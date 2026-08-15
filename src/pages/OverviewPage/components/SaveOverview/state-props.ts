import { createSelector } from "reselect";

import { createStructuredSelector } from "@/state";

import { saveGameSelector } from "@/services/oni-save/selectors/save-game";

export interface StateProps {
  saveName: string;
  cycleCount: number;
}

const mapDispatchToProps = createStructuredSelector({
  saveName: createSelector(
    saveGameSelector,
    game => (game && game.header.gameInfo.baseName) || ""
  ),
  cycleCount: createSelector(
    saveGameSelector,
    game => (game && game.header.gameInfo.numberOfCycles) || 0
  )
});
export default mapDispatchToProps;
