import type { Route } from "./+types/home";
import { NavLink, redirect } from "react-router";
import searchIcon from "~/assets/other/search-icon-2044x2048-psdrpqwp.png";
import pvpBackground1 from "~/assets/other/background-pvp-news1.jpg";
import hotfixesimg from "~/assets/other/gnome.jpg";
import arenaRoV from "~/assets/other/RoV.webp";
import ssoftheday from "~/assets/other/WoWScrnShot_040723_193841.jpg";
import featuredVideo from "~/assets/other/featured-video-thumb2.png";
import pvpBackground2 from "~/assets/other/Arena-world-of-warcraft-screen.webp";
import { getSession } from "~/server/sessions";
import { getUserById } from "~/server/db";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Arena Ladder" },
    { name: "description", content: "Arena Ladder" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (!userId) {
    return { user: null };
  }
  let user = await getUserById(parseInt(userId));
  return { user };
}

export function Ladder(props: { userId?: number }) {
  return (
    <div className="flex gap-0.5">
      {props.userId ? (
        <NavLink className="link" to="/logout">
          Log out
        </NavLink>
      ) : (
        <NavLink className="link" to="/login">
          Log in
        </NavLink>
      )}
      <div className="link go-home text-center">Ladders</div>
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

function Article(props: {
  name: string;
  image: string;
  text: string;
  isLast?: string;
}) {
  return (
    <div className="pl-10 pr-10">
      <div className="group text-[12px] flex overflow-hidden hover:bg-content-hover">
        <div
          className={`w-full border-t border-t-article-border flex pt-9 pb-9 ${
            props.isLast ? "border-b border-b-article-border" : ""
          }`}
        >
          <div className="max-w-[1300px] h-[120px] flex gap-5">
            <div className="border border-[#541f09] w-[200px] shrink-0 flex group-hover:border-yellow-100">
              <img src={props.image} alt="Article image" />
            </div>
            <div className="flex flex-col justify-start max-w-[700px]">
              <h3 className="text-article-name text-lg font-bold flex pb-1 group-hover:text-yellow-200">
                {props.name}
              </h3>
              <div className="max-h-[120px] overflow-hidden break-words">
                <p>{props.text}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewestArticle(props: { name: string; image: string; text: string }) {
  return (
    <div className="group relative w-[850px] h-[450px] shrink-0 border border-[#541f09] hover:border-amber-300 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover"
        style={{ backgroundImage: `url(${props.image})` }}
      />
      <div
        className="absolute bottom-0 w-full h-1/3 bg-cover backdrop-blur-md"
        style={{
          backgroundImage: `url(${props.image})`,
          maskImage: "linear-gradient(to top, black, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black, transparent)",
        }}
      />
      <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent opacity-100" />
      <div className="absolute bottom-0 w-full">
        <div className="flex flex-col p-5">
          <p className="text-gray-50 text-[12px]">{props.text}</p>
          <h3 className="text-article-name font-bold group-hover:text-amber-300">
            {props.name}
          </h3>
        </div>
      </div>
    </div>
  );
}

function ScreenshotOfTheDay(props: { image: string }) {
  return (
    <div className="group relative h-[215px] bg-cover overflow-hidden border border-[#541f09] hover:border-amber-300">
      <div
        className="absolute inset-0 bg-cover"
        style={{ backgroundImage: `url(${props.image})` }}
      >
        <div
          className="absolute inset-0 bg-cover backdrop-blur-md"
          style={{
            backgroundImage: `url(${props.image})`,
            maskImage: "linear-gradient(to top, black, transparent)",
            WebkitMaskImage: "linear-gradient(to top, black, transparent)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-100" />
          <div className="absolute bottom-0 w-full p-2">
            <p className="text-article-name text-[13px] uppercase group-hover:text-amber-300">
              Screenshot of the day
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedVideo(props: { image: string }) {
  return (
    <div className="h-[215px] overflow-hidden">
      <div className="group relative h-[215px] bg-cover overflow-hidden border border-[#541f09] hover:border-amber-300">
        <a href="https://www.youtube.com/watch?v=vNHzuaqysKI" target="_blank">
          <div
            className="absolute inset-0 bg-cover"
            style={{ backgroundImage: `url(${props.image})` }}
          >
            <div
              className="absolute inset-0 bg-cover backdrop-blur-md"
              style={{
                backgroundImage: `url(${props.image})`,
                maskImage: "linear-gradient(to top, black, transparent)",
                WebkitMaskImage: "linear-gradient(to top, black, transparent)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-100" />
              <div className="absolute bottom-0 w-full p-2">
                <p className="text-article-name text-[13px] uppercase group-hover:text-amber-300">
                  Featured videos
                </p>
              </div>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}

export default function Home(props: Route.ComponentProps) {
  const { user } = props.loaderData;
  return (
    <div className="max-w-[1300px] mx-auto gap-0.5 pt-5">
      {user ? <p>Welcome {user.username} </p> : null}
      <div className="flex gap-5 mt-2 mb-5 w-[1300px]">
        <NewestArticle
          name="Blade's Edge Arena & Dalaran Arena changes"
          image={pvpBackground2}
          text="Learn about Blade's Edge Arena & Dalaran Arena changes." //We are working to bring you updated versions of Blade's Edge Arena and Dalaran Arena. These changes consists of: Dalaran Arena - two additional staircases were added, behind each pile of crates, ensuring that players can reach the raised central square area from each of its four corners, Blade's Edge -  the platforms and rope at the middle of the ramps were replaced by ramps, similar to the ones already present in previous versions at each side of the bridge."
        />

        <div className="flex flex-col w-[450px] max-h-[450px] gap-5">
          <ScreenshotOfTheDay image={ssoftheday} />
          <FeaturedVideo image={featuredVideo} />
        </div>
      </div>
      <div className="flex justify-between w-full"></div>
      <div className="text-white bg-content-dark-50 w-[1300px] flex rounded-2xl overflow-hidden">
        <div className="w-[1300px] overflow-hidden pt-10 pb-14">
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
          <Article
            name="Welcome to Arena-Pass"
            image={arenaRoV}
            text="Arena-Pass is a World of Warcraft: Wrath of the Lich King arena server running on Patch 3.3.6 with custom Gear and Class changes to shift 3.3.5a arena meta."
          />
          <Article
            name="Welcome to Arena-Pass"
            image={arenaRoV}
            text="Arena-Pass is a World of Warcraft: Wrath of the Lich King arena server running on Patch 3.3.6 with custom Gear and Class changes to shift 3.3.5a arena meta."
            isLast="True"
          />
        </div>
      </div>
    </div>
  );
}
