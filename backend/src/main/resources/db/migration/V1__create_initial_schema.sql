CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    event_start TIMESTAMP,
    event_end TIMESTAMP,
    venue VARCHAR(255) NOT NULL,
    sales_start TIMESTAMP,
    sales_end TIMESTAMP,
    status VARCHAR(255) NOT NULL,
    organizer_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_types (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    description VARCHAR(255),
    total_available INTEGER,
    event_id UUID NOT NULL REFERENCES events(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY,
    status VARCHAR(255) NOT NULL,
    ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
    purchaser_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY,
    status VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_validations (
    id UUID PRIMARY KEY,
    status VARCHAR(255) NOT NULL,
    validation_method VARCHAR(255) NOT NULL,
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS user_attending_events (
    user_id UUID NOT NULL REFERENCES users(id),
    event_id UUID NOT NULL REFERENCES events(id),
    PRIMARY KEY (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS user_staffing_events (
    user_id UUID NOT NULL REFERENCES users(id),
    event_id UUID NOT NULL REFERENCES events(id),
    PRIMARY KEY (user_id, event_id)
);

ALTER TABLE events ALTER COLUMN organizer_id SET NOT NULL;
ALTER TABLE ticket_types ALTER COLUMN event_id SET NOT NULL;
ALTER TABLE tickets ALTER COLUMN ticket_type_id SET NOT NULL;
ALTER TABLE tickets ALTER COLUMN purchaser_id SET NOT NULL;
ALTER TABLE qr_codes ALTER COLUMN ticket_id SET NOT NULL;
ALTER TABLE ticket_validations ALTER COLUMN ticket_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS uq_qr_codes_value ON qr_codes (value);
CREATE INDEX IF NOT EXISTS idx_events_status_start ON events (status, event_start);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events (organizer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id ON ticket_types (event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_purchaser_id ON tickets (purchaser_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type_id ON tickets (ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_ticket_id ON qr_codes (ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_validations_ticket_id ON ticket_validations (ticket_id);
