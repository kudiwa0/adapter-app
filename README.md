# FHIR Adapter Frontend Guide

This guide describes the expected frontend screens, user flows, and API endpoints for the FHIR Adapter admin interface. Styling details can be decided separately.

---

## Frontend Scope

The frontend is an admin-facing interface for managing the adapter, reviewing activity, and submitting patient data through the adapter pipeline.

The first version should include:

- Admin login
- Dashboard with logs and metrics
- Patient registration/submission
- Institution management
- Failed record review

---

## Navigation

The authenticated admin area should have a persistent navigation layout with these main destinations:

- Dashboard
- Register Patient
- Institutions
- Failed Records
- Logs

The interface should keep the admin focused on operational work. Use compact layouts, clear tables, searchable lists, and forms with visible validation states.

---

## Login Screen

**Route:** `/login`

**Purpose:** Allow the admin user to sign in with username and password.

**Fields:**
- Username
- Password

**Expected behavior:**
- Show field-level validation for missing input.
- Show a clear error message when credentials are rejected.
- Redirect authenticated users to `/dashboard`.
- Keep unauthenticated users away from protected pages.

**Frontend-required backend endpoints to add:**
```
POST /api/auth/login/
POST /api/auth/logout/
GET /api/auth/me/
```

**Suggested login request:**
```json
{
  "username": "admin",
  "password": "admin-password"
}
```

**Suggested login response:**
```json
{
  "access": "token-or-session-value",
  "user": {
    "id": 1,
    "username": "admin",
    "is_staff": true,
    "is_superuser": true
  }
}
```

---

## Dashboard

**Route:** `/dashboard`

**Purpose:** Show a quick operational summary of the adapter.

**Main content:**
- Total records received
- Total successful records
- Total failed records
- Success rate
- Recent successful logs
- Recent failed records

**Existing metrics endpoint:**
```
GET /api/dashboard/metrics/
```

**Current response:**
```json
{
  "total_received": 120,
  "total_successful": 114,
  "total_failed": 6,
  "success_rate": 95.0
}
```

**Frontend-required log endpoint to add:**
```
GET /api/logs/
```

**Suggested log response:**
```json
[
  {
    "id": 1,
    "institution": 2,
    "institution_name": "OpenMRS General Hospital",
    "format_received": "fhir",
    "time_taken_ms": 430,
    "golden_record_id": "GR-123",
    "created_at": "2026-05-10T12:00:00Z"
  }
]
```

---

## Register Patient

**Route:** `/patients/new`

**Purpose:** Allow the admin to manually submit patient data into the adapter pipeline.

**Suggested form sections:**
- Patient identity
- Demographics
- Contact details
- Source institution
- Optional raw FHIR preview

**Minimum form fields:**
- First name
- Last name
- Gender
- Birth date
- Institution

**Frontend-required admin patient endpoint to add:**
```
POST /api/patients/
```

**Suggested request:**
```json
{
  "institution_id": 2,
  "first_name": "John",
  "last_name": "Doe",
  "gender": "male",
  "birth_date": "1980-01-01"
}
```

**Suggested response:**
```json
{
  "status": "success",
  "golden_record_id": "GR-123",
  "format_detected": "fhir"
}
```

---

## Institutions

**Route:** `/institutions`

**Purpose:** Allow the admin to register and manage institutions that send data into the adapter.

**Main content:**
- Institution table
- Institution status
- Created date
- Register institution action
- Revoke access action

**Existing endpoints:**
```
GET /api/institutions/
POST /api/institutions/
GET /api/institutions/{id}/
PATCH /api/institutions/{id}/
DELETE /api/institutions/{id}/
POST /api/institutions/{id}/revoke/
```

**Current admin header:**
```
Authorization: Admin-Key <admin_key>
```

**Create institution request:**
```json
{
  "name": "OpenMRS General Hospital",
  "is_active": true
}
```

**Create institution response:**
```json
{
  "id": 2,
  "name": "OpenMRS General Hospital",
  "api_key": "ndhs_generated_key",
  "is_active": true,
  "created_at": "2026-05-10T12:00:00Z"
}
```

**Important frontend behavior:**
- Show the generated `api_key` only after institution creation.
- Make it easy for the admin to copy the key once.
- Do not display the API key again in institution lists or detail views.

**List institution response:**
```json
[
  {
    "id": 2,
    "name": "OpenMRS General Hospital",
    "is_active": true,
    "created_at": "2026-05-10T12:00:00Z"
  }
]
```

---

## Failed Records

**Route:** `/failed-records`

**Purpose:** Allow the admin to review failed adapter records and mark them as resolved.

**Main content:**
- Failed records table
- Failure stage
- Institution
- Created date
- Resolved status
- Record detail panel
- Resolution notes form

**Existing endpoints:**
```
GET /api/dead-letter/
GET /api/dead-letter/{id}/
PATCH /api/dead-letter/{id}/
PUT /api/dead-letter/{id}/
```

**Suggested resolve request:**
```json
{
  "resolved": true,
  "resolution_notes": "Reviewed and reprocessed manually."
}
```

**Important frontend behavior:**
- Display raw payload in a readable detail view.
- Display validation or forwarding errors clearly.
- Keep destructive actions out of the main table row.
- Require confirmation before marking a record as resolved.

---

## Logs

**Route:** `/logs`

**Purpose:** Allow the admin to inspect successful adapter processing activity.

**Main content:**
- Successful processing table
- Institution
- Input format
- Processing time
- Golden record ID
- Created date

**Frontend-required backend endpoint to add:**
```
GET /api/logs/
GET /api/logs/{id}/
```

**Suggested filters:**
```
?institution=<id>
?format_received=fhir
?created_after=2026-05-01
?created_before=2026-05-10
```

---

## API Documentation

**Existing documentation endpoints:**
```
GET /api/schema/
GET /api/docs/
GET /api/redoc/
```

The frontend can use these endpoints during development to confirm request and response shapes.

---

## Authentication Notes

**Current backend behavior:**
- Institution intake uses `Authorization: Api-Key <institution_api_key>`.
- Institution management uses `Authorization: Admin-Key <admin_key>`.
- There is no username/password API login endpoint yet.

**Recommended frontend target:**
- Use username/password login for admin users.
- Use the logged-in admin session or token for admin pages.
- Keep institution API keys only for institution or edge-agent data submission.

---

## Protected Routes

These routes should require an authenticated admin:

```
/dashboard
/patients/new
/institutions
/failed-records
/logs
```

Unauthenticated users should be redirected to `/login`.

---

## Empty and Error States

Every data screen should handle:

- Loading state
- Empty state
- Network error state
- Unauthorized state
- Validation error state

For unauthorized API responses, redirect the admin to `/login`.

---

## First Frontend Milestone

Build the first version in this order:

1. Login screen
2. Dashboard metrics
3. Institution list and create form
4. Register patient form
5. Failed records list and detail view
6. Logs list

---

## Frontend Implementation Notes

Set `NEXT_PUBLIC_ADAPTER_API_BASE_URL` when connecting the frontend to a running adapter backend. When the variable is not set, the app uses local demo data so the admin workflows can be reviewed without a backend.

```bash
NEXT_PUBLIC_ADAPTER_API_BASE_URL=http://localhost:8000 npm run dev
```

The demo login is:

```txt
username: admin
password: admin-password
```
