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

export function Class(props: { class: string }) {
  let src = "";
  let alt = "";
  switch (props.class) {
    case "Warrior":
      src = warrior;
      alt = "Warrior";
      break;
    case "Paladin":
      src = paladin;
      alt = "Paladin";
      break;
    case "Hunter":
      src = hunter;
      alt = "Hunter";
      break;
    case "Rogue":
      src = rogue;
      alt = "Rogue";
      break;
    case "Priest":
      src = priest;
      alt = "Priest";
      break;
    case "DeathKnight":
      src = dk;
      alt = "Death Knight";
      break;
    case "Shaman":
      src = shaman;
      alt = "Shaman";
      break;
    case "Mage":
      src = mage;
      alt = "Mage";
      break;
    case "Warlock":
      src = warlock;
      alt = "Warlock";
      break;
    case "Druid":
      src = druid;
      alt = "Druid";
      break;
  }
  return <img className="w-7 h-7" src={src} alt={alt} />;
}

export function NameColor(props: { class: string; children: ReactNode }) {
  let classColor = "";
  switch (props.class) {
    case "Warrior":
      classColor = "text-class-warrior";
      break;
    case "Paladin":
      classColor = "text-class-paladin";
      break;
    case "Hunter":
      classColor = "text-class-hunter";
      break;
    case "Rogue":
      classColor = "text-class-rogue";
      break;
    case "Priest":
      classColor = "text-class-priest";
      break;
    case "DeathKnight":
      classColor = "text-class-deathknight";
      break;
    case "Shaman":
      classColor = "text-class-shaman";
      break;
    case "Mage":
      classColor = "text-class-mage";
      break;
    case "Warlock":
      classColor = "text-class-warlock";
      break;
    case "Druid":
      classColor = "text-class-druid";
      break;
  }
  return <span className={classColor}>{props.children}</span>;
}
