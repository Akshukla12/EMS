--
-- Create profiles table to store user data
--
/*
          # [Operation Name]
          Create profiles table

          ## Query Description: [This operation creates a 'profiles' table to store user-specific data like their name and role (user, vendor, admin). It links each profile to a user in Supabase's built-in authentication system. This table is essential for managing role-based access control throughout the application. No existing data will be affected as this is a new table.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table: public.profiles
          - Columns: id, user_id, name, role, created_at
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes (New policies will be added)
          - Auth Requirements: Users must be authenticated to interact with their own profile.
          
          ## Performance Impact:
          - Indexes: Primary key on 'id', foreign key on 'user_id'.
          - Triggers: None
          - Estimated Impact: Low, standard table creation.
          */
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

--
-- Create function to handle new user sign-ups
--
/*
          # [Operation Name]
          Create handle_new_user function

          ## Query Description: [This creates a database function that automatically inserts a new row into the 'profiles' table whenever a new user signs up via Supabase Auth. It extracts the user's ID, name, and role from the authentication metadata and creates their profile, ensuring that every user has a corresponding profile record.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Function: public.handle_new_user
          
          ## Security Implications:
          - RLS Status: N/A
          - Policy Changes: No
          - Auth Requirements: This function runs with the privileges of the user who defines it.
          
          ## Performance Impact:
          - Indexes: N/A
          - Triggers: This function will be used by a trigger.
          - Estimated Impact: Low, runs only on new user creation.
          */
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'role'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--
-- Create trigger to call the function on new user creation
--
/*
          # [Operation Name]
          Create on_auth_user_created trigger

          ## Query Description: [This sets up a trigger that automatically executes the 'handle_new_user' function after a new user is successfully created in the 'auth.users' table. This automates the profile creation process, making it seamless and reliable.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Trigger: on_auth_user_created on auth.users
          
          ## Security Implications:
          - RLS Status: N/A
          - Policy Changes: No
          - Auth Requirements: N/A
          
          ## Performance Impact:
          - Indexes: N/A
          - Triggers: Added
          - Estimated Impact: Low, slight overhead on user sign-up.
          */
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

--
-- Create events table for vendors
--
/*
          # [Operation Name]
          Create events table

          ## Query Description: [This operation creates the 'events' table, which is central to the application. It stores all event details, including name, description, price, date, and a reference to the vendor who created it. This table will be used by vendors to manage their offerings and by users to browse and book events.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table: public.events
          - Columns: id, vendor_id, name, type, description, price, capacity, date, image_url, location, created_at
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes (New policies will be added)
          - Auth Requirements: Users must be authenticated. Vendors need specific permissions.
          
          ## Performance Impact:
          - Indexes: Primary key on 'id', foreign key on 'vendor_id'.
          - Triggers: None
          - Estimated Impact: Low, standard table creation.
          */
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    capacity INT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    image_url TEXT,
    location VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

--
-- Create orders table
--
/*
          # [Operation Name]
          Create orders table

          ## Query Description: [This creates the 'orders' table to track all bookings made by users. It stores the user who placed the order, the total price, the order status (e.g., pending, confirmed), and customer details for billing. This is critical for the checkout and order management features.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table: public.orders
          - Columns: id, user_id, total_price, status, customer_details, created_at
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes (New policies will be added)
          - Auth Requirements: Users must be authenticated to create or view their orders.
          
          ## Performance Impact:
          - Indexes: Primary key on 'id', foreign key on 'user_id'.
          - Triggers: None
          - Estimated Impact: Low, standard table creation.
          */
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    customer_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

--
-- Create order_items table
--
/*
          # [Operation Name]
          Create order_items table

          ## Query Description: [This creates a junction table, 'order_items', to link orders with the specific events that were booked. It stores which event was part of which order, the quantity, and the price at the time of purchase. This allows for detailed order histories.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table: public.order_items
          - Columns: id, order_id, event_id, quantity, price
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes (New policies will be added)
          - Auth Requirements: Access is determined by access to the parent order.
          
          ## Performance Impact:
          - Indexes: Primary key on 'id', foreign keys on 'order_id' and 'event_id'.
          - Triggers: None
          - Estimated Impact: Low, standard table creation.
          */
CREATE TABLE public.order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    quantity INT NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);

--
-- Enable Row Level Security (RLS) for all tables
--
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- RLS Policies for profiles
--
/*
          # [Operation Name]
          Create RLS Policies for profiles

          ## Query Description: [These security policies ensure that users can only view and update their own profile information. Admins are given full access to manage all profiles. This is a critical security measure to protect user data.]
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "High"
          - Requires-Backup: false
          - Reversible: true
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: Policies are based on authenticated user roles.
          */
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

--
-- RLS Policies for events
--
/*
          # [Operation Name]
          Create RLS Policies for events

          ## Query Description: [These policies control access to the 'events' table. All authenticated users can view events (for the catalog). Only users with the 'vendor' role can create events, and they can only update or delete the events they own. Admins have full control over all events.]
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "High"
          - Requires-Backup: false
          - Reversible: true
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: Policies are based on authenticated user roles.
          */
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Vendors can create events" ON public.events FOR INSERT WITH CHECK ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'vendor');
CREATE POLICY "Vendors can update their own events" ON public.events FOR UPDATE USING (vendor_id = auth.uid());
CREATE POLICY "Vendors can delete their own events" ON public.events FOR DELETE USING (vendor_id = auth.uid());
CREATE POLICY "Admins can manage all events" ON public.events FOR ALL USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

--
-- RLS Policies for orders
--
/*
          # [Operation Name]
          Create RLS Policies for orders

          ## Query Description: [These policies secure the 'orders' table. Users can create orders and can only view their own order history. Admins can view all orders. Vendors can view orders that contain their events, which is handled by a more complex policy.]
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "High"
          - Requires-Backup: false
          - Reversible: true
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: Policies are based on authenticated user roles.
          */
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');
CREATE POLICY "Vendors can view orders for their events" ON public.orders FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.events e ON oi.event_id = e.id
    WHERE oi.order_id = public.orders.id AND e.vendor_id = auth.uid()
  )
);

--
-- RLS Policies for order_items
--
/*
          # [Operation Name]
          Create RLS Policies for order_items

          ## Query Description: [These policies protect the 'order_items' table. Access is granted based on whether the user has access to the parent order. This ensures that users can only see the items in their own orders, and vendors/admins can see items in orders they are permitted to view.]
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "High"
          - Requires-Backup: false
          - Reversible: true
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: Policies are based on authenticated user roles.
          */
CREATE POLICY "Users can manage items for their own orders" ON public.order_items FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_id AND o.user_id = auth.uid()
  )
);
CREATE POLICY "Admins and relevant vendors can view all order items" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_id
  )
);
