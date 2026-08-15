import * as React from "react";

import { useHref, useNavigate } from "react-router";

import Button, { ButtonProps } from "@mui/material/Button";

import { shouldNavigate } from "./utils";

export interface ButtonLinkProps {
  className?: string;
  size?: ButtonProps["size"];
  title?: string;
  to: string;
  target?: string;
  disabled?: boolean;
  onClick?(e: React.MouseEvent<HTMLElement>): void;
  children?: React.ReactNode;
}

const ButtonLink: React.FC<ButtonLinkProps> = ({
  className,
  size,
  title,
  to,
  target,
  disabled,
  onClick,
  children,
}) => {
  const navigate = useNavigate();
  const href = useHref(to);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (onClick) {
        onClick(event);
      }
      if (shouldNavigate(event, target)) {
        event.preventDefault();
        navigate(to);
      }
    },
    [onClick, target, navigate, to]
  );

  return (
    <Button
      className={className}
      size={size}
      title={title}
      component="a"
      href={href}
      target={target}
      disabled={disabled}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
};

export default ButtonLink;
