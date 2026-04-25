-- =============================================================================
-- Traiteur Pro — Complete RLS Policy Set
-- Generated: 2026-04-18
-- Pattern: business_id = get_my_business_id()
-- Auth model: auth.uid() maps to users.id; users.business_id is the tenant key
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 0 — Security-definer helper (avoids recursive RLS on the users table)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_business_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER   -- runs as table owner, bypasses RLS on users
STABLE
SET search_path = public
AS $$
  SELECT business_id FROM users WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION get_my_business_id() TO authenticated;


-- =============================================================================
-- TABLE: users
-- Special case: SELECT must allow seeing all colleagues in the same business
-- (needed by Personnel page to list staff). UPDATE restricted to own row.
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select"   ON users;
DROP POLICY IF EXISTS "users_insert"   ON users;
DROP POLICY IF EXISTS "users_update"   ON users;
DROP POLICY IF EXISTS "users_delete"   ON users;

-- Any authenticated user can see all rows that share their business_id
CREATE POLICY "users_select" ON users
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

-- Only the service role / admin creates user rows (sign-up flow)
-- If you let managers create staff accounts via the app, use:
--   USING (get_my_business_id() IS NOT NULL)
CREATE POLICY "users_insert" ON users
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

-- Users can only update their own profile row
CREATE POLICY "users_update" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Deletion restricted to same business (admins only in practice via app logic)
CREATE POLICY "users_delete" ON users
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: business_profiles
-- Public SELECT (needed by LandingPage without auth, fetched by hostname).
-- All writes restricted to the business owner.
-- =============================================================================
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_profiles_select_public" ON business_profiles;
DROP POLICY IF EXISTS "business_profiles_insert"        ON business_profiles;
DROP POLICY IF EXISTS "business_profiles_update"        ON business_profiles;
DROP POLICY IF EXISTS "business_profiles_delete"        ON business_profiles;

-- Public read — required for white-label landing pages served to non-logged-in visitors
CREATE POLICY "business_profiles_select_public" ON business_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "business_profiles_insert" ON business_profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = get_my_business_id());

CREATE POLICY "business_profiles_update" ON business_profiles
  FOR UPDATE TO authenticated
  USING (id = get_my_business_id())
  WITH CHECK (id = get_my_business_id());

CREATE POLICY "business_profiles_delete" ON business_profiles
  FOR DELETE TO authenticated
  USING (id = get_my_business_id());


-- =============================================================================
-- TABLE: subscriptions
-- =============================================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete" ON subscriptions;

CREATE POLICY "subscriptions_select" ON subscriptions
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "subscriptions_insert" ON subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "subscriptions_update" ON subscriptions
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "subscriptions_delete" ON subscriptions
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: clients
-- =============================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_update" ON clients;
DROP POLICY IF EXISTS "clients_delete" ON clients;

CREATE POLICY "clients_select" ON clients
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "clients_insert" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "clients_update" ON clients
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "clients_delete" ON clients
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: events
-- =============================================================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select" ON events;
DROP POLICY IF EXISTS "events_insert" ON events;
DROP POLICY IF EXISTS "events_update" ON events;
DROP POLICY IF EXISTS "events_delete" ON events;

CREATE POLICY "events_select" ON events
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "events_insert" ON events
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "events_update" ON events
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "events_delete" ON events
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: event_days  (child of events — multi-day wedding feature)
-- =============================================================================
ALTER TABLE event_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_days_select" ON event_days;
DROP POLICY IF EXISTS "event_days_insert" ON event_days;
DROP POLICY IF EXISTS "event_days_update" ON event_days;
DROP POLICY IF EXISTS "event_days_delete" ON event_days;

CREATE POLICY "event_days_select" ON event_days
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "event_days_insert" ON event_days
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "event_days_update" ON event_days
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "event_days_delete" ON event_days
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: event_day_dishes  (child of event_days)
-- =============================================================================
ALTER TABLE event_day_dishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_day_dishes_select" ON event_day_dishes;
DROP POLICY IF EXISTS "event_day_dishes_insert" ON event_day_dishes;
DROP POLICY IF EXISTS "event_day_dishes_update" ON event_day_dishes;
DROP POLICY IF EXISTS "event_day_dishes_delete" ON event_day_dishes;

CREATE POLICY "event_day_dishes_select" ON event_day_dishes
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "event_day_dishes_insert" ON event_day_dishes
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "event_day_dishes_update" ON event_day_dishes
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "event_day_dishes_delete" ON event_day_dishes
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: dishes
-- =============================================================================
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dishes_select" ON dishes;
DROP POLICY IF EXISTS "dishes_insert" ON dishes;
DROP POLICY IF EXISTS "dishes_update" ON dishes;
DROP POLICY IF EXISTS "dishes_delete" ON dishes;

CREATE POLICY "dishes_select" ON dishes
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "dishes_insert" ON dishes
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "dishes_update" ON dishes
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "dishes_delete" ON dishes
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: dish_ingredients
-- =============================================================================
ALTER TABLE dish_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dish_ingredients_select" ON dish_ingredients;
DROP POLICY IF EXISTS "dish_ingredients_insert" ON dish_ingredients;
DROP POLICY IF EXISTS "dish_ingredients_update" ON dish_ingredients;
DROP POLICY IF EXISTS "dish_ingredients_delete" ON dish_ingredients;

CREATE POLICY "dish_ingredients_select" ON dish_ingredients
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "dish_ingredients_insert" ON dish_ingredients
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "dish_ingredients_update" ON dish_ingredients
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "dish_ingredients_delete" ON dish_ingredients
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: event_dishes  (event ↔ dish junction, used by Calculateur/Devis)
-- =============================================================================
ALTER TABLE event_dishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_dishes_select" ON event_dishes;
DROP POLICY IF EXISTS "event_dishes_insert" ON event_dishes;
DROP POLICY IF EXISTS "event_dishes_update" ON event_dishes;
DROP POLICY IF EXISTS "event_dishes_delete" ON event_dishes;

CREATE POLICY "event_dishes_select" ON event_dishes
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "event_dishes_insert" ON event_dishes
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "event_dishes_update" ON event_dishes
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "event_dishes_delete" ON event_dishes
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: ingredients  (stock ingredient master list)
-- =============================================================================
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ingredients_select" ON ingredients;
DROP POLICY IF EXISTS "ingredients_insert" ON ingredients;
DROP POLICY IF EXISTS "ingredients_update" ON ingredients;
DROP POLICY IF EXISTS "ingredients_delete" ON ingredients;

CREATE POLICY "ingredients_select" ON ingredients
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "ingredients_insert" ON ingredients
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "ingredients_update" ON ingredients
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "ingredients_delete" ON ingredients
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: stock_movements
-- =============================================================================
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_movements_select" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_insert" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_update" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_delete" ON stock_movements;

CREATE POLICY "stock_movements_select" ON stock_movements
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "stock_movements_insert" ON stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "stock_movements_update" ON stock_movements
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "stock_movements_delete" ON stock_movements
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: payments
-- =============================================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select" ON payments;
DROP POLICY IF EXISTS "payments_insert" ON payments;
DROP POLICY IF EXISTS "payments_update" ON payments;
DROP POLICY IF EXISTS "payments_delete" ON payments;

CREATE POLICY "payments_select" ON payments
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "payments_insert" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "payments_update" ON payments
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "payments_delete" ON payments
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: expenses
-- =============================================================================
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses_select" ON expenses;
DROP POLICY IF EXISTS "expenses_insert" ON expenses;
DROP POLICY IF EXISTS "expenses_update" ON expenses;
DROP POLICY IF EXISTS "expenses_delete" ON expenses;

CREATE POLICY "expenses_select" ON expenses
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "expenses_insert" ON expenses
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "expenses_update" ON expenses
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "expenses_delete" ON expenses
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: expense_categories
-- =============================================================================
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expense_categories_select" ON expense_categories;
DROP POLICY IF EXISTS "expense_categories_insert" ON expense_categories;
DROP POLICY IF EXISTS "expense_categories_update" ON expense_categories;
DROP POLICY IF EXISTS "expense_categories_delete" ON expense_categories;

CREATE POLICY "expense_categories_select" ON expense_categories
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "expense_categories_insert" ON expense_categories
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "expense_categories_update" ON expense_categories
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "expense_categories_delete" ON expense_categories
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: payroll
-- =============================================================================
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payroll_select" ON payroll;
DROP POLICY IF EXISTS "payroll_insert" ON payroll;
DROP POLICY IF EXISTS "payroll_update" ON payroll;
DROP POLICY IF EXISTS "payroll_delete" ON payroll;

CREATE POLICY "payroll_select" ON payroll
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "payroll_insert" ON payroll
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "payroll_update" ON payroll
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "payroll_delete" ON payroll
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: invoices
-- =============================================================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select" ON invoices;
DROP POLICY IF EXISTS "invoices_insert" ON invoices;
DROP POLICY IF EXISTS "invoices_update" ON invoices;
DROP POLICY IF EXISTS "invoices_delete" ON invoices;

CREATE POLICY "invoices_select" ON invoices
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "invoices_delete" ON invoices
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: invoice_items
-- NOTE: If this table has no direct business_id column, replace the USING
-- clause with the subquery variant shown in the comment below.
-- =============================================================================
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoice_items_select" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_update" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete" ON invoice_items;

-- If invoice_items HAS a business_id column (preferred):
CREATE POLICY "invoice_items_select" ON invoice_items
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "invoice_items_insert" ON invoice_items
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "invoice_items_update" ON invoice_items
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "invoice_items_delete" ON invoice_items
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());

-- ALTERNATIVE — If invoice_items has NO business_id column (links via invoice_id only):
-- CREATE POLICY "invoice_items_select" ON invoice_items
--   FOR SELECT TO authenticated
--   USING (invoice_id IN (SELECT id FROM invoices WHERE business_id = get_my_business_id()));
-- (repeat pattern for INSERT/UPDATE/DELETE)


-- =============================================================================
-- TABLE: staff_attendance
-- =============================================================================
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_attendance_select" ON staff_attendance;
DROP POLICY IF EXISTS "staff_attendance_insert" ON staff_attendance;
DROP POLICY IF EXISTS "staff_attendance_update" ON staff_attendance;
DROP POLICY IF EXISTS "staff_attendance_delete" ON staff_attendance;

CREATE POLICY "staff_attendance_select" ON staff_attendance
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "staff_attendance_insert" ON staff_attendance
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "staff_attendance_update" ON staff_attendance
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "staff_attendance_delete" ON staff_attendance
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: traditional_roles
-- =============================================================================
ALTER TABLE traditional_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "traditional_roles_select" ON traditional_roles;
DROP POLICY IF EXISTS "traditional_roles_insert" ON traditional_roles;
DROP POLICY IF EXISTS "traditional_roles_update" ON traditional_roles;
DROP POLICY IF EXISTS "traditional_roles_delete" ON traditional_roles;

CREATE POLICY "traditional_roles_select" ON traditional_roles
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "traditional_roles_insert" ON traditional_roles
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "traditional_roles_update" ON traditional_roles
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "traditional_roles_delete" ON traditional_roles
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: event_traditional_staff
-- =============================================================================
ALTER TABLE event_traditional_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_traditional_staff_select" ON event_traditional_staff;
DROP POLICY IF EXISTS "event_traditional_staff_insert" ON event_traditional_staff;
DROP POLICY IF EXISTS "event_traditional_staff_update" ON event_traditional_staff;
DROP POLICY IF EXISTS "event_traditional_staff_delete" ON event_traditional_staff;

CREATE POLICY "event_traditional_staff_select" ON event_traditional_staff
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "event_traditional_staff_insert" ON event_traditional_staff
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "event_traditional_staff_update" ON event_traditional_staff
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "event_traditional_staff_delete" ON event_traditional_staff
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: rental_items
-- =============================================================================
ALTER TABLE rental_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rental_items_select" ON rental_items;
DROP POLICY IF EXISTS "rental_items_insert" ON rental_items;
DROP POLICY IF EXISTS "rental_items_update" ON rental_items;
DROP POLICY IF EXISTS "rental_items_delete" ON rental_items;

CREATE POLICY "rental_items_select" ON rental_items
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "rental_items_insert" ON rental_items
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "rental_items_update" ON rental_items
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "rental_items_delete" ON rental_items
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: rental_categories
-- =============================================================================
ALTER TABLE rental_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rental_categories_select" ON rental_categories;
DROP POLICY IF EXISTS "rental_categories_insert" ON rental_categories;
DROP POLICY IF EXISTS "rental_categories_update" ON rental_categories;
DROP POLICY IF EXISTS "rental_categories_delete" ON rental_categories;

CREATE POLICY "rental_categories_select" ON rental_categories
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "rental_categories_insert" ON rental_categories
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "rental_categories_update" ON rental_categories
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "rental_categories_delete" ON rental_categories
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: event_rental_items
-- =============================================================================
ALTER TABLE event_rental_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_rental_items_select" ON event_rental_items;
DROP POLICY IF EXISTS "event_rental_items_insert" ON event_rental_items;
DROP POLICY IF EXISTS "event_rental_items_update" ON event_rental_items;
DROP POLICY IF EXISTS "event_rental_items_delete" ON event_rental_items;

CREATE POLICY "event_rental_items_select" ON event_rental_items
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "event_rental_items_insert" ON event_rental_items
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "event_rental_items_update" ON event_rental_items
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "event_rental_items_delete" ON event_rental_items
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: pastry_recipes
-- =============================================================================
ALTER TABLE pastry_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pastry_recipes_select" ON pastry_recipes;
DROP POLICY IF EXISTS "pastry_recipes_insert" ON pastry_recipes;
DROP POLICY IF EXISTS "pastry_recipes_update" ON pastry_recipes;
DROP POLICY IF EXISTS "pastry_recipes_delete" ON pastry_recipes;

CREATE POLICY "pastry_recipes_select" ON pastry_recipes
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "pastry_recipes_insert" ON pastry_recipes
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "pastry_recipes_update" ON pastry_recipes
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "pastry_recipes_delete" ON pastry_recipes
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: pastry_ingredients
-- =============================================================================
ALTER TABLE pastry_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pastry_ingredients_select" ON pastry_ingredients;
DROP POLICY IF EXISTS "pastry_ingredients_insert" ON pastry_ingredients;
DROP POLICY IF EXISTS "pastry_ingredients_update" ON pastry_ingredients;
DROP POLICY IF EXISTS "pastry_ingredients_delete" ON pastry_ingredients;

CREATE POLICY "pastry_ingredients_select" ON pastry_ingredients
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "pastry_ingredients_insert" ON pastry_ingredients
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "pastry_ingredients_update" ON pastry_ingredients
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "pastry_ingredients_delete" ON pastry_ingredients
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: event_pastry_orders
-- =============================================================================
ALTER TABLE event_pastry_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_pastry_orders_select" ON event_pastry_orders;
DROP POLICY IF EXISTS "event_pastry_orders_insert" ON event_pastry_orders;
DROP POLICY IF EXISTS "event_pastry_orders_update" ON event_pastry_orders;
DROP POLICY IF EXISTS "event_pastry_orders_delete" ON event_pastry_orders;

CREATE POLICY "event_pastry_orders_select" ON event_pastry_orders
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "event_pastry_orders_insert" ON event_pastry_orders
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "event_pastry_orders_update" ON event_pastry_orders
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "event_pastry_orders_delete" ON event_pastry_orders
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- TABLE: reminder_rules
-- =============================================================================
ALTER TABLE reminder_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reminder_rules_select" ON reminder_rules;
DROP POLICY IF EXISTS "reminder_rules_insert" ON reminder_rules;
DROP POLICY IF EXISTS "reminder_rules_update" ON reminder_rules;
DROP POLICY IF EXISTS "reminder_rules_delete" ON reminder_rules;

CREATE POLICY "reminder_rules_select" ON reminder_rules
  FOR SELECT TO authenticated
  USING (business_id = get_my_business_id());

CREATE POLICY "reminder_rules_insert" ON reminder_rules
  FOR INSERT TO authenticated
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "reminder_rules_update" ON reminder_rules
  FOR UPDATE TO authenticated
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "reminder_rules_delete" ON reminder_rules
  FOR DELETE TO authenticated
  USING (business_id = get_my_business_id());


-- =============================================================================
-- END OF FILE
-- 28 tables covered · 4 policies each (SELECT / INSERT / UPDATE / DELETE)
-- Run this entire script in the Supabase SQL Editor.
-- The get_my_business_id() function must exist before any policy is created.
-- =============================================================================
