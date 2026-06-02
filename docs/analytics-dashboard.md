# FHIR Analytics Dashboard

The analytics dashboard gives administrators an operational view of adapter traffic in one place. It answers the core daily questions:

- How many transactions are being handled.
- What percentage has gone through successfully.
- What failed and where it failed.
- How many system instances are exchanging information.
- Which FHIR datapoints, patient profiles, and disease signals are present in the payloads.

## Filters

The dashboard supports preset time windows for quick operational reviews:

- Today
- Yesterday
- Last 7 days
- Last 30 days
- Last month
- All time

System filtering is driven by the registered institution list. When a system is selected, metrics, failures, logs, and derived payload signals are scoped to that institution.

## Offline Demo Mode

Set `NEXT_PUBLIC_ADAPTER_OFFLINE=true` or `NEXT_PUBLIC_ADAPTER_API_BASE_URL=offline` when the backend is unavailable. In offline mode, the API client returns local demo data for:

- Admin login
- Dashboard metrics
- Institutions
- Successful processing logs
- Failed records

Demo credentials are `admin` and `admin-password`.

## Chart Coverage

The dashboard uses several chart types to make the data easier to scan:

- KPI cards for transaction count, success percentage, failures, and exchanging systems.
- Area chart for successful and failed transaction trends over time.
- Donut chart for outcome mix.
- Bar charts for failure stages and system exchange volume.
- Ranked lists for FHIR resource types, people profiles, and disease signals.

## Backend Expectations

The dashboard can work with the existing summary metrics endpoint. More complete analytics are available when these endpoints include filter support:

- `GET /api/dashboard/metrics/?created_after=&created_before=&institution=`
- `GET /api/logs/?created_after=&created_before=&institution=`
- `GET /api/dead-letter/`
- `GET /api/institutions/`

Successful logs should include `institution`, `institution_name`, `created_at`, and optional FHIR details such as `resource_type` or `raw_payload`.
