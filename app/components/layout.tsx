import logo from "~/assets/other/logo.png";
import { Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="flex flex-col items-center pt-2">
      <div className="rounded-sm backdrop-blur-xs mt-[-10px]">
        <img src={logo} alt="Logo" width="300" height="200" />
      </div>
      <Outlet />
    </div>
  );
}
