# Frontend ↔ Backend API Contract

Base URL: `http://localhost:8000/api` (configurable via `VITE_API_BASE_URL`)

## Enums
- `workflow_type`: `task | product | habit | generic`
- `item_type`: `task | product | habit`
- `item status`: `not_started | in_progress | completed | archived`
- `step_type`: `manual | checklist | approval | timer`
- `step status`: `active | done | skipped` (runtime rows may also return `pending`)
- `substep status`: `pending | done`

## Workflows
- `GET /workflows?type=<workflow_type>`
- `POST /workflows`
  - body: `{ name: string(1..200), description?: string(<=2000), workflow_type }`
- `GET /workflows/{workflow_id}`
- `PUT /workflows/{workflow_id}`
  - body: partial of create fields
- `DELETE /workflows/{workflow_id}`

## Steps
- `GET /steps?workflow_id=<uuid>`
- `POST /steps`
  - body: `{ workflow_id, name: string(1..200), description?: string(<=2000), step_type, can_have_substeps?: boolean, is_required?: boolean }`
- `GET /steps/{step_id}`
- `PUT /steps/{step_id}` (partial step fields)
- `DELETE /steps/{step_id}`

## Items
- `GET /items?type=<item_type>&status=<item_status>`
- `POST /items`
  - body: `{ title: string(1..200), item_type, workflow_id, description?: string(<=2000) }`
- `GET /items/{item_id}`
- `PUT /items/{item_id}`
  - body: partial `{ title?, description?, status? }`
- `DELETE /items/{item_id}`

## Executions
- `GET /executions/{execution_id}/steps`
- `PUT /executions/{execution_id}/steps/{step_id}`
  - body: `{ status: active|done|skipped }`
- `POST /executions/{execution_id}/steps/{step_id}/substeps`
  - body: `{ name: string(1..200), order?: int(1..9999) }`
- `GET /executions/{execution_id}/steps/{step_id}/substeps`
- `PUT /executions/{execution_id}/steps/{step_id}/substeps/{substep_id}`
  - body: `{ status: pending|done }`
- `DELETE /executions/{execution_id}/steps/{step_id}/substeps/{substep_id}`
- `GET /executions/{execution_id}/steps/{step_id}/notes`
- `POST /executions/{execution_id}/steps/{step_id}/notes`
  - body: `{ note: string(1..4000) }`

## Auth
- `POST /auth/signup` body `{ email, password(8..128), name? }`
- `POST /auth/login` body `{ email, password(8..128) }`
- `POST /auth/token` body `{ email, password(8..128) }`
- `GET /auth/me` with `Authorization: Bearer <token>`
- `POST /auth/logout`
