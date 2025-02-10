import type { Route } from "./+types/home";
import { NavLink } from "react-router";
import searchIcon from "~/assets/other/search-icon-2044x2048-psdrpqwp.png";
import pvpBackground1 from "~/assets/other/background-pvp-news1.jpg";
import hotfixesimg from "~/assets/other/gnome.jpg";
import arenaRoV from "~/assets/other/RoV.webp";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arena Ladder" },
    { name: "description", content: "Arena Ladder" },
  ];
}

export function Ladder() {
  return (
    <div className="flex gap-0.5">
      <div className="link go-home ladder-div">Ladders</div>
      <NavLink className="link" to="/leaderboards/2v2" end>
        2v2
      </NavLink>
      <NavLink className="link" to="/leaderboards/3v3" end>
        3v3
      </NavLink>
    </div>
  );
}

export function SearchBox() {
  return (
    <div className="flex search-input relative">
      <input
        className="w-full pl-3 pr-7"
        placeholder="Search characters, items, and more…"
      />
      <img
        className="w-4 h-4 absolute right-1 top-1/2 -translate-y-1/2"
        src={searchIcon}
        alt="Search Icon"
      />
    </div>
  );
}

function Article(props: { name: string; image: string; text: string }) {
  return (
    <div className="news-article-background">
      <h3 className="news-header">{props.name}</h3>
      <div className="news-article flex gap-3">
        <div className="new-article-img w-[200px] h-[120px] shrink-0 flex">
          <img src={props.image} alt="Article image" />
        </div>
        <div className="max-h-[120px] overflow-hidden">
          <p>{props.text}</p>
        </div>
      </div>
    </div>
  );
}

export default function Home(props: Route.ComponentProps) {
  return (
    <div className="flex flex-col items-center pt-2">
      <h1 className="p-4 font-bold text-xl text-rating bg-content-90 rounded-sm backdrop-blur-xs">
        World of Warcraft
      </h1>
      <div className="flex flex-col items-center max-w-[1100px] mx-auto gap-0.5 pt-4">
        <div className="flex justify-between w-full">
          <Ladder />
          <SearchBox />
        </div>
        <div className="content-background w-[1100px] p-2 flex gap-5">
          <div className="news-updates w-[600px] pb-1.5">
            <Article
              name="PvP Gear Changes"
              image={pvpBackground1}
              text="Attention Azeroth's adventurers! With weekly players will be able to buy new PvP gear for Honor points and Arena Points! Non-PvP items with item level higher than 200 won't be usable anymore."
            />
            <Article
              name="Patch 3.3.6 Notes"
              image={hotfixesimg}
              text="Arena teams are removed. Players can join group and queue for arena bracket based on their group-size. There are several class changes undergoing which we will show later. Please keep in mind that these changes might not be final. "
            />
            <Article
              name="Welcome to Arena-Pass"
              image={arenaRoV}
              text="Arena-Pass is a World of Warcraft: Wrath of the Lich King arena server running on Patch 3.3.6 with custom Gear and Class changes to shift 3.3.5a arena meta."
            />
          </div>
          <div></div>
        </div>
      </div>
    </div>
  );
}
