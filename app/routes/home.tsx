import type { Route } from "./+types/home";
import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { Example } from "~/components/dialog";
import searchIcon from "~/assets/other/search-icon-2044x2048-psdrpqwp.png";
import pvpBackground1 from "~/assets/other/background-pvp-news1.jpg";
import hotfixesimg from "~/assets/other/gnome.jpg";
import arenaRoV from "~/assets/other/RoV.webp";
import discord from "~/assets/other/discord.256x256.png";
import youtube from "~/assets/other/youtube-icon.png";
import reddit from "~/assets/other/reddit.256x256.png";
import ssoftheday from "~/assets/other/small.jpg";
import featuredVideo from "~/assets/other/featured-video-thumb2.png";
import pvpBackground2 from "~/assets/other/FSM0GMYGOCJP1309944125247.avif";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arena Ladder" },
    { name: "description", content: "Arena Ladder" },
  ];
}

export function Ladder() {
  return (
    <div className="flex gap-0.5">
      <div className="link">
        <Example />
      </div>
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

function SideArticle(props: { name: string }) {
  return (
    <div>
      <h3 className="side-article-desc">{props.name}</h3>
      <div className="side-box-line" />
    </div>
  );
}

function ScreenshotOfTheDay(props: { image: string; author: string }) {
  return (
    <div className="screenshot-of-the-day">
      <img src={props.image} alt={props.author} />
    </div>
  );
}

export default function Home(props: Route.ComponentProps) {
  return (
    <div className="flex flex-col items-center max-w-[1000px] mx-auto gap-0.5 pt-5">
      <div className="flex justify-between w-full">
        <Ladder />
        <SearchBox />
      </div>
      <div className="content-background w-[1000px] flex">
        <div className="news-updates w-[650px] pb-1.5 overflow-hidden">
          <Article
            name="Blade's Edge Arena & Dalaran Arena changes"
            image={pvpBackground2}
            text="We are working to bring you updated versions of Blade's Edge Arena and Dalaran Arena. These changes consists of: Dalaran Arena - two additional staircases were added, behind each pile of crates, ensuring that players can reach the raised central square area from each of its four corners, Blade's Edge -  the platforms and rope at the middle of the ramps were replaced by ramps, similar to the ones already present in previous versions at each side of the bridge."
          />
          <Article
            name="PvP Gear Changes"
            image={pvpBackground1}
            text="Attention Azeroth's adventurers! With weekly reset players will be able to buy new PvP gear for Honor points and Arena Points! Non-PvP items with item level higher than 200 won't be usable in Arenas anymore."
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
        <div className="side-window flex-col">
          <div className="top-bar overflow-hidden"></div>
          <div className="side-content">
            <div className="side-articles-container">
              <SideArticle name="Screenshot of the day" />
              <ScreenshotOfTheDay image={ssoftheday} author="Provim" />
              <SideArticle name="Stay connected" />
              <div className="flex justify-center gap-2">
                <img
                  className="stay-connected-icons"
                  src={discord}
                  alt="Discord"
                />
                <img
                  className="stay-connected-icons"
                  src={youtube}
                  alt="Youtube"
                />
                <img
                  className="stay-connected-icons"
                  src={reddit}
                  alt="Reddit"
                />
              </div>
              <SideArticle name="Featured videos" />
              <div className="featured-video">
                <a
                  href="https://www.youtube.com/watch?v=vNHzuaqysKI"
                  target="_blank"
                >
                  <img src={featuredVideo} alt="Featured video" width="330px" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
