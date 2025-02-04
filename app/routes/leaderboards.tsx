import { loadArenaLadder } from "~/db";
import type { Route } from "./+types/home";
import { redirect, NavLink } from "react-router";
import { CharRace } from "~/components/race";
import { Class } from "~/components/class";
import { Spec } from "~/components/specialization";

export async function loader({ params }: Route.LoaderArgs) {
  let ladderType: number;
  if (params.type === "2v2") {
    ladderType = 2;
  } else if (params.type === "3v3") {
    ladderType = 3;
  } else {
    return redirect("/leaderboards/2v2");
  }
  let ladder = await loadArenaLadder(ladderType);
  return { ladder };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arena Ladder" },
    { name: "description", content: "Arena Ladder" },
  ];
}

function LadderNav() {
  return (
    <nav>
      <NavLink to="/" end>
        Go Home
      </NavLink>
      <NavLink to="/leaderboards/2v2" end>
        2v2
      </NavLink>
      <NavLink to="/leaderboards/3v3" end>
        3v3
      </NavLink>
    </nav>
  );
}

export default function Home(props: Route.ComponentProps) {
  return (
    <div>
      <h1>{props.params.type} Arena Ladder</h1>
      <LadderNav />
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Race</th>
            <th>Player</th>
            <th>Rating</th>
            <th>Wins</th>
            <th>Losses</th>
          </tr>
        </thead>
        <tbody>
          {props.loaderData.ladder.map((player, index) => (
            <tr key={index}>
              <td>{player.rank}</td>
              <td className="tdRace">
                <div className="divRace">
                  <CharRace raceId={player.race} gender={player.gender} />
                  <Class classId={player.class} />
                  <Spec specId={player.spell} />
                </div>
              </td>
              <td>{player.name}</td>
              <td>{player.rating}</td>
              <td>{player.seasonWins}</td>
              <td>{player.seasonGames - player.seasonWins}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
