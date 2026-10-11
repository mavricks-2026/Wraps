-- ============================================================
-- Goodsly — SEED DATA (development only)
-- Run via: npx supabase db reset --seed-file supabase/seed.sql
-- All IDs auto-generated; FKs wired by slug/code lookups.
-- ============================================================

-- ─────────────────────────────────────────────
-- Categories (matching Goodsly.com nav)
-- ─────────────────────────────────────────────
INSERT INTO public.categories (name, slug, sort_order, is_active) VALUES
  ('Bags',        'bags',        1, TRUE),
  ('Organisers',  'organisers',  2, TRUE),
  ('Wellness',    'wellness',    3, TRUE),
  ('Bath & Spa',  'bath-spa',    4, TRUE),
  ('Home',        'home',        5, TRUE),
  ('Stationery',  'stationery',  6, TRUE),
  ('Basics',      'basics',      7, TRUE),
  ('Gifting',     'gifting',     8, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────
-- Coupons (Goodsly's real promo codes)
-- Free-product FKs filled in after products are inserted.
-- ─────────────────────────────────────────────
INSERT INTO public.coupons (code, description, type, value, min_order_value, is_active) VALUES
  ('CUBE',    'Free Waffle Pouch on orders above ₹2499', 'free_product', NULL, 2499, TRUE),
  ('TOTE',    'Free Waffle Tote on orders above ₹4999',  'free_product', NULL, 4999, TRUE),
  ('WELCOME', 'Welcome 10% off first order',              'percent',      10,   0,    TRUE),
  ('FLAT100', '₹100 off on orders above ₹999',           'flat',         100,  999,  TRUE)
ON CONFLICT (code) DO NOTHING;

-- ─────────────────────────────────────────────
-- Sample products (Bags category)
-- ─────────────────────────────────────────────
DO $$
DECLARE
  v_cat_bags        UUID;
  v_cat_organisers  UUID;
  v_cat_gifting     UUID;
  v_prod_tote       UUID;
  v_prod_pouch      UUID;
  v_prod_organiser  UUID;
  v_var_tote_olive  UUID;
  v_var_tote_black  UUID;
  v_var_tote_cream  UUID;
  v_var_pouch_natural UUID;
  v_var_pouch_blush UUID;
  v_var_org_olive   UUID;
BEGIN
  SELECT id INTO v_cat_bags       FROM public.categories WHERE slug = 'bags';
  SELECT id INTO v_cat_organisers FROM public.categories WHERE slug = 'organisers';
  SELECT id INTO v_cat_gifting    FROM public.categories WHERE slug = 'gifting';

  -- Crinkle Outline Tote Bag
  INSERT INTO public.products (
    category_id, name, slug, description, material, care_instructions,
    base_price, is_active, is_just_in, is_featured, is_gift_packable
  ) VALUES (
    v_cat_bags,
    'Crinkle Outline Tote Bag',
    'crinkle-outline-tote-bag',
    'A lightweight, crinkle-textured tote with reinforced handles. Roomy enough for everyday essentials, structured enough to look polished.',
    'Recycled Polyester',
    'Spot clean only. Air dry. Do not bleach.',
    2399.00, TRUE, TRUE, TRUE, TRUE
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_prod_tote;

  INSERT INTO public.product_variants (product_id, sku, color, price, weight_grams, is_active) VALUES
    (v_prod_tote, 'AKI-TOTE-OLV-001', 'Olive', 2399.00, 320, TRUE)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price
  RETURNING id INTO v_var_tote_olive;

  INSERT INTO public.product_variants (product_id, sku, color, price, weight_grams, is_active) VALUES
    (v_prod_tote, 'AKI-TOTE-BLK-001', 'Black', 2399.00, 320, TRUE)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price
  RETURNING id INTO v_var_tote_black;

  INSERT INTO public.product_variants (product_id, sku, color, price, weight_grams, is_active) VALUES
    (v_prod_tote, 'AKI-TOTE-CRM-001', 'Cream', 2399.00, 320, TRUE)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price
  RETURNING id INTO v_var_tote_cream;

  INSERT INTO public.inventory (variant_id, qty_available, reorder_level) VALUES
    (v_var_tote_olive, 50, 5),
    (v_var_tote_black, 80, 5),
    (v_var_tote_cream, 30, 5)
  ON CONFLICT (variant_id) DO NOTHING;

  -- Waffle Pouch (the CUBE coupon free-product target)
  INSERT INTO public.products (
    category_id, name, slug, description, material,
    base_price, is_active, is_just_in, is_gift_packable
  ) VALUES (
    v_cat_organisers,
    'Waffle Pouch',
    'waffle-pouch',
    'A soft, waffle-textured cotton pouch. Perfect for makeup, cables, or small daily essentials.',
    '100% Cotton',
    599.00, TRUE, TRUE, TRUE
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_prod_pouch;

  INSERT INTO public.product_variants (product_id, sku, color, price, weight_grams, is_active) VALUES
    (v_prod_pouch, 'AKI-POUCH-NAT-001', 'Natural', 599.00, 80, TRUE)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price
  RETURNING id INTO v_var_pouch_natural;

  INSERT INTO public.product_variants (product_id, sku, color, price, weight_grams, is_active) VALUES
    (v_prod_pouch, 'AKI-POUCH-BLS-001', 'Blush', 599.00, 80, TRUE)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price
  RETURNING id INTO v_var_pouch_blush;

  INSERT INTO public.inventory (variant_id, qty_available, reorder_level) VALUES
    (v_var_pouch_natural, 200, 10),
    (v_var_pouch_blush, 150, 10)
  ON CONFLICT (variant_id) DO NOTHING;

  -- Travel Organiser
  INSERT INTO public.products (
    category_id, name, slug, description, material,
    base_price, compare_price, is_active, is_featured, is_gift_packable
  ) VALUES (
    v_cat_organisers,
    'Travel Organiser',
    'travel-organiser',
    'A compartmented travel organiser for cables, chargers, and toiletries. Keeps your bag tidy.',
    'Recycled Canvas',
    1799.00, 2299.00, TRUE, TRUE, TRUE
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_prod_organiser;

  INSERT INTO public.product_variants (product_id, sku, color, price, compare_price, weight_grams, is_active) VALUES
    (v_prod_organiser, 'AKI-ORG-OLV-001', 'Olive', 1799.00, 2299.00, 250, TRUE)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price
  RETURNING id INTO v_var_org_olive;

  INSERT INTO public.inventory (variant_id, qty_available, reorder_level) VALUES
    (v_var_org_olive, 40, 5)
  ON CONFLICT (variant_id) DO NOTHING;

  -- Wire CUBE coupon → Waffle Pouch as the free product
  UPDATE public.coupons SET free_product_id = v_prod_pouch WHERE code = 'CUBE';
  -- TOTE coupon → Crinkle Tote
  UPDATE public.coupons SET free_product_id = v_prod_tote  WHERE code = 'TOTE';

  -- Homepage promotions
  INSERT INTO public.promotions (title, badge_text, sort_order, is_active) VALUES
    ('Just In',    'Just In', 1, TRUE),
    ('Best Sellers', 'Popular', 2, TRUE)
  ON CONFLICT DO NOTHING;
END $$;
