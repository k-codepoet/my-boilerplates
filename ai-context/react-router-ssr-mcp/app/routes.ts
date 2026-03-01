import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  layout("components/layout/app-layout.tsx", [
    index("routes/home.tsx"),
    route("items", "routes/items.tsx"),
    route("items/:id", "routes/items.$id.tsx"),
    route("transactions", "routes/transactions.tsx"),
    route("import", "routes/import.tsx"),
    route("chat", "routes/chat.tsx"),
    route("chat/:id", "routes/chat.$id.tsx"),
  ]),
] satisfies RouteConfig;
