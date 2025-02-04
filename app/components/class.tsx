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
  return <img className="class" src={src} alt={alt} />;
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
