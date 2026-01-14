import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("files", "routes/files.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
