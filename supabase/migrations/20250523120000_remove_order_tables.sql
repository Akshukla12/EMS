/*
# [Operation Name]
Remove Order and Cart Functionality

## Query Description: [This operation will permanently delete the `order_items` and `orders` tables from your database. All existing order data will be lost. This action is required to align the database with the new application structure that no longer includes cart and order features. Please ensure you have backed up any critical order data before proceeding.]

## Metadata:
- Schema-Category: ["Dangerous"]
- Impact-Level: ["High"]
- Requires-Backup: [true]
- Reversible: [false]

## Structure Details:
- Tables to be dropped: `public.order_items`, `public.orders`

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [N/A]

## Performance Impact:
- Indexes: [Removed]
- Triggers: [N/A]
- Estimated Impact: [Removes tables, which will free up space and simplify the schema.]
*/

-- Drop the order_items table first due to foreign key constraint
DROP TABLE IF EXISTS public.order_items;

-- Drop the orders table
DROP TABLE IF EXISTS public.orders;
