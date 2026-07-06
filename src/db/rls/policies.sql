-- =============================================================================
-- RLS Policies for Seekingbusiness CRM
-- Apply after all tables are created (run after migration)
-- =============================================================================

-- Helper: get current user's role from profiles
-- Used as a reusable expression in policies

-- =============================================================================
-- Enable RLS on all sensitive tables
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_approval_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE no_purchase_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE wati_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_consultations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- profiles
-- =============================================================================

-- Own profile: any authenticated user can read their own
CREATE POLICY "profiles_read_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admin roles can read all profiles
CREATE POLICY "profiles_read_all_admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario')
  );

-- Vendedor can read profiles of their assigned clients
CREATE POLICY "profiles_read_assigned_vendedor"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'vendedor'
    AND assigned_salesperson_id = auth.uid()
  );

-- Only admin_general can write profiles
CREATE POLICY "profiles_write_admin"
  ON profiles FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin_general'
  );

-- Users can update their own basic fields (not role)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- =============================================================================
-- products — public read, admin write
-- =============================================================================

-- Anyone (including anonymous) can read products
CREATE POLICY "products_read_public"
  ON products FOR SELECT
  USING (active = true);

-- Admins can read all products (including inactive)
CREATE POLICY "products_read_all_admin"
  ON products FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario')
  );

-- Only admin_general and admin_secundario can write products
CREATE POLICY "products_write_admin"
  ON products FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario')
  );

-- categories — same as products
CREATE POLICY "categories_read_public"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "categories_write_admin"
  ON categories FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario')
  );

-- product_embeddings — internal only
CREATE POLICY "product_embeddings_read_internal"
  ON product_embeddings FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario', 'vendedor')
  );

CREATE POLICY "product_embeddings_write_admin"
  ON product_embeddings FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario')
  );

-- =============================================================================
-- clients
-- =============================================================================

-- Vendedor can read/write their own assigned clients
CREATE POLICY "clients_read_vendedor"
  ON clients FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'vendedor'
    AND profile_id IN (
      SELECT id FROM profiles WHERE assigned_salesperson_id = auth.uid()
    )
  );

-- Admin can read/write all clients
CREATE POLICY "clients_all_admin"
  ON clients FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario')
  );

-- Cliente can only read their own record
CREATE POLICY "clients_read_own_cliente"
  ON clients FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'cliente'
    AND profile_id = auth.uid()
  );

-- =============================================================================
-- client_scores — NEVER accessible to cliente role
-- =============================================================================

CREATE POLICY "client_scores_internal_only"
  ON client_scores FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario', 'vendedor')
  );

CREATE POLICY "client_scores_write_system"
  ON client_scores FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario')
  );

CREATE POLICY "score_history_internal_only"
  ON score_history FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario', 'vendedor')
  );

-- =============================================================================
-- scoring_config — read by internal roles, write by admin_general only
-- =============================================================================

CREATE POLICY "scoring_config_read_internal"
  ON scoring_config FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario', 'vendedor')
  );

CREATE POLICY "scoring_config_write_admin_general"
  ON scoring_config FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin_general'
  );

-- =============================================================================
-- quotes
-- =============================================================================

-- Vendedor can access their own quotes
CREATE POLICY "quotes_vendedor_own"
  ON quotes FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'vendedor'
    AND salesperson_id = auth.uid()
  );

-- Admin can access all quotes
CREATE POLICY "quotes_admin_all"
  ON quotes FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario')
  );

-- Cliente can read approved quotes for their client record
CREATE POLICY "quotes_cliente_read_approved"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'cliente'
    AND status IN ('approved', 'sent', 'accepted', 'declined')
    AND client_id IN (
      SELECT id FROM clients WHERE profile_id = auth.uid()
    )
  );

-- quote_items follow quote access
CREATE POLICY "quote_items_follow_quote"
  ON quote_items FOR ALL
  TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM quotes
      WHERE salesperson_id = auth.uid()
         OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario')
    )
  );

CREATE POLICY "quote_approval_log_internal"
  ON quote_approval_log FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario', 'vendedor')
  );

-- =============================================================================
-- interest_lists + interest_list_items
-- =============================================================================

-- Cliente can only access their own list
CREATE POLICY "interest_lists_cliente_own"
  ON interest_lists FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'cliente'
    AND client_id IN (
      SELECT id FROM clients WHERE profile_id = auth.uid()
    )
  );

-- Vendedor and admin can read all lists
CREATE POLICY "interest_lists_internal_read"
  ON interest_lists FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario', 'vendedor')
  );

CREATE POLICY "interest_list_items_cliente_own"
  ON interest_list_items FOR ALL
  TO authenticated
  USING (
    interest_list_id IN (
      SELECT il.id FROM interest_lists il
      JOIN clients c ON c.id = il.client_id
      WHERE c.profile_id = auth.uid()
    )
  );

CREATE POLICY "interest_list_items_internal_read"
  ON interest_list_items FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario', 'vendedor')
  );

-- =============================================================================
-- no_purchase_alerts
-- =============================================================================

CREATE POLICY "no_purchase_alerts_read_internal"
  ON no_purchase_alerts FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario', 'vendedor')
  );

CREATE POLICY "no_purchase_alerts_write_admin_general"
  ON no_purchase_alerts FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin_general'
  );

-- =============================================================================
-- app_config
-- =============================================================================

CREATE POLICY "app_config_read_internal"
  ON app_config FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario', 'vendedor')
  );

CREATE POLICY "app_config_write_admin_general"
  ON app_config FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin_general'
  );

-- =============================================================================
-- campaigns + send_queue
-- =============================================================================

CREATE POLICY "campaigns_admin_full"
  ON campaigns FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario')
  );

CREATE POLICY "campaigns_vendedor_read"
  ON campaigns FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'vendedor'
  );

CREATE POLICY "send_queue_admin_only"
  ON send_queue FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario')
  );

-- =============================================================================
-- wati_messages
-- =============================================================================

-- Admin can read wati messages
CREATE POLICY "wati_messages_admin_read"
  ON wati_messages FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario')
  );

-- Only system (service role) can write wati messages — no client-facing write policy

-- =============================================================================
-- voice_consultations
-- =============================================================================

-- Cliente can read their own consultations
CREATE POLICY "voice_consultations_cliente_own"
  ON voice_consultations FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'cliente'
    AND client_id IN (
      SELECT id FROM clients WHERE profile_id = auth.uid()
    )
  );

-- Vendedor can read consultations assigned to them
CREATE POLICY "voice_consultations_vendedor_assigned"
  ON voice_consultations FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'vendedor'
    AND assigned_to = auth.uid()
  );

-- Admin can read all consultations
CREATE POLICY "voice_consultations_admin_all"
  ON voice_consultations FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin_general', 'admin_secundario')
  );

-- Authenticated users can create consultations (they are the sender)
CREATE POLICY "voice_consultations_create_authenticated"
  ON voice_consultations FOR INSERT
  TO authenticated
  WITH CHECK (true);
