Backend: Search Normalization Guide

Overview
- The API supports case- and accent-insensitive search for Videos, Experts, and Formations using normalized columns.
- Normalized columns (lowercased, diacritics removed) are added alongside original text fields.

Normalized Columns
- Expert: `nameNormalized`, `specialtyNormalized`
- Formation: `titleNormalized`, `instructorNormalized`, `descriptionNormalized`
- Video: `titleNormalized`, `expertNormalized`

One-time Setup (after pulling changes)
1) Generate Prisma client
   - `npx prisma generate`
2) Run migration (adds normalized columns)
   - `npx prisma migrate dev -n add-normalized-search-columns`
3) Backfill existing data
   - `npm run db:normalize`
4) Restart the backend server

Behavior
- New creates/updates fill normalized fields automatically (experts and formations). Seed also fills normalized fields.
- The list endpoints now search across both original and normalized fields for better matching on SQLite.

Commands
- Backfill again at any time: `npm run db:normalize`
- Reset + seed (development only): `npm run db:reset`

Notes
- If you introduce new searchable text fields, add corresponding `...Normalized` columns and update:
  - Create/update controllers to fill normalized values
  - Seed script to populate normalized values
  - List controllers to include the normalized fields in search filters
