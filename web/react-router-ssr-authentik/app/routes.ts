import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("pending", "routes/pending.tsx"),
  route("banned", "routes/banned.tsx"),
  route("admin", "routes/admin.tsx"),
  route("api/admin/approve", "routes/api.admin.approve.ts"),
  route("api/admin/change-role", "routes/api.admin.change-role.ts"),
  route("auth/login", "routes/auth.login.ts"),
  route("api/auth/callback/authentik", "routes/auth.callback.ts"),
  route("auth/logout", "routes/auth.logout.ts"),
] satisfies RouteConfig;
