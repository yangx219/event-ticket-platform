CREATE TABLE orders (
    id UUID PRIMARY KEY,
    purchaser_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(32) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT chk_orders_total_amount CHECK (total_amount >= 0),
    CONSTRAINT uq_orders_purchaser_idempotency UNIQUE (purchaser_id, idempotency_key)
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id),
    ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
    ticket_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT chk_order_items_unit_price CHECK (unit_price >= 0),
    CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),
    CONSTRAINT chk_order_items_line_total CHECK (line_total >= 0)
);

CREATE TABLE payments (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id),
    status VARCHAR(32) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    provider VARCHAR(32) NOT NULL,
    provider_reference VARCHAR(255),
    failure_code VARCHAR(100),
    failure_message VARCHAR(500),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT chk_payments_amount CHECK (amount >= 0),
    CONSTRAINT uq_payments_provider_reference UNIQUE (provider, provider_reference)
);

ALTER TABLE tickets ADD COLUMN order_item_id UUID;
ALTER TABLE tickets
    ADD CONSTRAINT fk_tickets_order_item
    FOREIGN KEY (order_item_id) REFERENCES order_items(id);

CREATE INDEX idx_orders_purchaser_created_at
    ON orders (purchaser_id, created_at DESC);
CREATE INDEX idx_orders_status_created_at
    ON orders (status, created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_ticket_type_id ON order_items (ticket_type_id);
CREATE INDEX idx_payments_order_id ON payments (order_id);
CREATE INDEX idx_payments_status_created_at
    ON payments (status, created_at DESC);
CREATE INDEX idx_tickets_order_item_id ON tickets (order_item_id);
