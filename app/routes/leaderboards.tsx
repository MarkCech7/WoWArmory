import type { Route } from "./+types/leaderboards";
import { loadArenaLadder } from "~/server/db";
import { redirect, NavLink } from "react-router";
import { CharRace, Faction } from "~/components/race";
import { Class, NameColor } from "~/components/class";
import { Spec } from "~/components/specialization";
import { RankIcon } from "~/components/cutoffs";
import { SearchBox } from "./home";

export async function loader({ params, request }: Route.LoaderArgs) {
  let ladderType: number;
  let pageParam = new URL(request.url).searchParams.get("page") || "1";
  let page = parseInt(pageParam);
  let limit = 10;
  let offset = (page - 1) * limit;

  if (params.type === "2v2") {
    ladderType = 2;
  } else if (params.type === "3v3") {
    ladderType = 3;
  } else {
    return redirect("/leaderboards/2v2");
  }
  let ladder = await loadArenaLadder(ladderType, limit, offset);
  let totalPlayers = ladder.length > 0 ? ladder[0].total_count : 0;
  let totalPages = Math.ceil(totalPlayers / limit);
  return { ladder, totalPages, page };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arena Ladder" },
    { name: "description", content: "Arena Ladder" },
  ];
}

function LadderNav(props: { ladder?: string }) {
  return (
    <nav className="flex gap-0.5">
      <NavLink to="/" end className="link go-home">
        Go Home
      </NavLink>
      <NavLink
        to="/leaderboards/2v2"
        end
        className={({ isActive }) => (isActive ? "link active" : "link")}
      >
        2v2
      </NavLink>
      <NavLink
        to="/leaderboards/3v3"
        end
        className={({ isActive }) => (isActive ? "link active" : "link")}
      >
        3v3
      </NavLink>
    </nav>
  );
}

function Pagination(props: {
  page: number;
  totalPages: number;
  type?: string;
}) {
  return (
    <div className="flex gap-0.5">
      {props.page > 1 ? (
        <NavLink
          to={`/leaderboards/${props.type}?page=${props.page - 1}`}
          className="pagination"
        >
          Previous Page
        </NavLink>
      ) : (
        <span className="pagination disabled">Previous Page</span>
      )}
      {props.page < props.totalPages ? (
        <NavLink
          to={`/leaderboards/${props.type}?page=${props.page + 1}`}
          className="pagination"
        >
          Next Page
        </NavLink>
      ) : (
        <span className="pagination disabled">Next Page</span>
      )}
    </div>
  );
}

export default function Leaderboard(props: Route.ComponentProps) {
  let { page, totalPages } = props.loaderData;
  return (
    <div className="flex flex-col items-center max-w-[1000px] mx-auto gap-0.5 pt-5">
      <div className="flex justify-between w-full">
        <LadderNav ladder={props.params.type} />
        <h1 className="ladder-name font-bold">
          {props.params.type} Arena Ladder
        </h1>
        <SearchBox />
      </div>
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
      <div className="flex justify-end w-full">
        <Pagination
          page={page}
          totalPages={totalPages}
          type={props.params.type}
        />
      </div>
    </div>
  );
}
