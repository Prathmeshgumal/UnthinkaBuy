-- Cart items table to track user's shopping cart
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate entries
  CONSTRAINT unique_user_product_cart UNIQUE (user_id, product_id),
  
  -- Check constraints
  CONSTRAINT check_quantity_positive CHECK (quantity > 0)
) TABLESPACE pg_default;

-- Favorites/Wishlist table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorite_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate entries
  CONSTRAINT unique_user_product_favorite UNIQUE (user_id, product_id)
) TABLESPACE pg_default;

-- Cart activity log for tracking add/remove actions
CREATE TABLE IF NOT EXISTS public.cart_activity_log (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'added', 'removed', 'quantity_updated'
  quantity INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT cart_activity_log_pkey PRIMARY KEY (id),
  -- Foreign keys
  CONSTRAINT fk_cart_log_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_log_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Check constraint for valid actions
  CONSTRAINT check_valid_action CHECK (action IN ('added', 'removed', 'quantity_updated'))
) TABLESPACE pg_default;

-- Favorites activity log for tracking add/remove actions
CREATE TABLE IF NOT EXISTS public.favorites_activity_log (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'added', 'removed'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT favorites_activity_log_pkey PRIMARY KEY (id),
  -- Foreign keys
  CONSTRAINT fk_favorite_log_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorite_log_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Check constraint for valid actions
  CONSTRAINT check_valid_favorite_action CHECK (action IN ('added', 'removed'))
) TABLESPACE pg_default;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_added_at ON public.cart_items(added_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON public.favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_added_at ON public.favorites(added_at DESC);

CREATE INDEX IF NOT EXISTS idx_cart_log_user_id ON public.cart_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_log_timestamp ON public.cart_activity_log(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_favorite_log_user_id ON public.favorites_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_log_timestamp ON public.favorites_activity_log(timestamp DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at in cart_items
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
