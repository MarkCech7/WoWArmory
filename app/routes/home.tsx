import type { Route } from "./+types/home";
import { NavLink } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arena Ladder" },
    { name: "description", content: "Arena Ladder" },
  ];
}

export default function Home(props: Route.ComponentProps) {
  return (
    <div>
      <h1>Hello</h1>
      <Ladder />
    </div>
  );
}

export function Ladder() {
  return (
    <nav>
      <NavLink to="/leaderboards/2v2" end>
        2v2
      </NavLink>
      <NavLink to="/leaderboards/3v3" end>
        3v3
      </NavLink>
    </nav>
  );
}
