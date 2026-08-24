import * as React from "react";
import { GeyserType, GeyserBehavior } from "oni-save-parser";
import { useSelector, useDispatch } from "react-redux";

import { AppState } from "@/state";

import { geyserConfigSelector } from "../selectors/geysers";
import { modifyBehavior, BehaviorDataTarget } from "../actions/modify-behavior";
import { changeGeyserType } from "../actions/change-geyser-type";
import { changeGeyserParameter } from "../actions/change-geyser-parameter";
import { BEST_CASE_ROLLS, GeyserRolls } from "../geyser-configuration";

export interface UseGeyser {
  geyserType: string | null;
  /**
   * The five configuration rolls, each 0 to 1.
   *
   * The save also stores the game's scaled values beside them, but they are not
   * worth writing: `didInit` is not serialized, so the game recomputes every
   * one of them from these rolls the first time it reads a geyser back.
   */
  rolls: GeyserRolls | null;
  onChangeGeyserType(type: string): void;
  onChangeEmitRate(roll: number): void;
  onChangeYearLength(roll: number): void;
  onChangeYearActive(roll: number): void;
  onChangeEmitActive(roll: number): void;
  onChangeEmitLength(roll: number): void;
  onApplyBestCase(): void;
}

export default function useGeyser(gameObjectId: number): UseGeyser {
  const dispatch = useDispatch();
  const config = useSelector((state: AppState) =>
    geyserConfigSelector(state, gameObjectId),
  );

  const onChangeEmitRate = React.useCallback(
    (roll: number) => {
      dispatch(changeGeyserParameter(gameObjectId, "rateRoll", roll));
    },
    [dispatch, gameObjectId],
  );

  const onChangeGeyserType = React.useCallback(
    (type: string) => {
      dispatch(changeGeyserType(gameObjectId, type));
    },
    [dispatch, gameObjectId],
  );

  const onChangeYearLength = React.useCallback(
    (roll: number) => {
      dispatch(changeGeyserParameter(gameObjectId, "yearLengthRoll", roll));
    },
    [dispatch, gameObjectId],
  );

  const onChangeYearActive = React.useCallback(
    (roll: number) => {
      dispatch(changeGeyserParameter(gameObjectId, "yearPercentRoll", roll));
    },
    [dispatch, gameObjectId],
  );

  const onChangeEmitActive = React.useCallback(
    (roll: number) => {
      dispatch(
        changeGeyserParameter(gameObjectId, "iterationPercentRoll", roll),
      );
    },
    [dispatch, gameObjectId],
  );

  // iterationLengthRoll is the one configuration roll the page never exposed.
  const onChangeEmitLength = React.useCallback(
    (roll: number) => {
      dispatch(
        changeGeyserParameter(gameObjectId, "iterationLengthRoll", roll),
      );
    },
    [dispatch, gameObjectId],
  );

  // Three rolls in one action rather than three: a deep merge leaves the two
  // eruption timings alone, and the reader gets one change to undo rather than
  // a pile of them.
  const onApplyBestCase = React.useCallback(() => {
    dispatch(
      modifyBehavior(
        gameObjectId,
        GeyserBehavior,
        BehaviorDataTarget.Template,
        { configuration: BEST_CASE_ROLLS },
        true,
      ),
    );
  }, [dispatch, gameObjectId]);

  return {
    geyserType: config ? GeyserType[config.typeId.hash] : null,
    rolls: config
      ? {
          rateRoll: config.rateRoll,
          iterationLengthRoll: config.iterationLengthRoll,
          iterationPercentRoll: config.iterationPercentRoll,
          yearLengthRoll: config.yearLengthRoll,
          yearPercentRoll: config.yearPercentRoll,
        }
      : null,
    onChangeGeyserType,
    onChangeEmitRate,
    onChangeYearLength,
    onChangeYearActive,
    onChangeEmitActive,
    onChangeEmitLength,
    onApplyBestCase,
  };
}
