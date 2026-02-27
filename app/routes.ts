import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  layout("./components/layout.tsx", [
    index("routes/home.tsx"),
    route("leaderboards/:type?", "routes/leaderboards.tsx"),
    route("login", "routes/login.tsx"),
    route("logout", "routes/logout.tsx"),
    route("registration", "routes/registration.tsx"),
    route("armory/:characterId", "routes/armory.tsx"),
  ]),
] satisfies RouteConfig;
