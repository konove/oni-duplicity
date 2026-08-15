import { connect } from "react-redux";
import { Dispatch } from "redux";

import { AppState } from "@/state";
import { megaDuplicant } from "@/services/oni-save/actions/mega-duplicant";

export interface MegaMenuItemInputProps {
  gameObjectId: number;
}

function mapDispatchToProps(dispatch: Dispatch, props: MegaMenuItemInputProps) {
  return {
    onMegaDuplicant: () => dispatch(megaDuplicant(props.gameObjectId))
  };
}
type DispatchProps = ReturnType<typeof mapDispatchToProps>;

export default connect<{}, DispatchProps, MegaMenuItemInputProps, AppState>(
  null,
  mapDispatchToProps
);
