# Notifications (Push/SMS/Email) module

**Status: scaffolded, not yet wired to controllers.**

The database tables this module needs already exist in `prisma/schema.prisma`
(Notification), so the data shape won't need to change when this is built out.

## To implement this module

1. Add `notifications.module.ts`, `notifications.service.ts`, `notifications.controller.ts`
   following the pattern in `src/modules/vehicles/` (closest sibling module).
2. Register the module in `src/app.module.ts`.
3. Add DTOs under `dto/` with `class-validator` decorators, mirroring
   `vehicles/dto/create-vehicle.dto.ts`.
4. Reuse `JwtAuthGuard` + `RolesGuard` + `@Roles(...)` for access control.

## Notes specific to this module
---
- Push: Firebase Cloud Messaging admin SDK, server-side only (never expose FCM server key to the frontend).
- SMS: pick one Kenyan-friendly provider (e.g. Africa's Talking) and keep the sender behind a NotificationsService interface so providers are swappable.
- Email: SMTP via nodemailer, or a transactional provider (Postmark/SES).
