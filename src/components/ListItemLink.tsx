import * as React from "react";

import { useHref, useLocation, useNavigate } from "react-router";

import ListItemButton from "@mui/material/ListItemButton";

import { shouldNavigate } from "./utils";

export interface ListItemLinkProps {
  to: string;
  autoselect?: boolean;
  target?: string;
  disabled?: boolean;
  onClick?(e: React.MouseEvent<HTMLElement>): void;
  children?: React.ReactNode;
}

const ListItemLink: React.FC<ListItemLinkProps> = ({
  to,
  autoselect,
  target,
  disabled,
  onClick,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const href = useHref(to);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (onClick) {
        onClick(event);
      }
      if (shouldNavigate(event, target)) {
        event.preventDefault();
        // navigate() returns a promise in react-router 7; nothing here awaits it.
        void navigate(to);
      }
    },
    [onClick, target, navigate, to]
  );

  // Replaces MUI v4's `<ListItem button component="a">`. Deliberately not
  // wrapped in a ListItem: the only consumer is Nav, whose <List component="nav">
  // renders a <nav> rather than a <ul>, so an <li> here would be invalid markup.
  return (
    <ListItemButton
      selected={autoselect && pathStartsWith(location.pathname, to)}
      component="a"
      href={href}
      target={target}
      disabled={disabled}
      onClick={handleClick}
    >
      {children}
    </ListItemButton>
  );
};

export default ListItemLink;

function pathStartsWith(path: string, startsWith: string): boolean {
  if (path === startsWith) {
    return true;
  }

  return path.slice(0, startsWith.length + 1) === `${startsWith}/`;
}
