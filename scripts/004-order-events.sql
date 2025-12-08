-- Order Events Table for logging Buy Now clicks and Order placements
-- This table is used for analytics and recommendations (no RLS)

CREATE TABLE IF NOT EXISTS order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'buy_now_clicked', 'order_placed'
    session_id TEXT, -- optional, for anonymous users
    order_id UUID, -- optional, if you later create a full orders table
    metadata JSONB, -- additional data such as price, quantity, source, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_order_event_type CHECK (
        event_type IN ('buy_now_clicked', 'order_placed')
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_events_user_id ON order_events(user_id);
CREATE INDEX IF NOT EXISTS idx_order_events_product_id ON order_events(product_id);
CREATE INDEX IF NOT EXISTS idx_order_events_event_type ON order_events(event_type);
CREATE INDEX IF NOT EXISTS idx_order_events_created_at ON order_events(created_at DESC);





