import * as React from "react";
import { get } from "lodash";
import { SaveGame } from "oni-save-parser";

import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { getSegmentName } from "../../editor-data";

export interface RawObjectTreeProps {
  className?: string;
  saveGame: SaveGame;
  onChangePath(path: string[]): void;
}

const RawObjectTree: React.FC<RawObjectTreeProps> = ({
  className,
  saveGame,
  onChangePath,
}) => {
  return (
    <SimpleTreeView
      className={className}
      slots={{
        collapseIcon: ExpandMoreIcon,
        expandIcon: ChevronRightIcon,
      }}
    >
      <RawTreeChildren
        saveGame={saveGame}
        path={[]}
        onChangePath={onChangePath}
      />
    </SimpleTreeView>
  );
};

export default RawObjectTree;

interface RawTreeChildrenProps {
  saveGame: SaveGame;
  path: string[];
  onChangePath(path: string[]): void;
}
const RawTreeChildren: React.FC<RawTreeChildrenProps> = ({
  saveGame,
  path,
  onChangePath,
}) => {
  const target = path.length == 0 ? saveGame : get(saveGame, path);
  const childrenKeys = Object.keys(target).filter((key) =>
    isObjectKey(target, key),
  );
  const children = childrenKeys.map((key) => {
    const childPath = [...path, key];
    return (
      <RawTreeChild
        key={childPath.join(".")}
        saveGame={saveGame}
        path={childPath}
        onChangePath={onChangePath}
      />
    );
  });

  return <>{children}</>;
};

interface RawTreeChildProps {
  saveGame: SaveGame;
  path: string[];
  onChangePath(path: string[]): void;
}
const RawTreeChild: React.FC<RawTreeChildProps> = ({
  saveGame,
  path,
  onChangePath,
}) => {
  // Tree items nest, so a click on a deep item bubbles through every ancestor
  // item's handler and the outermost one wins - selecting `position` would
  // leave the editor showing `gameObjects`. Claim the click here.
  const onClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChangePath(path);
    },
    [onChangePath, path],
  );

  const segmentName = getSegmentName(saveGame, path);

  return (
    <TreeItem itemId={path.join(".")} label={segmentName} onClick={onClick}>
      <RawTreeChildren
        saveGame={saveGame}
        path={path}
        onChangePath={onChangePath}
      />
    </TreeItem>
  );
};

function isObjectKey(obj: any, key: string): boolean {
  return obj[key] != null && typeof obj[key] === "object";
}
