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

export function Spec(props: { specId: number }) {
  let src = "";
  let alt = "";
  switch (props.specId) {
    case 49028:
      src = blood;
      alt = "Blood";
      break;
    case 49184:
      src = frostdk;
      alt = "Frost";
      break;
    case 49206:
      src = unholy;
      alt = "Unholy";
      break;
    case 48505:
      src = balance;
      alt = "Balance";
      break;
    case 50334:
      src = feral;
      alt = "Feral";
      break;
    case 65139:
      src = restorationdr;
      alt = "Restoration";
      break;
    case 53270:
      src = beastmastery;
      alt = "Beastmastery";
      break;
    case 53209:
      src = marksmanship;
      alt = "Marsksmanship";
      break;
    case 53301:
      src = survival;
      alt = "Survival";
      break;
    case 44425:
      src = arcane;
      alt = "Arcane";
      break;
    case 44457:
      src = fire;
      alt = "Fire";
      break;
    case 44572:
      src = frostm;
      alt = "Frost";
      break;
    case 53563:
      src = holypal;
      alt = "Holy";
      break;
    case 53595:
      src = protectionpal;
      alt = "Protection";
      break;
    case 53385:
      src = retribution;
      alt = "Retribution";
      break;
    case 47540:
      src = discipline;
      alt = "Discipline";
      break;
    case 47788:
      src = holypriest;
      alt = "Holy";
      break;
    case 47585:
      src = shadow;
      alt = "Shadow";
      break;
    case 1329:
      src = assasination;
      alt = "Assasination";
      break;
    case 51690:
      src = combat;
      alt = "Combat";
      break;
    case 51713:
      src = subtletly;
      alt = "Subtletly";
      break;
    case 51490:
      src = elemental;
      alt = "Elemental";
      break;
    case 51533:
      src = enhancement;
      alt = "Enhancement";
      break;
    case 61295:
      src = restorationsham;
      alt = "Restoration";
      break;
    case 48181:
      src = affliction;
      alt = "Affliction";
      break;
    case 59672:
      src = demonology;
      alt = "Demonology";
      break;
    case 50796:
      src = destruction;
      alt = "Destruction";
      break;
    case 46924:
      src = arms;
      alt = "Arms";
      break;
    case 46917:
      src = fury;
      alt = "Fury";
      break;
    case 46968:
      src = protectionwar;
      alt = "Protection";
      break;
    default:
      src = "";
      alt = "";
  }
  return <img className="w-7 h-7" src={src} alt={alt} />;
}

export function ArmorySpec(props: { specId: number }) {
  let specName = "";

  switch (props.specId) {
    case 49028:
      specName = "Blood";
      break;
    case 49184:
      specName = "Frost";
      break;
    case 49206:
      specName = "Unholy";
      break;
    case 48505:
      specName = "Balance";
      break;
    case 50334:
      specName = "Feral";
      break;
    case 65139:
      specName = "Restoration";
      break;
    case 53270:
      specName = "Beastmastery";
      break;
    case 53209:
      specName = "Marsksmanship";
      break;
    case 53301:
      specName = "Survival";
      break;
    case 44425:
      specName = "Arcane";
      break;
    case 44457:
      specName = "Fire";
      break;
    case 44572:
      specName = "Frost";
      break;
    case 53563:
      specName = "Holy";
      break;
    case 53595:
      specName = "Protection";
      break;
    case 53385:
      specName = "Retribution";
      break;
    case 47540:
      specName = "Discipline";
      break;
    case 47788:
      specName = "Holy";
      break;
    case 47585:
      specName = "Shadow";
      break;
    case 1329:
      specName = "Assasination";
      break;
    case 51690:
      specName = "Combat";
      break;
    case 51713:
      specName = "Subtletly";
      break;
    case 51490:
      specName = "Elemental";
      break;
    case 51533:
      specName = "Enhancement";
      break;
    case 61295:
      specName = "Restoration";
      break;
    case 48181:
      specName = "Affliction";
      break;
    case 59672:
      specName = "Demonology";
      break;
    case 50796:
      specName = "Destruction";
      break;
    case 46924:
      specName = "Arms";
      break;
    case 46917:
      specName = "Fury";
      break;
    case 46968:
      specName = "Protection";
      break;
    default:
      specName = "";
  }
  return <span>{specName}</span>;
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
