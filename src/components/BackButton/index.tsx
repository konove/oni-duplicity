import * as React from "react";

import { useNavigate } from "react-router";

import BackButton, { BackButtonProps } from "./component";

export type ConnectedBackButtonProps = Omit<BackButtonProps, "onClick">;

const ConnectedBackButton: React.FC<ConnectedBackButtonProps> = (props) => {
  const navigate = useNavigate();
  const onClick = React.useCallback(() => navigate(-1), [navigate]);
  return <BackButton {...props} onClick={onClick} />;
};

export default ConnectedBackButton;
