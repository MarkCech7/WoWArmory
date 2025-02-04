import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("leaderboards/:type?", "routes/leaderboards.tsx"),
] satisfies RouteConfig;
