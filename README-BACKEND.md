# Apex Developments API

All endpoints return `{ success, data, message }` or `{ success: false, error }`. Authentication uses the HTTP-only `apex_session` cookie.

| Endpoint | Methods | Permission |
| --- | --- | --- |
| `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` | POST / GET | Public / signed in |
| `/api/projects` | GET, POST | `PROJECT_VIEW`, `PROJECT_CREATE` |
| `/api/projects/:id` | GET, PATCH | `PROJECT_VIEW`, `PROJECT_UPDATE` + project access |
| `/api/tasks`, `/api/tasks/my` | GET, POST | `TASK_VIEW`, `TASK_CREATE` |
| `/api/records/:kind` | GET, POST | Module permission + project access |
| `/api/dashboard`, `/api/search` | GET | Role-scoped `PROJECT_VIEW` |

Set `.env.local` using `.env.example`, then seed MongoDB with `npm run seed`. APIs require a MongoDB instance and `JWT_SECRET`; none of these values are committed.
