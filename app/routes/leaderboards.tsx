import type { Route } from "./+types/leaderboards";
import { loadArenaLadder } from "~/server/db";
import { redirect, NavLink } from "react-router";
import { CharRace, Faction } from "~/components/race";
import { Class, NameColor } from "~/components/class";
import { Spec } from "~/components/specialization";
import { RankIcon } from "~/components/cutoffs";
import { SearchBox } from "./home";
import type { ReactNode } from "react";

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
          className="bg-[var(--color-content)] text-[var(--color-rating)] rounded px-2 py-1 text-sm hover:bg-[var(--color-content-hover)]"
        >
          Previous Page
        </NavLink>
      ) : (
        <span className="bg-[var(--color-content)] text-pagination-disabled rounded px-2 py-1 text-sm cursor-not-allowed">
          Previous Page
        </span>
      )}
      {props.page < props.totalPages ? (
        <NavLink
          to={`/leaderboards/${props.type}?page=${props.page + 1}`}
          className="bg-[var(--color-content)] text-[var(--color-rating)] rounded px-2 py-1 text-sm hover:bg-[var(--color-content-hover)]"
        >
          Next Page
        </NavLink>
      ) : (
        <span className="bg-[var(--color-content)] text-pagination-disabled rounded px-2 py-1 text-sm cursor-not-allowed">
          Next Page
        </span>
      )}
    </div>
  );
}

function HeaderCell(props: { children: ReactNode }) {
  return (
    <th className="text-white/75 bg-black/20 not-first:border-l border-white/25 p-1.5 border-b">
      {props.children}
    </th>
  );
}

function TableCell(props: { children: ReactNode }) {
  return <td className="p-1.5 border-b border-white/25">{props.children}</td>;
}

export default function Leaderboard(props: Route.ComponentProps) {
  let { page, totalPages } = props.loaderData;
  return (
    <div className="flex flex-col items-center max-w-[1300px] mx-auto gap-0.5 pt-5">
      <div className="flex justify-center w-auto p-2 rounded-md bg-content-dark-50 text-article-name">
        <h1 className="font-bold p-2">{props.params.type} Arena Ladder</h1>
      </div>
      <div className="bg-content-dark-50 rounded-[12px] overflow-hidden">
        <table className="table-fixed w-full">
          <thead>
            <tr>
              <HeaderCell>Rank</HeaderCell>
              <HeaderCell>Race</HeaderCell>
              <HeaderCell>
                <div className="pl-4 text-left">Player</div>
              </HeaderCell>
              <HeaderCell>Faction</HeaderCell>
              <HeaderCell>Rating</HeaderCell>
              <HeaderCell>Wins</HeaderCell>
              <HeaderCell>Losses</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {props.loaderData.ladder.map((player, index) => (
              <tr key={index}>
                <TableCell>
                  <div className="text-center font-medium text-rating">
                    {player.rank}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <CharRace raceId={player.race} gender={player.gender} />
                    <Class classId={player.class} />
                    <Spec specId={player.spell} />
                  </div>
                </TableCell>
                <TableCell>
                  <NameColor classId={player.class}>
                    <div className="pl-4">{player.name}</div>
                  </NameColor>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <Faction raceId={player.race} />
                  </div>
                </TableCell>
                <TableCell>
                  <RankIcon title={player.title}>
                    <div className="text-rating font-medium">
                      {player.rating}
                    </div>
                  </RankIcon>
                </TableCell>
                <TableCell>
                  <div className="text-wins text-center">
                    {player.seasonWins}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-losses text-center">
                    {player.seasonGames - player.seasonWins}
                  </div>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end w-full pt-2 pb-2">
          <Pagination
            page={page}
            totalPages={totalPages}
            type={props.params.type}
          />
        </div>
      </div>
    </div>
  );
}
