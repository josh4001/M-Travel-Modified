# Payments (M-Pesa, Stripe, PayPal) module

**Status: scaffolded, not yet wired to controllers.**

The database tables this module needs already exist in `prisma/schema.prisma`
(Payment), so the data shape won't need to change when this is built out.

## To implement this module

1. Add `payments.module.ts`, `payments.service.ts`, `payments.controller.ts`
   following the pattern in `src/modules/vehicles/` (closest sibling module).
2. Register the module in `src/app.module.ts`.
3. Add DTOs under `dto/` with `class-validator` decorators, mirroring
   `vehicles/dto/create-vehicle.dto.ts`.
4. Reuse `JwtAuthGuard` + `RolesGuard` + `@Roles(...)` for access control.

## Notes specific to this module
---
- M-Pesa: Daraja STK Push (C2B) for customer payments, B2C for owner withdrawals. Requires a publicly reachable callback URL.
- Stripe/PayPal: use their webhook signature verification (STRIPE_WEBHOOK_SECRET) — never trust a client-reported payment status.
- On success, call `WalletService.credit()` for the provider payout minus commission, and flip `Booking.status` to CONFIRMED.
