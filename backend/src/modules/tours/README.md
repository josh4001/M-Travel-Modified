# Tours & Travel module

**Status: scaffolded, not yet wired to controllers.**

The database tables this module needs already exist in `prisma/schema.prisma`
(TourOperatorProfile, Tour), so the data shape won't need to change when this is built out.

## To implement this module

1. Add `tours.module.ts`, `tours.service.ts`, `tours.controller.ts`
   following the pattern in `src/modules/vehicles/` (closest sibling module).
2. Register the module in `src/app.module.ts`.
3. Add DTOs under `dto/` with `class-validator` decorators, mirroring
   `vehicles/dto/create-vehicle.dto.ts`.
4. Reuse `JwtAuthGuard` + `RolesGuard` + `@Roles(...)` for access control.

## Notes specific to this module
---
- Packages (Safari/Beach/Hiking/Camping/City) map to `Tour.category` — consider a lookup table if operators need custom categories later.
