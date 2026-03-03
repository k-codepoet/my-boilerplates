# React Router SSR + Authentik

SSR boilerplate with Authentik OIDC authentication, role-based access control, and admin user management.

## Features

- Authentik OIDC login (Google OAuth via Authentik)
- Cookie-based sessions (7-day expiry)
- Role system: pending / user / admin / banned
- Admin panel for user role management
- Multi-domain support (reverse proxy aware)

## Tech Stack

- React Router 7 (SSR)
- React 19 + TypeScript 5.9 (strict)
- Tailwind CSS v4 (OKLCH)
- shadcn/ui compatible theme
- Docker multi-stage build

## Quick Start

```bash
# 1. Copy template
cp -r boilerplates/web/react-router-ssr-authentik my-app
cd my-app

# 2. Update package.json name
# "@boilerplates/react-router-ssr-authentik" -> "@apps/my-app"

# 3. Configure environment
cp .env.example .env
# Fill in AUTHENTIK_CLIENT_ID, AUTHENTIK_CLIENT_SECRET, etc.

# 4. Install & run
pnpm install
pnpm dev
```

## Authentik Setup

### 1. Create Application + Provider in Authentik

1. Go to Authentik Admin > Applications > Providers > Create
2. Type: **OAuth2/OpenID Connect**
3. Name: `my-app`
4. Client type: Confidential
5. Redirect URIs: `https://my-app.home.codepoet.site/api/auth/callback/authentik`
6. Scopes: `openid`, `email`, `profile`

Then create an Application pointing to this provider.

### 2. Create Groups

Create these 4 groups in Authentik (customize names in `authentik-admin.server.ts`):

- `sample-ssr-users-pending` - Default group for new sign-ups
- `sample-ssr-users` - Approved users
- `sample-ssr-admins` - Admin users
- `sample-ssr-users-banned` - Banned users

### 3. Environment Variables

| Variable | Description |
|----------|-------------|
| `AUTHENTIK_CLIENT_ID` | OAuth client ID from provider |
| `AUTHENTIK_CLIENT_SECRET` | OAuth client secret from provider |
| `AUTHENTIK_ISSUER` | `https://auth.codepoet.site/application/o/{slug}` |
| `AUTHENTIK_API_TOKEN` | Admin API token (for user management) |
| `SESSION_SECRET` | Cookie signing key (`openssl rand -hex 32`) |

## Customization

### Group Names

Update group names in these files:
- `app/lib/authentik-admin.server.ts` - `ROLE_GROUPS` constant
- `app/root.tsx` - loader group checks
- `app/routes/pending.tsx` - group check
- `app/routes/banned.tsx` - group check
- `app/routes/admin.tsx` - admin group check
- `app/routes/api.admin.approve.ts` - admin group check
- `app/routes/api.admin.change-role.ts` - admin group check
- `app/components/user-menu.tsx` - admin badge check

### Auth Flow

```
/login -> /auth/login -> Authentik OIDC -> /api/auth/callback/authentik -> /
                                                                        -> /pending (if not approved)
                                                                        -> /banned (if banned)
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server (HMR) |
| `pnpm build` | Production build |
| `pnpm start` | Production server |
| `pnpm typecheck` | Type checking |

## Structure

```
app/
├── app.css                      # Tailwind + theme variables
├── entry.server.tsx             # SSR entry
├── root.tsx                     # Root layout + auth guard
├── routes.ts                    # Route definitions
├── types/index.ts               # AuthUser type
├── lib/
│   ├── auth.server.ts           # OIDC flow + session
│   ├── authentik-admin.server.ts # Admin API (role management)
│   └── utils.ts                 # cn() helper
├── components/
│   └── user-menu.tsx            # User avatar dropdown
└── routes/
    ├── home.tsx                 # Protected home page
    ├── login.tsx                # Login page
    ├── pending.tsx              # Pending approval page
    ├── banned.tsx               # Banned page
    ├── admin.tsx                # Admin user management
    ├── auth.login.ts            # Redirect to Authentik
    ├── auth.callback.ts         # OIDC callback handler
    ├── auth.logout.ts           # Destroy session
    ├── api.admin.approve.ts     # Approve user API
    └── api.admin.change-role.ts # Change role API
```

## Docker

```bash
# Local
docker compose up --build

# Or manual
docker build -t my-app .
docker run -p 3000:3000 \
  -e AUTHENTIK_CLIENT_ID=... \
  -e AUTHENTIK_CLIENT_SECRET=... \
  -e SESSION_SECRET=... \
  my-app
```
