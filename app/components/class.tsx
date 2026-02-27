import warrior from "~/assets/class/warrior.webp";
import paladin from "~/assets/class/paladin.webp";
import hunter from "~/assets/class/hunter.webp";
import rogue from "~/assets/class/rogue.webp";
import priest from "~/assets/class/priest.webp";
import dk from "~/assets/class/death-knight.webp";
import shaman from "~/assets/class/shaman.webp";
import mage from "~/assets/class/mage.webp";
import warlock from "~/assets/class/warlock.webp";
import druid from "~/assets/class/druid.webp";
import type { ReactNode } from "react";

export function Class(props: { classId: number }) {
  let src = "";
  let alt = "";
  switch (props.classId) {
    case 1:
      src = warrior;
      alt = "Warrior";
      break;
    case 2:
      src = paladin;
      alt = "Paladin";
      break;
    case 3:
      src = hunter;
      alt = "Hunter";
      break;
    case 4:
      src = rogue;
      alt = "Rogue";
      break;
    case 5:
      src = priest;
      alt = "Priest";
      break;
    case 6:
      src = dk;
      alt = "Death Knight";
      break;
    case 7:
      src = shaman;
      alt = "Shaman";
      break;
    case 8:
      src = mage;
      alt = "Mage";
      break;
    case 9:
      src = warlock;
      alt = "Warlock";
      break;
    case 11:
      src = druid;
      alt = "Druid";
      break;
  }
  return <img className="w-7 h-7" src={src} alt={alt} />;
}

export function NameColor(props: { classId: number; children: ReactNode }) {
  let classColor = "";
  switch (props.classId) {
    case 1:
      classColor = "text-class-warrior";
      break;
    case 2:
      classColor = "text-class-paladin";
      break;
    case 3:
      classColor = "text-class-hunter";
      break;
    case 4:
      classColor = "text-class-rogue";
      break;
    case 5:
      classColor = "text-class-priest";
      break;
    case 6:
      classColor = "text-class-deathknight";
      break;
    case 7:
      classColor = "text-class-shaman";
      break;
    case 8:
      classColor = "text-class-mage";
      break;
    case 9:
      classColor = "text-class-warlock";
      break;
    case 11:
      classColor = "text-class-druid";
      break;
  }
  return <span className={classColor}>{props.children}</span>;
}

export function ArmoryClass(props: { classId: number }) {
  let className = "";

  switch (props.classId) {
    case 1:
      className = "Warrior";
      break;
    case 2:
      className = "Paladin";
      break;
    case 3:
      className = "Hunter";
      break;
    case 4:
      className = "Rogue";
      break;
    case 5:
      className = "Priest";
      break;
    case 6:
      className = "Death Knight";
      break;
    case 7:
      className = "Shaman";
      break;
    case 8:
      className = "Mage";
      break;
    case 10:
      className = "Warlock";
      break;
    case 11:
      className = "Druid";
      break;
  }
  return <span>{className}</span>;
}

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
