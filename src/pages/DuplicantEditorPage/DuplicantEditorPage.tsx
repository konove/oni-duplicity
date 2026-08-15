import * as React from "react";

import { useParams } from "react-router";

import useGameObject from "@/services/oni-save/hooks/useGameObject";

import RedirectIfNoSave from "@/components/RedirectIfNoSave";

import DuplicantEditor from "./components/DuplicantEditor";
import DuplicantNotFound from "./components/DuplicantNotFound";

export interface DuplicantEditorRouteParams {
  gameObjectId: string;
  [key: string]: string | undefined;
}

const DuplicantEditorPage: React.FC = () => {
  const { gameObjectId } = useParams<DuplicantEditorRouteParams>();

  const { gameObjectType } = useGameObject(Number(gameObjectId));
  return (
    <>
      <RedirectIfNoSave />
      {gameObjectType === "Minion" && (
        <DuplicantEditor gameObjectId={Number(gameObjectId)} />
      )}
      {gameObjectType !== "Minion" && <DuplicantNotFound />}
    </>
  );
};

export default DuplicantEditorPage;
