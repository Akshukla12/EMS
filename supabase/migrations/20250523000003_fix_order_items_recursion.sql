/*
# [Fix] Correct RLS Policy for order_items and Add Vendor Policy

This script resolves an "infinite recursion" error on the `order_items` table and adds a missing policy for vendors.

1.  **Recursion Fix**: The error is caused by a faulty admin policy that creates a circular dependency. This script replaces it with a corrected version using the `is_admin()` helper function.
2.  **Vendor Policy**: A new policy is added to allow vendors to view the items within orders that are for their specific events.

## Query Description:
- **Safety:** This operation is safe and does not risk data loss. It only modifies security policies.
- **Impact:** After applying this script, admin and vendor users will be able to view all relevant order items without encountering errors.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- **Tables Affected:** `public.order_items`
- **Policies Modified:**
  - "Admins can do anything with order items" (Replaced)
  - "Vendors can see items for their events" (Added)

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. Corrects a malfunctioning policy and adds a new one to enforce intended security rules.
*/

-- Drop the faulty policy on order_items that causes recursion for admins.
DROP POLICY IF EXISTS "Admins can do anything with order items" ON public.order_items;

-- Recreate the admin policy using the safe `is_admin()` helper function.
CREATE POLICY "Admins can manage all order items"
ON public.order_items
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Add a policy to allow vendors to see the items belonging to orders for their events.
-- This was missing and is required for the vendor order history to work correctly.
CREATE POLICY "Vendors can see items for their events"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  (SELECT vendor_id FROM public.events WHERE id = event_id) = auth.uid()
);
