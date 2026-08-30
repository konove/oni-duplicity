import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import { GameObjectBehavior, BehaviorName, getBehavior } from "oni-save-parser";

import { modifyBehavior, BehaviorDataTarget } from "../actions/modify-behavior";
import { gameObjectsByIdSelector } from "../selectors/game-objects";

export interface UseBehavior<T extends GameObjectBehavior> {
  templateData: T["templateData"];
  extraData: T["extraData"];
  /** Bytes the behavior serialized itself, which the parser keeps opaque. */
  extraRaw: ArrayBuffer | null;
  onTemplateDataModify(templateData: DeepPartial<T["templateData"]>): void;
  onExtraDataModify(extraData: DeepPartial<T["extraData"]>): void;
  onExtraRawModify(extraRaw: ArrayBuffer): void;
}

export default function useBehavior<T extends GameObjectBehavior>(
  gameObjectId: number,
  behaviorName: BehaviorName<T>,
) {
  const dispatch = useDispatch();

  let templateData: T["templateData"] = null;
  let extraData: T["extraData"] = null;
  let extraRaw: ArrayBuffer | null = null;

  const gameObjectsById = useSelector(gameObjectsByIdSelector);
  const gameObject =
    gameObjectsById && gameObjectsById[gameObjectId]
      ? gameObjectsById[gameObjectId]
      : null;
  if (gameObject) {
    const behavior = getBehavior(gameObject, behaviorName);
    if (behavior) {
      templateData = behavior.templateData;
      extraData = behavior.extraData;
      extraRaw = behavior.extraRaw || null;
    }
  }

  const onTemplateDataModify = React.useCallback(
    (data: Partial<T["templateData"]>) => {
      dispatch(
        modifyBehavior(
          gameObjectId,
          behaviorName,
          BehaviorDataTarget.Template,
          data,
        ),
      );
    },
    [dispatch, gameObjectId, behaviorName],
  );

  const onExtraDataModify = React.useCallback(
    (data: Partial<T["extraData"]>) => {
      dispatch(
        modifyBehavior(
          gameObjectId,
          behaviorName,
          BehaviorDataTarget.Extra,
          data,
        ),
      );
    },
    [dispatch, gameObjectId, behaviorName],
  );

  const onExtraRawModify = React.useCallback(
    (data: ArrayBuffer) => {
      dispatch(
        modifyBehavior(
          gameObjectId,
          behaviorName,
          BehaviorDataTarget.Raw,
          data,
        ),
      );
    },
    [dispatch, gameObjectId, behaviorName],
  );

  return {
    templateData,
    extraData,
    extraRaw,
    onTemplateDataModify,
    onExtraDataModify,
    onExtraRawModify,
  };
}
