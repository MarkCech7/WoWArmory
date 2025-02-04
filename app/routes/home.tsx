import { loadArenaLadder } from "~/db";
import type { Route } from "./+types/home";
import type { e } from "node_modules/react-router/dist/development/route-data-Cq_b5feC.mjs";
import { NavLink } from "react-router";

export async function loader({ params }: Route.LoaderArgs) {
  let ladder = await loadArenaLadder(3);
  return { ladder };
}

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
