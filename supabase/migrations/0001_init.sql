-- ============================================================
-- Goodsly E-COMMERCE — SUPABASE DATABASE SCHEMA
-- Run via: npx supabase db push  OR  paste in Supabase SQL editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- fuzzy search
CREATE EXTENSION IF NOT EXISTS "pg_cron";   -- scheduled jobs

-- ─────────────────────────────────────────────────────────────
-- PROFILES  (extends Supabase auth.users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'customer'
                  CHECK (role IN ('customer', 'admin', 'staff')),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- ADDRESSES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  line1         TEXT NOT NULL,
  line2         TEXT,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  pincode       TEXT NOT NULL,
  country       TEXT NOT NULL DEFAULT 'IN',
  is_default    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Only one default address per user
CREATE UNIQUE INDEX idx_addresses_one_default
  ON public.addresses(user_id)
  WHERE is_default = TRUE;

-- ─────────────────────────────────────────────────────────────
-- CATEGORIES  (self-referencing for nested nav)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  image_url     TEXT,
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medusa_product_id   TEXT UNIQUE,
  category_id         UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  description         TEXT,
  material            TEXT,
  care_instructions   TEXT,
  base_price          NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
  compare_price       NUMERIC(10,2) CHECK (compare_price >= 0),
  tags                TEXT[] DEFAULT '{}',
  is_active           BOOLEAN DEFAULT TRUE,
  is_featured         BOOLEAN DEFAULT FALSE,
  is_just_in          BOOLEAN DEFAULT FALSE,
  is_gift_packable    BOOLEAN DEFAULT TRUE,
  meta_title          TEXT,
  meta_description    TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- PRODUCT VARIANTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.product_variants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  medusa_variant_id   TEXT UNIQUE,
  sku                 TEXT NOT NULL UNIQUE,
  color               TEXT,
  size                TEXT,
  price               NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  compare_price       NUMERIC(10,2),
  weight_grams        INT DEFAULT 0,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- PRODUCT IMAGES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.product_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id    UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  storage_path  TEXT NOT NULL,
  url           TEXT NOT NULL,
  alt_text      TEXT,
  is_primary    BOOLEAN DEFAULT FALSE,
  sort_order    INT DEFAULT 0
);

-- ─────────────────────────────────────────────────────────────
-- INVENTORY  (one row per variant — source of truth for stock)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id      UUID NOT NULL UNIQUE REFERENCES public.product_variants(id) ON DELETE CASCADE,
  qty_available   INT NOT NULL DEFAULT 0 CHECK (qty_available >= 0),
  qty_reserved    INT NOT NULL DEFAULT 0 CHECK (qty_reserved >= 0),
  qty_sold        INT NOT NULL DEFAULT 0 CHECK (qty_sold >= 0),
  reorder_level   INT DEFAULT 5,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Atomic inventory reservation function (prevents overselling)
CREATE OR REPLACE FUNCTION public.reserve_inventory(
  p_variant_id UUID,
  p_quantity   INT
) RETURNS BOOLEAN AS $$
DECLARE
  v_available INT;
BEGIN
  SELECT qty_available - qty_reserved INTO v_available
  FROM public.inventory
  WHERE variant_id = p_variant_id
  FOR UPDATE;

  IF v_available < p_quantity THEN
    RETURN FALSE;
  END IF;

  UPDATE public.inventory
  SET qty_reserved = qty_reserved + p_quantity,
      updated_at   = NOW()
  WHERE variant_id = p_variant_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Release reservation (on cancel/failed payment)
CREATE OR REPLACE FUNCTION public.release_inventory(
  p_variant_id UUID,
  p_quantity   INT
) RETURNS VOID AS $$
BEGIN
  UPDATE public.inventory
  SET qty_reserved = GREATEST(0, qty_reserved - p_quantity),
      updated_at   = NOW()
  WHERE variant_id = p_variant_id;
END;
$$ LANGUAGE plpgsql;

-- Finalise inventory on delivery
CREATE OR REPLACE FUNCTION public.finalise_inventory(
  p_variant_id UUID,
  p_quantity   INT
) RETURNS VOID AS $$
BEGIN
  UPDATE public.inventory
  SET qty_reserved  = GREATEST(0, qty_reserved - p_quantity),
      qty_available = GREATEST(0, qty_available - p_quantity),
      qty_sold      = qty_sold + p_quantity,
      updated_at    = NOW()
  WHERE variant_id = p_variant_id;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- CART ITEMS  (persistent server-side cart)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.cart_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  variant_id    UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity      INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  gift_wrap     BOOLEAN DEFAULT FALSE,
  gift_message  TEXT CHECK (char_length(gift_message) <= 150),
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, variant_id)
);

-- ─────────────────────────────────────────────────────────────
-- COUPONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.coupons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT NOT NULL UNIQUE,
  description       TEXT,
  type              TEXT NOT NULL CHECK (type IN ('percent', 'flat', 'free_product')),
  value             NUMERIC(10,2),
  free_product_id   UUID REFERENCES public.products(id) ON DELETE SET NULL,
  min_order_value   NUMERIC(10,2) DEFAULT 0 CHECK (min_order_value >= 0),
  max_uses          INT CHECK (max_uses > 0),
  used_count        INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  is_active         BOOLEAN DEFAULT TRUE,
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- SHIPPING METHODS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.shipping_methods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  provider        TEXT DEFAULT 'shiprocket',
  base_fee        NUMERIC(10,2) DEFAULT 0 CHECK (base_fee >= 0),
  free_above      NUMERIC(10,2) DEFAULT 0,
  est_days_min    INT DEFAULT 3 CHECK (est_days_min > 0),
  est_days_max    INT DEFAULT 7 CHECK (est_days_max >= est_days_min),
  is_active       BOOLEAN DEFAULT TRUE
);

-- Default shipping method (free shipping)
INSERT INTO public.shipping_methods (name, base_fee, free_above, est_days_min, est_days_max)
VALUES ('Standard Delivery', 0, 0, 3, 7);

-- ─────────────────────────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number          TEXT NOT NULL UNIQUE,
  user_id               UUID NOT NULL REFERENCES public.profiles(id),
  address_id            UUID NOT NULL REFERENCES public.addresses(id),
  coupon_id             UUID REFERENCES public.coupons(id),
  shipping_method_id    UUID REFERENCES public.shipping_methods(id),
  medusa_order_id       TEXT,
  shiprocket_order_id   TEXT,
  shiprocket_shipment_id TEXT,
  awb_code              TEXT,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN (
                            'pending', 'confirmed', 'packed',
                            'shipped', 'delivered', 'cancelled', 'returned'
                          )),
  is_gift               BOOLEAN DEFAULT FALSE,
  gift_message          TEXT CHECK (char_length(gift_message) <= 150),
  cod_requested         BOOLEAN DEFAULT FALSE,
  subtotal              NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  discount_amt          NUMERIC(10,2) DEFAULT 0 CHECK (discount_amt >= 0),
  shipping_fee          NUMERIC(10,2) DEFAULT 0 CHECK (shipping_fee >= 0),
  total                 NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  notes                 TEXT,
  placed_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Order number sequence function
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;
CREATE OR REPLACE FUNCTION public.generate_order_number() RETURNS TEXT AS $$
BEGIN
  RETURN 'AKI-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
         LPAD(nextval('order_number_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id    UUID NOT NULL REFERENCES public.product_variants(id),
  quantity      INT NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price   NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  gift_wrap     BOOLEAN DEFAULT FALSE,
  is_free_gift  BOOLEAN DEFAULT FALSE
);

-- ─────────────────────────────────────────────────────────────
-- ORDER STATUS LOG  (append-only audit trail)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.order_status_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status        TEXT NOT NULL,
  note          TEXT,
  changed_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-log status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_logs (order_id, status)
    VALUES (NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_status_changed
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- ─────────────────────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL UNIQUE REFERENCES public.orders(id),
  method              TEXT NOT NULL CHECK (method IN ('online', 'cod')),
  provider            TEXT,
  transaction_id      TEXT,
  razorpay_order_id   TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  amount              NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  is_cod              BOOLEAN DEFAULT FALSE,
  paid_at             TIMESTAMPTZ,
  refunded_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- PROMOTIONS  (homepage banners, badge labels, sale events)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.promotions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  banner_image_url  TEXT,
  mobile_image_url  TEXT,
  badge_text        TEXT,
  link_url          TEXT,
  sort_order        INT DEFAULT 0,
  starts_at         TIMESTAMPTZ,
  ends_at           TIMESTAMPTZ,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- PROMO PRODUCTS  (featured products in a promotion section)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.promo_products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id  UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order    INT DEFAULT 0,
  UNIQUE(promotion_id, product_id)
);

-- ─────────────────────────────────────────────────────────────
-- WISHLISTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.wishlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ─────────────────────────────────────────────────────────────
-- REVIEWS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.reviews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES public.profiles(id),
  rating                INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title                 TEXT,
  body                  TEXT,
  is_verified_purchase  BOOLEAN DEFAULT FALSE,
  is_approved           BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX idx_products_category      ON public.products(category_id);
CREATE INDEX idx_products_slug          ON public.products(slug);
CREATE INDEX idx_products_active        ON public.products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_just_in       ON public.products(is_just_in) WHERE is_just_in = TRUE;
CREATE INDEX idx_variants_product       ON public.product_variants(product_id);
CREATE INDEX idx_images_product         ON public.product_images(product_id);
CREATE INDEX idx_inventory_variant      ON public.inventory(variant_id);
CREATE INDEX idx_cart_user              ON public.cart_items(user_id);
CREATE INDEX idx_orders_user            ON public.orders(user_id);
CREATE INDEX idx_orders_status          ON public.orders(status);
CREATE INDEX idx_orders_placed_at       ON public.orders(placed_at DESC);
CREATE INDEX idx_order_items_order      ON public.order_items(order_id);
CREATE INDEX idx_status_logs_order      ON public.order_status_logs(order_id);
CREATE INDEX idx_wishlists_user         ON public.wishlists(user_id);
CREATE INDEX idx_reviews_product        ON public.reviews(product_id);
CREATE INDEX idx_reviews_approved       ON public.reviews(is_approved) WHERE is_approved = TRUE;
CREATE INDEX idx_promos_active          ON public.promotions(is_active) WHERE is_active = TRUE;

-- Full-text search
CREATE INDEX idx_products_fts ON public.products
  USING gin(to_tsvector('english',
    name || ' ' || COALESCE(description, '') || ' ' || COALESCE(material, '')
  ));

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;

-- Public reads (catalogue)
CREATE POLICY "public_read_categories"   ON public.categories   FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_products"     ON public.products     FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_variants"     ON public.product_variants FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_images"       ON public.product_images   FOR SELECT USING (TRUE);
CREATE POLICY "public_read_inventory"    ON public.inventory        FOR SELECT USING (TRUE);
CREATE POLICY "public_read_promotions"   ON public.promotions       FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public_read_promo_items"  ON public.promo_products   FOR SELECT USING (TRUE);
CREATE POLICY "public_read_reviews"      ON public.reviews          FOR SELECT USING (is_approved = TRUE);

-- User-owned data
CREATE POLICY "user_read_own_profile"    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_update_own_profile"  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "user_owns_addresses"      ON public.addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_owns_cart"           ON public.cart_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_owns_wishlists"      ON public.wishlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_reads_own_orders"    ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_writes_review"       ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_reads_own_reviews"   ON public.reviews FOR SELECT USING (auth.uid() = user_id OR is_approved = TRUE);

CREATE POLICY "user_reads_own_items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

CREATE POLICY "user_reads_own_logs" ON public.order_status_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_status_logs.order_id AND orders.user_id = auth.uid())
);

CREATE POLICY "user_reads_own_payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid())
);

-- Admin full access (JWT custom claim: user_role = 'admin')
CREATE POLICY "admin_all_profiles"    ON public.profiles   FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');
CREATE POLICY "admin_all_products"    ON public.products   FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');
CREATE POLICY "admin_all_variants"    ON public.product_variants FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');
CREATE POLICY "admin_all_inventory"   ON public.inventory  FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');
CREATE POLICY "admin_all_orders"      ON public.orders     FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');
CREATE POLICY "admin_all_coupons"     ON public.coupons    FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');
CREATE POLICY "admin_all_promotions"  ON public.promotions FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');
CREATE POLICY "admin_all_reviews"     ON public.reviews    FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');

-- ─────────────────────────────────────────────────────────────
-- SUPABASE STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', TRUE,  5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('banner-images',  'banner-images',  TRUE,  10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('user-avatars',   'user-avatars',   FALSE, 2097152,  ARRAY['image/jpeg','image/png','image/webp']),
  ('invoice-pdfs',   'invoice-pdfs',   FALSE, 5242880,  ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage access policies
CREATE POLICY "public_read_product_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "public_read_banner_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'banner-images');

CREATE POLICY "admin_manage_product_images" ON storage.objects
  FOR ALL USING (
    bucket_id IN ('product-images', 'banner-images')
    AND (auth.jwt() ->> 'user_role') = 'admin'
  );

CREATE POLICY "user_read_own_invoices" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoice-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "user_manage_own_avatar" ON storage.objects
  FOR ALL USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- ─────────────────────────────────────────────────────────────
-- REALTIME — enable for key tables
-- ─────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_logs;

-- ─────────────────────────────────────────────────────────────
-- SCHEDULED JOBS (pg_cron)
-- ─────────────────────────────────────────────────────────────
-- Deactivate expired coupons daily at midnight
SELECT cron.schedule(
  'expire-coupons',
  '0 0 * * *',
  $$ UPDATE public.coupons SET is_active = FALSE WHERE expires_at < NOW() AND is_active = TRUE; $$
);

-- Deactivate ended promotions hourly
SELECT cron.schedule(
  'expire-promotions',
  '0 * * * *',
  $$ UPDATE public.promotions SET is_active = FALSE WHERE ends_at < NOW() AND is_active = TRUE; $$
);
