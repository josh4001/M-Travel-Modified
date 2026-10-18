# Tours & Travel Module

**Status: Implemented & Wired to Controllers.**

The module handles all tourist circuits, guided safaris, and destination packages.
Includes full support for the **10 Official Regional Kenyan Tourist Circuits** curated from leadership documentation.

## Endpoints

- `GET /api/v1/tours/circuits` — Returns all 10 Official Regional Kenyan Tourist Circuits with full itineraries, attractions, tourist typologies, and original images.
- `GET /api/v1/tours` — Search and browse tours, safari packages, and circuits (supports query params: `search`, `category`, `region`, `minPrice`, `maxPrice`).
- `GET /api/v1/tours/:id` — Retrieve details for a specific tour or circuit.
- `POST /api/v1/tours` — Create a new tour package (Admin / Tour Operator role required).
- `PATCH /api/v1/tours/:id` — Update an existing tour package.
- `DELETE /api/v1/tours/:id` — Delete a tour package (Admin role required).
