import { Outlet, NavLink } from "react-router";
import type { NavLinkProps } from "react-router";

export function CustomNavLink(props: NavLinkProps) {
  return (
    <NavLink
      {...props}
      className={"text-article-name rounded-md p-3 hover:bg-active"}
    />
  );
}
