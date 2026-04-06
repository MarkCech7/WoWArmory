import blood from "~/assets/spec/death-knight-blood.webp";
import frostdk from "~/assets/spec/death-knight-frost.webp";
import unholy from "~/assets/spec/death-knight-unholy.webp";
import balance from "~/assets/spec/druid-balance.webp";
import feral from "~/assets/spec/druid-feral-combat.webp";
import restorationdr from "~/assets/spec/druid-restoration.webp";
import beastmastery from "~/assets/spec/hunter-beast-mastery.webp";
import marksmanship from "~/assets/spec/hunter-marksmanship.webp";
import survival from "~/assets/spec/hunter-survival.webp";
import arcane from "~/assets/spec/mage-arcane.webp";
import fire from "~/assets/spec/mage-fire.webp";
import frostm from "~/assets/spec/mage-frost.webp";
import holypal from "~/assets/spec/paladin-holy.webp";
import protectionpal from "~/assets/spec/paladin-protection.webp";
import retribution from "~/assets/spec/paladin-retribution.webp";
import discipline from "~/assets/spec/priest-discipline.webp";
import holypriest from "~/assets/spec/priest-holy.webp";
import shadow from "~/assets/spec/priest-shadow.webp";
import assasination from "~/assets/spec/rogue-assassination.webp";
import combat from "~/assets/spec/rogue-combat.webp";
import subtletly from "~/assets/spec/rogue-subtlety.webp";
import elemental from "~/assets/spec/shaman-elemental.webp";
import enhancement from "~/assets/spec/shaman-enhancement.webp";
import restorationsham from "~/assets/spec/shaman-restoration.webp";
import affliction from "~/assets/spec/warlock-affliction.webp";
import demonology from "~/assets/spec/warlock-demonology.webp";
import destruction from "~/assets/spec/warlock-destruction.webp";
import arms from "~/assets/spec/warrior-arms.webp";
import fury from "~/assets/spec/warrior-fury.webp";
import protectionwar from "~/assets/spec/warrior-protection.webp";
import defaulticon from "~/assets/icons/INV_Misc_QuestionMark.png";

export function Spec(props: { specId: number }) {
  let src = "";
  let alt = "";
  switch (props.specId) {
    case 398:
      src = blood;
      alt = "Blood";
      break;
    case 399:
      src = frostdk;
      alt = "Frost";
      break;
    case 400:
      src = unholy;
      alt = "Unholy";
      break;
    case 283:
      src = balance;
      alt = "Balance";
      break;
    case 281:
      src = feral;
      alt = "Feral";
      break;
    case 282:
      src = restorationdr;
      alt = "Restoration";
      break;
    case 361:
      src = beastmastery;
      alt = "Beastmastery";
      break;
    case 363:
      src = marksmanship;
      alt = "Marsksmanship";
      break;
    case 362:
      src = survival;
      alt = "Survival";
      break;
    case 81:
      src = arcane;
      alt = "Arcane";
      break;
    case 41:
      src = fire;
      alt = "Fire";
      break;
    case 61:
      src = frostm;
      alt = "Frost";
      break;
    case 382:
      src = holypal;
      alt = "Holy";
      break;
    case 383:
      src = protectionpal;
      alt = "Protection";
      break;
    case 381:
      src = retribution;
      alt = "Retribution";
      break;
    case 201:
      src = discipline;
      alt = "Discipline";
      break;
    case 202:
      src = holypriest;
      alt = "Holy";
      break;
    case 203:
      src = shadow;
      alt = "Shadow";
      break;
    case 182:
      src = assasination;
      alt = "Assasination";
      break;
    case 181:
      src = combat;
      alt = "Combat";
      break;
    case 183:
      src = subtletly;
      alt = "Subtletly";
      break;
    case 261:
      src = elemental;
      alt = "Elemental";
      break;
    case 263:
      src = enhancement;
      alt = "Enhancement";
      break;
    case 262:
      src = restorationsham;
      alt = "Restoration";
      break;
    case 302:
      src = affliction;
      alt = "Affliction";
      break;
    case 303:
      src = demonology;
      alt = "Demonology";
      break;
    case 301:
      src = destruction;
      alt = "Destruction";
      break;
    case 161:
      src = arms;
      alt = "Arms";
      break;
    case 164:
      src = fury;
      alt = "Fury";
      break;
    case 163:
      src = protectionwar;
      alt = "Protection";
      break;
    default:
      src = defaulticon;
      alt = "Unknown Spec";
  }
  return <img className="w-7 h-7" src={src} alt={alt} />;
}
