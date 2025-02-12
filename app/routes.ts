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
  ]),
] satisfies RouteConfig;
