/*
# [Fix] Resolve RLS Infinite Recursion

This migration fixes a critical bug in the Row Level Security (RLS) policies that caused an infinite recursion loop when an admin user tried to access data.

## Query Description:
The previous policies for admin access used a subquery on the `profiles` table to check the user's role. This created a circular dependency: to access the table, the policy was checked, but the policy needed to access the table, leading to a crash.

This script resolves the issue by:
1. Dropping the faulty admin policies from the `profiles`, `events`, `orders`, and `order_items` tables.
2. Creating a new `SECURITY DEFINER` function named `get_current_user_role()`. This special function runs with elevated privileges, allowing it to safely check a user's role from the `profiles` table without triggering the RLS policies again.
3. Re-creating the admin policies to use this new, safe function.

This change is safe and does not affect existing data. It is essential for making the admin role functional.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true (by dropping the function and restoring the old policies)

## Structure Details:
- **Dropped Policies**: "Admins can manage all profiles", "Admins can manage all events", "Admins can manage all orders", "Admins can manage all order items".
- **Created Function**: `public.get_current_user_role()`.
- **Created Policies**: New versions of the dropped policies that use the new function.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
- Auth Requirements: This change correctly implements the intended admin-level permissions. The use of `SECURITY DEFINER` is safe in this context as the function is simple and only reads data based on the authenticated user's ID (`auth.uid()`).

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Minimal. Using a function might have a slight overhead compared to a subquery, but it resolves a critical application-breaking bug.
*/

-- Step 1: Drop the faulty policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;

-- Step 2: Create a safe function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_name TEXT;
BEGIN
  -- This function runs with the privileges of the owner, bypassing the RLS check
  -- on the profiles table for this specific query, thus preventing recursion.
  SELECT role INTO role_name FROM public.profiles WHERE user_id = auth.uid();
  RETURN role_name;
END;
$$;

-- Step 3: Re-create the policies using the new function

-- Policy for profiles
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- Policy for events
CREATE POLICY "Admins can manage all events"
  ON public.events FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- Policy for orders
CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- Policy for order_items
CREATE POLICY "Admins can manage all order items"
  ON public.order_items FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');
