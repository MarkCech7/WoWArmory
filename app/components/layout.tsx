import logo from "~/assets/other/logo.png";
import { Outlet, NavLink } from "react-router";
import { getUserById } from "~/server/db";
import { getSession } from "~/server/sessions";
import type { Route } from "./+types/layout";
import searchIcon from "~/assets/other/search-icon-2044x2048-psdrpqwp.png";
import logoIcon from "~/assets/other/256x256.png";
import { CustomNavLink } from "./custom-navlink";
import discord from "~/assets/other/discord.256x256.png";
import youtube from "~/assets/other/youtube-icon.png";
import reddit from "~/assets/other/reddit.256x256.png";
import { FollowUsIcon } from "./follow-us-icon";

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
    <div className="flex gap-1">
      <CustomNavLink to="/">Home</CustomNavLink>
      <CustomNavLink to="/registration" end>
        Create Account
      </CustomNavLink>
      {props.userId ? (
        <CustomNavLink to="/logout">Log out</CustomNavLink>
      ) : (
        <CustomNavLink to="/login">Log in</CustomNavLink>
      )}
      <CustomNavLink to="/leaderboards/2v2" end>
        Arena 2v2
      </CustomNavLink>
      <CustomNavLink to="/leaderboards/3v3" end>
        Arena 3v3
      </CustomNavLink>
      <SearchBox />
    </div>
  );
}

export function SearchBox() {
  return (
    <div className="flex relative w-[300px] rounded-[8px] bg-white/5 text-article-name text-[14px]">
      <input
        className="w-full pl-3 pr-7"
        placeholder="Search characters, items, and more…"
      />
      <img
        className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2"
        src={searchIcon}
        alt="Search Icon"
      />
    </div>
  );
}

export default function Layout(props: Route.ComponentProps) {
  const { user } = props.loaderData;
  return (
    <>
      <header className="flex flex-col items-center justify-center pt-2 sticky top-2 bg-[#19110b] pb-5 max-w-[1350px] h-[72px] mx-auto rounded-[12px] z-20">
        <ul>
          <div className="flex justify-between w-full">
            <Ladder userId={user?.id} />
          </div>
          <li>
            <div className="rounded-sm backdrop-blur-xs mt-[-10px]"></div>
          </li>
        </ul>
      </header>
      <Outlet />
      <footer className="w-[1300px] bg-content-dark-50 mx-auto">
        <div className="flex p-5 justify-center items-center gap-2 mb-2 bg-[#3d2f2f6b] border border-t-[#9090904c] border-b-[#9090904c] border-l-0 border-r-0">
          <p className="uppercase text-white font-bold">Follow us</p>
          <FollowUsIcon
            url="https://discord.com/"
            src={discord}
            alt="Discord"
          />
          <FollowUsIcon
            url="https://youtube.com/"
            src={youtube}
            alt="Youtube"
          />
          <FollowUsIcon url="https://reddit.com/" src={reddit} alt="Reddit" />
        </div>
        <div className="p-4 flex text-[#9f9f9f] text-[14px]">
          <div className="flex-col justify-center mx-auto">
            <ul className="flex gap-3">
              <li>
                <div>About</div>
              </li>
              <li>
                <div>Contact us</div>
              </li>
              <li>
                <div>Support</div>
              </li>
            </ul>
            <div className="flex justify-center text-[13px]">
              ©2025 Arena-Pass
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
