import type { ReactNode } from "react";
import seasonglad from "~/assets/ranks/seasonglad.png";
import gladiator from "~/assets/ranks/glad.png";
import duelist from "~/assets/ranks/duelist.png";
import rival from "~/assets/ranks/rival.png";
import challenger from "~/assets/ranks/challenger.png";
import unrated from "~/assets/ranks/combatant.png";

export function RankColor(props: { title: string; children: ReactNode }) {
  let rankColor = "";
  switch (props.title) {
    case "Rank 1":
      rankColor = "text-season-glad";
      break;
    case "Gladiator":
      rankColor = "text-gladiator";
      break;
    case "Duelist":
      rankColor = "text-duelist";
      break;
    case "Rival":
      rankColor = "text-rival";
      break;
    case "Challenger":
      rankColor = "text-challenger";
      break;
    case "No Title":
      rankColor = "text-unrated";
  }
  return (
    <td className={`${rankColor} relative font-semibold`}>
      <span className="absolute top-1/2 left-1/2 -translate-1/2">
        {props.children}
      </span>
    </td>
  );
}

export function RankIcon(props: { title: string; children: ReactNode }) {
  let src = "";
  let alt = "";
  switch (props.title) {
    case "Rank 1":
      src = seasonglad;
      alt = "Season Gladiator";
      break;
    case "Gladiator":
      src = gladiator;
      alt = "Gladiator";
      break;
    case "Duelist":
      src = duelist;
      alt = "Duelist";
      break;
    case "Rival":
      src = rival;
      alt = "Rival";
      break;
    case "Challenger":
      src = challenger;
      alt = "Challenger";
      break;
    case "No Title":
      src = unrated;
      alt = "Unrated";
  }
  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-1.5">
        <img className="w-7 h-7" src={src} alt={alt} />
        <div className="rating w-9 shrink-0">{props.children}</div>
      </div>
    </div>
  );
}
