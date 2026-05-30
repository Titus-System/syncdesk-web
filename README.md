# SyncDesk Web

Frontend web application for the SyncDesk platform, built with React, Vite, Tailwind CSS, React Query, Zustand and Axios.

SyncDesk Web is the administrative and operational interface for the platform. It includes authentication, dashboard views, user management, ticket management, ticket creation/editing, live chat, account settings, and visual/audio notifications for chat messages and ticket updates.

## Tech Stack

| Technology | Usage |
| --- | --- |
| React 19 | UI layer and component model |
| Vite | Development server and production build |
| React Router DOM | Client-side routing and route guards |
| TanStack React Query | Async requests, cache, polling and mutation state |
| Zustand | Global state for authentication and notifications |
| Axios | HTTP client for the SyncDesk API |
| Tailwind CSS | Utility-first styling |
| Lucide React | Icon set used across the interface |
| Native WebSocket | Live chat connection for the currently opened conversation |
| JavaScript/JSX | Application source language |

## Project Structure

```text
src/
|-- app/
|   |-- layouts/
|   |-- providers.jsx
|   `-- router.jsx
|-- assets/
|-- features/
|   |-- auth/
|   |-- chat/
|   |-- dashboard/
|   |-- settings/
|   |-- ticket/
|   `-- users/
|-- lib/
|-- shared/
|   |-- components/
|   |-- hooks/
|   `-- utils/
|-- stores/
|-- App.jsx
|-- index.css
`-- main.jsx
```

- `src/main.jsx`: application entry point. It mounts React into the `#root` element.
- `src/App.jsx`: renders the application router.
- `src/app/router.jsx`: central route definition.
- `src/app/providers.jsx`: global providers, currently the React Query provider.
- `src/app/layouts/`: route guards and layout wrappers.
- `src/features/`: domain-first modules. Each feature can contain `api`, `hooks`, `pages`, and `utils`.
- `src/lib/http.js`: Axios instance and request/response interceptors.
- `src/lib/env.js`: environment variable access.
- `src/lib/query-client.js`: React Query client configuration.
- `src/stores/`: global Zustand stores.
- `src/shared/`: shared components, hooks and utility functions.
- `src/index.css`: Tailwind CSS entry file.

## Prerequisites

- Node.js
- npm
- A running SyncDesk API backend

For local protected flows, the backend must be available and `VITE_API_URL` must point to it.

## Getting Started

Clone the repository:

```bash
git clone https://github.com/Titus-System/syncdesk-web.git
cd syncdesk-web
```

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Update the values in `.env` for your local backend.

Start the development server:

```bash
npm run dev
```

Open the application:

```text
http://localhost:5173
```

Vite runs with hot module replacement, so frontend changes are applied in real time during development.

## Environment Variables

The project includes `.env.example` as a reference.

```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
VITE_APP_NAME=SyncDesk
```

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Base URL for the SyncDesk API. Used by the Axios client. |
| `VITE_WS_URL` | Base URL for WebSocket/live chat when needed by integrations. |
| `VITE_APP_NAME` | Application name used as a fallback display value. |

The current `.env.example` contains placeholder values and should be adapted for each environment.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production bundle |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Build and Preview

Create a production build:

```bash
npm run build
```

Preview the built application:

```bash
npm run preview
```

## Application Entry

The application starts in `src/main.jsx`.

React mounts the app into the `#root` element from `index.html` and wraps it with:

- `StrictMode`
- `AppProviders`
- `App`

`AppProviders` currently provides `QueryClientProvider`. `App.jsx` renders `AppRouter`, which contains the route tree.

## Providers

Global providers are configured in `src/app/providers.jsx`.

React Query is configured in `src/lib/query-client.js` with:

- queries retrying once by default;
- `refetchOnWindowFocus: false`;
- mutations with no retry.

Feature hooks can override these defaults when needed, for example for polling or disabled retries.

## Routing

Routes are defined in `src/app/router.jsx`.

### Public Routes

| Path | Page |
| --- | --- |
| `/login` | Login page |
| `/recuperar-senha` | Password recovery |

### Access Block Route

| Path | Page |
| --- | --- |
| `/acesso-restrito-web` | Web access restricted page |

### Protected Routes

These routes require authentication and web/staff access.

| Path | Page |
| --- | --- |
| `/` | Dashboard |
| `/chat` | Live chat |
| `/chamados` | Ticket list |
| `/chamados/novo` | Create ticket |
| `/chamados/:ticketId/editar` | Edit ticket |
| `/configuracoes` | Account settings |

### Admin Routes

These routes require admin permission.

| Path | Page |
| --- | --- |
| `/usuarios` | User list |
| `/usuarios/novo` | Create user |
| `/usuarios/:userId/editar-cliente` | Edit client user |
| `/usuarios/:userId/editar-atendente` | Edit staff/admin user |

Unknown routes redirect to `/`.

## Layouts and Route Guards

Route guards live in `src/app/layouts/`.

- `AuthLayout`: used for public authentication pages. If the user is already authenticated, it redirects to `/`.
- `DashboardLayout`: requires an authenticated session and staff/web access. It also mounts global notification polling for authenticated staff users.
- `AgentOrAdminLayout`: allows users with web access, currently admin or agent/attendant roles.
- `AdminOnlyLayout`: allows only admin users. Non-admin users are redirected to `/`.

## Authentication

Authentication state is stored in Zustand in `src/stores/auth-stores.js` and persisted to `localStorage` under `syncdesk-auth`.

The auth store keeps:

- `user`
- `accessToken`
- `refreshToken`
- `isAuthenticated`

Login is handled by `useLoginMutation` in `src/features/auth/hooks/useLoginMutation.js`.

The login flow:

1. Calls the backend login endpoint.
2. Decodes the JWT payload.
3. Builds an initial user object from token data and response data.
4. Stores the session in Zustand.
5. Attempts to fetch the full user data by ID and update the stored user.

If the API returns `401`, the Axios response interceptor clears the session and redirects to `/login`.

## API Client

The HTTP client is configured in `src/lib/http.js`.

It creates a shared Axios instance with:

- `baseURL` from `VITE_API_URL`;
- `timeout` set to 15 seconds;
- a request interceptor that injects `Authorization: Bearer <accessToken>`;
- a response interceptor that clears the session and redirects to `/login` on `401`.

Feature API files under `src/features/*/api/` use this shared client.

## Realtime Chat

Live chat is implemented with the native `WebSocket` API.

The main hook is `src/features/chat/hooks/useLiveChatWebSocket.js`.

It connects to the currently opened conversation and manages:

- connection state: `idle`, `connecting`, `connected`, `error`, `disconnected`;
- incoming live messages;
- message sending through the open socket;
- JSON payload parsing;
- duplicate message protection;
- ignored system join messages.

The access token is sent through the WebSocket protocols as:

```js
['access_token', accessToken]
```

The WebSocket is only responsible for the currently opened live chat conversation. Global chat notifications are handled separately through polling.

## Notifications

Notification state lives in `src/stores/notification-store.js`.

It tracks:

- global unread chat count;
- unread chat count by `chat_id`;
- active chat ID;
- ticket update count.

### Chat Notifications

Global chat notifications use polling instead of a new WebSocket.

The polling hook is `src/features/chat/hooks/useChatNotificationsPolling.js` and is mounted from `DashboardLayout` for authenticated staff users.

Behavior:

- polls active conversations every 4 seconds with `GET /conversations/active`;
- uses `refetchIntervalInBackground: true`;
- first load only initializes the local snapshot;
- compares `message_count` and `last_message_at`;
- when a conversation changes, fetches recent messages with `GET /conversations/ticket/{ticket_id}/messages?page=1&limit=5`;
- ignores messages sent by the current user;
- ignores messages sent by `System`;
- does not notify for the currently opened conversation while the tab is visible;
- does notify for the currently opened conversation if the tab is in the background;
- increments the global Chat badge and the per-conversation badge;
- attempts to play `/sounds/notification.mp3`;
- updates the browser tab title, for example `(3) SyncDesk`.

Audio playback uses a safe helper in `src/features/chat/utils/play-notification-sound.js`:

- `new Audio('/sounds/notification.mp3')`;
- volume `0.5`;
- `audio.play().catch(() => undefined)`;
- browser autoplay blocks or missing files do not break the app.

The expected public asset path is:

```text
public/sounds/notification.mp3
```

### Ticket Notifications

Ticket notifications are visual only and are intended for admin users.

The polling hook is `src/features/ticket/hooks/useTicketUpdateNotifications.js` and is mounted from `DashboardLayout` only for authenticated admin users.

Behavior:

- polls tickets every 4 seconds through the existing ticket query hook;
- first load only initializes the snapshot;
- compares ticket ID plus relevant fields such as status, assignee/current agent, level, criticality and updated timestamps;
- increments the `Chamados` badge when a relevant update is detected;
- clears the badge when the user accesses the ticket list.

No new WebSocket was created for ticket or global notification flows.

## Permissions and Roles

Permission helpers live in `src/shared/hooks/` and `src/features/users/utils/role-utils.js`.

Main helpers:

- `useWebAccessRole`: returns admin/agent web access information.
- `useIsStaffRole`: checks if the user is admin or agent/attendant.
- `useIsAdminRole`: checks admin access.
- `role-utils.js`: normalizes role information for user management screens.

Current role mapping in `role-utils.js`:

| Key | Label | Role ID |
| --- | --- | --- |
| `admin` | Administrador | `1` |
| `user` | Usuario comum | `2` |
| `agent` | Atendente | `3` |
| `client` | Cliente | `4` |

The code accepts multiple backend response shapes for roles, including role IDs, role names, nested role objects and arrays.

## Styling

Styling uses Tailwind CSS.

Relevant files:

- `tailwind.config.js`
- `postcss.config.js`
- `src/index.css`

`src/index.css` imports:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Most screens use Tailwind utility classes directly in JSX. Icons come from `lucide-react`.

## Backend Integration

This frontend depends on the SyncDesk API backend.

For local development, the backend should be running before testing protected flows such as login, tickets, users and chat.

Typical local API configuration:

```env
VITE_API_URL=http://localhost:8000/api
```

If the backend exposes Swagger/OpenAPI locally, it is commonly available at:

```text
http://localhost:8000/docs
```

Confirm the actual backend URL and API prefix for your environment.

## Development Notes

- The project uses the alias `@` for `src`.
- `vite.config.js` also aliases `@titus-system/syncdesk` to `../syncdesk-library/src`. This is useful when developing against a local sibling copy of the SyncDesk library. Make sure that folder exists if you rely on this alias during local development.
- `src/lib/syncdesk.js` contains library configuration code for `@titus-system/syncdesk`, but the current application code primarily uses the local feature API services and shared Axios client.
- The default Vite development port is `5173`.

## Known Limitations

- The frontend requires the backend API for most protected pages.
- Browser autoplay policies may block notification audio until the user has interacted with the page.
- The notification sound file is expected at `/sounds/notification.mp3`; this README does not include or generate the audio asset.
- `npm run lint` may report pre-existing lint issues depending on the branch state. Check the current lint output before treating it as a regression.
