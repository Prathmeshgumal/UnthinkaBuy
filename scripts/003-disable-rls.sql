-- Disable Row Level Security (RLS) for cart and favorites tables
-- Run this if RLS was enabled and you want to disable it

-- Disable RLS on all tables
ALTER TABLE IF EXISTS public.cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cart_activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.favorites_activity_log DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies (optional, but good for cleanup)
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;

DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;

DROP POLICY IF EXISTS "Users can view their own cart activity" ON public.cart_activity_log;
DROP POLICY IF EXISTS "Users can view their own favorites activity" ON public.favorites_activity_log;

-- Verify RLS is disabled (you can run this to check)
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('cart_items', 'favorites', 'cart_activity_log', 'favorites_activity_log');

