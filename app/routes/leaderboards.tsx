import { loadArenaLadder } from "~/db";
import type { Route } from "./+types/home";
import { redirect, NavLink } from "react-router";
import humanMale from "~/assets/race/human-male.webp";
import humanFemale from "~/assets/race/human-female.webp";
import orcMale from "~/assets/race/orc-male.webp";
import orcFemale from "~/assets/race/orc-female.webp";
import dwarfMale from "~/assets/race/dwarf-male.webp";
import dwarfFemale from "~/assets/race/dwarf-female.webp";
import nelfMale from "~/assets/race/night-elf-male.webp";
import nelfFemale from "~/assets/race/night-elf-female.webp";
import undeadMale from "~/assets/race/night-elf-male.webp";
import undeadFemale from "~/assets/race/undead-female.webp";
import taurenMale from "~/assets/race/tauren-male.webp";
import taurenFemale from "~/assets/race/tauren-female.webp";
import gnomeMale from "~/assets/race/gnome-male.webp";
import gnomeFemale from "~/assets/race/gnome-female.webp";
import trollMale from "~/assets/race/troll-male.webp";
import trollFemale from "~/assets/race/troll-female.webp";
import belfMale from "~/assets/race/blood-elf-male.webp";
import belfFemale from "~/assets/race/blood-elf-female.webp";
import draeneiMale from "~/assets/race/draenei-male.webp";
import draeneiFemale from "~/assets/race/draenei-female.webp";
import paladin from "~/assets/class/paladin.webp";
import retribution from "~/assets/spec/paladin-retribution.webp";

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

export function LadderNav() {
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

function CharRace(props: { raceId: number; gender: number }) {
  let src = "";
  let alt = "";
  switch (`${props.raceId}-${props.gender}`) {
    case `1-0`:
      src = humanMale;
      alt = "Human Male";
      break;
    case `1-1`:
      src = humanFemale;
      alt = "Human Female";
      break;
    case `2-0`:
      src = orcMale;
      alt = "Orc Male";
      break;
    case `2-1`:
      src = orcFemale;
      alt = "Orc Female";
      break;
    case `3-0`:
      src = dwarfMale;
      alt = "Dwarf Male";
      break;
    case `3-1`:
      src = dwarfFemale;
      alt = "Dwarf Female";
      break;
    case `4-0`:
      src = nelfMale;
      alt = "Night Elf Male";
      break;
    case `4-1`:
      src = nelfFemale;
      alt = "Night Elf Female";
      break;
    case `5-0`:
      src = undeadMale;
      alt = "Undead Male";
      break;
    case `5-1`:
      src = undeadFemale;
      alt = "Undead Female";
      break;
    case `6-0`:
      src = taurenMale;
      alt = "Tauren Male";
      break;
    case `6-1`:
      src = taurenFemale;
      alt = "Tauren Female";
      break;
    case `7-0`:
      src = gnomeMale;
      alt = "Gnome Male";
      break;
    case `7-1`:
      src = gnomeFemale;
      alt = "Gnome Female";
    case `8-0`:
      src = trollMale;
      alt = "Troll Male";
      break;
    case `8-1`:
      src = trollFemale;
      alt = "Troll Female";
      break;
    case `10-0`:
      src = belfMale;
      alt = "Blood Elf Male";
      break;
    case `10-1`:
      src = belfFemale;
      alt = "Blood Elf Female";
      break;
    case `11-0`:
      src = draeneiMale;
      alt = "Draenei Male";
      break;
    case `11-1`:
      src = draeneiFemale;
      alt = "Draenei Female";
      break;
  }

  return <img className="race" src={src} alt={alt} />;
}

function Class(props: { classId: number }) {
  let src = "";
  let alt = "";
  switch (props.classId) {
    case 2:
      src = paladin;
      alt = "Paladin";
      break;
  }
  return <img className="class" src={src} alt={alt} />;
}

function Spec(props: { specId: number }) {
  let src = "";
  let alt = "";
  switch (props.specId) {
    case 53385:
      src = retribution;
      alt = "Retribution";
      break;
  }
  return <img className="spec" src={src} alt={alt} />;
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

/*
  Specialization selection - based on last ability in talent tree
  Class/Spec  - SpellId

  DK
  Blood       - 49028
  Frost       - 49184
  Unholy      - 49206
  
  Druid
  Balance     - 48505
  Feral       - 50334
  Restoration - 65139

  Hunter
  BM          - 53270
  MM          - 53209
  Survival    - 53301

  Mage
  Arcane      - 44425
  Fire        - 44457
  Frost       - 44572

  Paladin
  Holy        - 53563
  Protection  - 53595
  Retribution - 53385

  Priest
  Disco       - 47540
  Holy        - 47788
  Shadow      - 47585

  Rogue
  Assa        - 1329
  Combat      - 51690
  Subtletly   - 51713

  Shaman      
  Elemental   - 51490
  Enhancement - 51533
  Restoration - 61295

  Warlock
  Affliction  - 48181
  Demonology  - 59672
  Destro      - 50796

  Warrior
  Arms        - 46924
  Fury        - 46917
  Protection  - 46968
*/

/* gender 
0 - male 
1 - female
*/

/*Races                     
1  - Human
2  - Orc
3  - Dwarf
4  - Night elf
5  - Undead
6  - Tauren
7  - Gnome
8  - Troll
10 - Blood elf
11 - Draenei
 */

/*classes
1 - Warrior
2 - Paladin
3 - Hunter
4 - Rogue
5 - Priest
6 - DK
7 - Shaman
8 - Mage
9 - Warlock
11 - Druid
*/
