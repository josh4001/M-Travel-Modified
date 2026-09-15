# Bus Reservation module

**Status: scaffolded, not yet wired to controllers.**

The database tables this module needs already exist in `prisma/schema.prisma`
(BusCompany, Bus, Route), so the data shape won't need to change when this is built out.

## To implement this module

1. Add `buses.module.ts`, `buses.service.ts`, `buses.controller.ts`
   following the pattern in `src/modules/vehicles/` (closest sibling module).
2. Register the module in `src/app.module.ts`.
3. Add DTOs under `dto/` with `class-validator` decorators, mirroring
   `vehicles/dto/create-vehicle.dto.ts`.
4. Reuse `JwtAuthGuard` + `RolesGuard` + `@Roles(...)` for access control.

## Notes specific to this module
---
- Seat selection / QR ticket generation can follow the same booking-ref pattern used in `bookings.service.ts` (`generateBookingRef`).
- SMS confirmation hooks into the notifications module once that's live.
