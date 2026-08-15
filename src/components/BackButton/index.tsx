import * as React from "react";

import { useNavigate } from "react-router";

import BackButton, { BackButtonProps } from "./component";

export type ConnectedBackButtonProps = Omit<BackButtonProps, "onClick">;

const ConnectedBackButton: React.FC<ConnectedBackButtonProps> = (props) => {
  const navigate = useNavigate();
  // Wrapped so the handler returns void rather than react-router's promise.
  const onClick = React.useCallback(() => {
    void navigate(-1);
  }, [navigate]);
  return <BackButton {...props} onClick={onClick} />;
};

export default ConnectedBackButton;
