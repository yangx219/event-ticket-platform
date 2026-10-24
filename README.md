# EventPilot

> Event management and ticketing platform.

EventPilot is a full-stack event management and ticketing platform built with Java 21, Spring Boot, PostgreSQL, Keycloak and React. It is being extended with semantic event discovery, grounded assistance, secure tool calling and measurable evaluations.

## Overview

The application allows organizers to create and manage events, attendees to discover events and purchase tickets, and staff to validate tickets using QR codes. The project emphasizes secure identity, reliable transactions, reproducible database evolution and production-oriented engineering.

## Tech Stack

- **Backend:** Java 21, Spring Boot, Spring Security, Spring Data JPA
- **Database:** PostgreSQL
- **Authentication:** Keycloak, OAuth 2.0, OpenID Connect, JWT
- **Frontend:** React, TypeScript, Vite
- **Infrastructure:** Docker Compose
- **Database migrations:** Flyway
- **AI:** OpenAI Responses API, strict structured output and server-side secret management
- **AI roadmap:** PostgreSQL/pgvector, RAG, tool calling and evaluations

## Features

- Event creation and management
- Ticket type configuration
- Event publishing
- Ticket purchasing
- Transactional order checkout with price snapshots and mock payments
- Idempotent order creation and purchaser-scoped order history
- Quantity-aware checkout UI, order confirmation and My Orders dashboard
- QR code generation and validation
- Role-based access control
- Versioned database migrations and schema validation
- Business validation for event dates, sales windows and ticket availability
- AI-assisted event copy that fills editable organizer form fields

## AI Engineering Roadmap

The first AI capability is implemented: authenticated organizers can turn an event brief into editable event and ticket copy. The backend calls the OpenAI Responses API, enforces a strict JSON schema and keeps the API key outside the browser. Planned increments are:

- Natural-language event discovery
- Keyword and vector hybrid search with pgvector
- Grounded event and policy Q&A with citations
- Permission-aware tool calling for event, inventory and order queries
- Recommendation baselines and offline evaluation
- Retrieval, tool-selection, latency and cost evaluation

## Development Status

This project is under active development. The current milestone focuses on the reliable business foundation required before AI tools are allowed to read or act on transactional data.

The current milestone includes transactional checkout, idempotency, isolated PostgreSQL integration tests, CI and the first structured-output AI workflow. Planned improvements include observability, AI retrieval/evaluation and cloud deployment.

## AI Event Copy Assistant

The feature is disabled by default. For local development, copy the safe template and edit the ignored `.env` file once:

```bash
cd backend
cp .env.example .env
```

Before starting Spring Boot, load that file into the current terminal:

```bash
set -a
source .env
set +a
./mvnw spring-boot:run
```

Spring Boot does not load `.env` automatically. The three shell commands export its values to the backend process. The real `.env` is ignored by Git; only `.env.example`, which contains no secret, may be committed.

AI calls are limited to five requests per authenticated user per minute by default. Successful calls log provider, model, duration and token counts without logging prompts or API keys. Override the defaults with `AI_RATE_LIMIT_REQUESTS` and `AI_RATE_LIMIT_WINDOW` when needed.

Log in as an organizer, open **Create Event**, describe the event and select **Generate and fill form**. Generated content remains editable and is never automatically published. Without configuration the endpoint returns `503 Service Unavailable` with an actionable message.

## Order API

Authenticated attendees can create an order with `POST /api/v1/orders`. Every request must include an `Idempotency-Key` header (maximum 100 characters) and a body such as:

```json
{
  "eventId": "00000000-0000-0000-0000-000000000000",
  "ticketTypeId": "00000000-0000-0000-0000-000000000000",
  "quantity": 2
}
```

The same user, key and request return the existing order instead of issuing duplicate tickets. Reusing the key for different order data returns `409 Conflict`. Orders can be read through `GET /api/v1/orders` and `GET /api/v1/orders/{orderId}`; queries are scoped to the authenticated purchaser.

## Testing and CI

The backend test suite combines JUnit 5, Mockito, MockMvc and Testcontainers. Integration tests start an isolated PostgreSQL 17 container, run the real Flyway migrations, verify transactional persistence, race two buyers for the final ticket and prove that QR generation failures roll back the complete checkout.

```bash
cd backend
./mvnw verify
```

The frontend is checked with ESLint, TypeScript and a production Vite build:

```bash
cd frontend
npm run lint
npm run build
```

GitHub Actions runs these backend and frontend jobs for pull requests to `main` and pushes to `main` or `feature/**`. Docker must be available locally for the Testcontainers tests.

## Credits

Based on the [Devtiro Event Ticket App](https://github.com/devtiro/devtiro-event-ticket-app) open-source tutorial.

Original source code is licensed under the MIT License. Original copyright notices are retained.
