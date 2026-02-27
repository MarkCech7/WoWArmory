import type { ReactNode } from "react";
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
import alliance from "~/assets/faction/alliance.svg";
import horde from "~/assets/faction/horde.svg";

export function CharRace(props: { raceId: number; gender: number }) {
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
  return <img className="w-7 h-7" src={src} alt={alt} />;
}

export function Faction(props: { raceId: number }) {
  let src = "";
  let alt = "";
  if (
    props.raceId === 1 ||
    props.raceId === 3 ||
    props.raceId === 4 ||
    props.raceId === 7 ||
    props.raceId === 11
  ) {
    src = alliance;
    alt = "Alliance";
  } else {
    src = horde;
    alt = "Horde";
  }
  return <img className="w-7 h-7" src={src} alt={alt} />;
}

export function ArmoryRace(props: { raceId: number }) {
  let raceName = "";

  switch (props.raceId) {
    case 1:
      raceName = "Human";
      break;
    case 2:
      raceName = "Orc";
      break;
    case 3:
      raceName = "Dwarf";
      break;
    case 4:
      raceName = "Night Elf";
      break;
    case 5:
      raceName = "Undead";
      break;
    case 6:
      raceName = "Tauren";
      break;
    case 7:
      raceName = "Gnome";
      break;
    case 8:
      raceName = "Troll";
      break;
    case 10:
      raceName = "Blood Elf";
      break;
    case 11:
      raceName = "Draenei";
      break;
  }
  return <span>{raceName}</span>;
}

/* faction
0 - alliance
1 - horde */

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
