# Admin Dashboard module

**Status: scaffolded, not yet wired to controllers.**

The database tables this module needs already exist in `prisma/schema.prisma`
(cross-module aggregation queries), so the data shape won't need to change when this is built out.

## To implement this module

1. Add `admin.module.ts`, `admin.service.ts`, `admin.controller.ts`
   following the pattern in `src/modules/vehicles/` (closest sibling module).
2. Register the module in `src/app.module.ts`.
3. Add DTOs under `dto/` with `class-validator` decorators, mirroring
   `vehicles/dto/create-vehicle.dto.ts`.
4. Reuse `JwtAuthGuard` + `RolesGuard` + `@Roles(...)` for access control.

## Notes specific to this module
---
- Guard every route with `@Roles(Role.ADMIN, Role.SUPER_ADMIN)`.
- Analytics/heat maps/revenue dashboards are read-only aggregation queries against existing tables — no new write paths needed.
- Fraud detection and support tickets can start as simple rule-based flags (e.g. multiple bookings from one card in an hour) before any ML.
