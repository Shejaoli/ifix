ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_state text;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_phone text;

CREATE INDEX IF NOT EXISTS orders_payment_reference_idx
  ON orders (payment_reference);

CREATE TABLE IF NOT EXISTS ipay_webhook_events (
  event_id text PRIMARY KEY,
  transaction_id text NOT NULL,
  state text NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL,
  occurred_at timestamp NOT NULL,
  received_at timestamp NOT NULL DEFAULT now()
);
