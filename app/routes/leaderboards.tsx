import { loadArenaLadder } from "~/db";
import type { Route } from "./+types/home";
import { redirect, NavLink } from "react-router";
import { CharRace, Faction } from "~/components/race";
import { Class, NameColor } from "~/components/class";
import { Spec } from "~/components/specialization";
import { RankIcon } from "~/components/cutoffs";

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

function LadderNav(props: { ladder?: string }) {
  return (
    <nav>
      <NavLink to="/" end>
        Go Home
      </NavLink>
      {props.ladder === "3v3" ? (
        <NavLink to="/leaderboards/2v2" end>
          2v2
        </NavLink>
      ) : (
        <NavLink to="/leaderboards/3v3" end>
          3v3
        </NavLink>
      )}
    </nav>
  );
}

export default function Leaderboard(props: Route.ComponentProps) {
  return (
    <div className="">
      <h1 className="text-left">{props.params.type} Arena Ladder</h1>
      <div className="flex flex-col items-center">
        <LadderNav ladder={props.params.type} />
        <div className="content-background">
          <table>
            <thead>
              <tr className="ladder-description">
                <th>Rank</th>
                <th>Race</th>
                <th className="text-left">
                  <div className="pl-4">Player</div>
                </th>
                <th>Faction</th>
                <th>Rating</th>
                <th>Wins</th>
                <th>Losses</th>
              </tr>
            </thead>
            <tbody>
              {props.loaderData.ladder.map((player, index) => (
                <tr key={index}>
                  <td className="text-center rating">{player.rank}</td>
                  <td className="td-race">
                    <div className="div-race">
                      <CharRace raceId={player.race} gender={player.gender} />
                      <Class classId={player.class} />
                      <Spec specId={player.spell} />
                    </div>
                  </td>
                  <NameColor classId={player.class}>
                    <div className="pl-4">{player.name}</div>
                  </NameColor>
                  <td>
                    <div className="div-faction">
                      <Faction raceId={player.race} />
                    </div>
                  </td>
                  <RankIcon title={player.title}>{player.rating}</RankIcon>
                  <td className="wins text-center">{player.seasonWins}</td>
                  <td className="losses text-center">
                    {player.seasonGames - player.seasonWins}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
