# Goodsly E-Commerce Platform — Claude Code Master Prompt
# Goodsly E-Commerce Platform — Claude Code Master Prompt

## Project overview

You are building a production-grade e-commerce platform inspired by **Goodsly.com** — a premium Indian cotton clothing and bags brand. The store sells bags, pouches, organisers, wellness products, and gifting sets.

**Core brand features to always preserve:**
- Free gift with order (free pouch on ₹2499+ / free tote on ₹4999+) via coupon codes
- COD (Cash on Delivery) support
- Gift packing on every order with personalised message
- Free shipping on all orders
- "Just In" new arrivals section on homepage

---

## Tech stack

| Layer | Technology |
|---|---|
| User storefront | Next.js 14 (App Router), Tail wind CSS v3, Zustand, TanStack Query |
| Admin dashboard | Next.js 14 + Medusa Admin UI (extended), shadcn/ui, Recharts |
| Commerce backend | Medusa v2 (Node.js), custom Express routes for brand-specific logic |
| Database | Supabase (PostgreSQL) — shared instance with Medusa |
| Auth | Supabase Auth (Email+OTP, Google OAuth) |
| Realtime | Supabase Realtime (live order status, admin pipeline) |
| Storage | Supabase Storage (product images, banners, invoices) |
| Payments | Razorpay (online + COD) |
| Shipping | Shiprocket API (AWB, tracking, label) |
| Email | Resend (transactional emails) |
| SMS / OTP | MSG91 or Fast2SMS |
| Deployment | Vercel (Next.js apps) + Railway/Fly.io (Medusa server) |
| CI/CD | GitHub Actions |
| Monitoring | Sentry + Logflare |
| Cache | Upstash Redis (sessions, rate limiting, BullMQ) |

---

## Repository structure

```
/
├── apps/
│   ├── storefront/          # Next.js 14 — customer-facing store
│   ├── admin/               # Next.js 14 — admin + Medusa Admin UI
│   └── backend/             # Medusa v2 server + custom Node.js APIs
├── packages/
│   ├── ui/                  # Shared shadcn/ui components
│   ├── types/               # Shared TypeScript types
│   └── utils/               # Shared utility functions
├── supabase/
│   ├── migrations/          # SQL migration files (numbered)
│   ├── seed.sql             # Dev seed data
│   └── policies.sql         # All RLS policies
├── .github/
│   └── workflows/           # CI/CD pipelines
└── docker-compose.yml       # Local dev environment
```

---

## Database structure (Supabase PostgreSQL)

> Medusa manages its own internal tables via its ORM. The tables below are **custom Supabase tables** that extend Medusa. They live in the same Postgres instance.

### Custom tables

```sql
-- ─────────────────────────────────────────────
-- USERS (mirrors Supabase auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin','staff')),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ADDRESSES
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- CATEGORIES (self-referencing for nested)
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────
CREATE TABLE public.products (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medusa_product_id  TEXT UNIQUE,            -- link to Medusa product
  category_id        UUID REFERENCES public.categories(id),
  name               TEXT NOT NULL,
  slug               TEXT NOT NULL UNIQUE,
  description        TEXT,
  material           TEXT,
  care_instructions  TEXT,
  base_price         NUMERIC(10,2) NOT NULL,
  compare_price      NUMERIC(10,2),          -- strikethrough price for sale badge
  tags               TEXT[],
  is_active          BOOLEAN DEFAULT TRUE,
  is_featured        BOOLEAN DEFAULT FALSE,
  is_just_in         BOOLEAN DEFAULT FALSE,
  is_gift_packable   BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PRODUCT VARIANTS
-- ─────────────────────────────────────────────
CREATE TABLE public.product_variants (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  medusa_variant_id  TEXT UNIQUE,
  sku                TEXT NOT NULL UNIQUE,
  color              TEXT,
  size               TEXT,
  price              NUMERIC(10,2) NOT NULL,
  compare_price      NUMERIC(10,2),
  weight_grams       INT,
  is_active          BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PRODUCT IMAGES
-- ─────────────────────────────────────────────
CREATE TABLE public.product_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id    UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  storage_path  TEXT NOT NULL,              -- Supabase Storage path
  url           TEXT NOT NULL,             -- public CDN URL
  alt_text      TEXT,
  is_primary    BOOLEAN DEFAULT FALSE,
  sort_order    INT DEFAULT 0
);

-- ─────────────────────────────────────────────
-- INVENTORY
-- ─────────────────────────────────────────────
CREATE TABLE public.inventory (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id     UUID NOT NULL UNIQUE REFERENCES public.product_variants(id) ON DELETE CASCADE,
  qty_available  INT NOT NULL DEFAULT 0,
  qty_reserved   INT NOT NULL DEFAULT 0,    -- incremented on order placed
  qty_sold       INT NOT NULL DEFAULT 0,    -- incremented on order delivered
  reorder_level  INT DEFAULT 5,             -- triggers low-stock alert
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- CART ITEMS (server-side persistent cart)
-- ─────────────────────────────────────────────
CREATE TABLE public.cart_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  variant_id    UUID NOT NULL REFERENCES public.product_variants(id),
  quantity      INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  gift_wrap     BOOLEAN DEFAULT FALSE,
  gift_message  TEXT,
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, variant_id)
);

-- ─────────────────────────────────────────────
-- COUPONS
-- ─────────────────────────────────────────────
CREATE TABLE public.coupons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT NOT NULL UNIQUE,
  type              TEXT NOT NULL CHECK (type IN ('percent','flat','free_product')),
  value             NUMERIC(10,2),          -- percent or flat INR amount
  free_product_id   UUID REFERENCES public.products(id),  -- for free_product type
  min_order_value   NUMERIC(10,2) DEFAULT 0,
  max_uses          INT,                    -- NULL = unlimited
  used_count        INT NOT NULL DEFAULT 0,
  is_active         BOOLEAN DEFAULT TRUE,
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- SHIPPING METHODS
-- ─────────────────────────────────────────────
CREATE TABLE public.shipping_methods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  provider        TEXT DEFAULT 'shiprocket',
  base_fee        NUMERIC(10,2) DEFAULT 0,
  free_above      NUMERIC(10,2) DEFAULT 0,  -- 0 = always free
  est_days_min    INT DEFAULT 3,
  est_days_max    INT DEFAULT 7,
  is_active       BOOLEAN DEFAULT TRUE
);

-- ─────────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────────
CREATE TABLE public.orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        TEXT NOT NULL UNIQUE,  -- e.g. AKI-2024-00142
  user_id             UUID NOT NULL REFERENCES public.profiles(id),
  address_id          UUID NOT NULL REFERENCES public.addresses(id),
  coupon_id           UUID REFERENCES public.coupons(id),
  shipping_method_id  UUID REFERENCES public.shipping_methods(id),
  medusa_order_id     TEXT,                  -- Medusa order reference
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN (
                          'pending','confirmed','packed',
                          'shipped','delivered','cancelled','returned'
                        )),
  is_gift             BOOLEAN DEFAULT FALSE,
  gift_message        TEXT,
  cod_requested       BOOLEAN DEFAULT FALSE,
  subtotal            NUMERIC(10,2) NOT NULL,
  discount_amt        NUMERIC(10,2) DEFAULT 0,
  shipping_fee        NUMERIC(10,2) DEFAULT 0,
  total               NUMERIC(10,2) NOT NULL,
  placed_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE public.order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id    UUID NOT NULL REFERENCES public.product_variants(id),
  quantity      INT NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(10,2) NOT NULL,
  total_price   NUMERIC(10,2) NOT NULL,
  gift_wrap     BOOLEAN DEFAULT FALSE
);

-- ─────────────────────────────────────────────
-- ORDER STATUS LOG (append-only audit trail)
-- ─────────────────────────────────────────────
CREATE TABLE public.order_status_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status        TEXT NOT NULL,
  note          TEXT,
  changed_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────
CREATE TABLE public.payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL UNIQUE REFERENCES public.orders(id),
  method          TEXT NOT NULL CHECK (method IN ('online','cod')),
  provider        TEXT,                    -- 'razorpay' or null for cod
  transaction_id  TEXT,                   -- Razorpay payment_id
  razorpay_order_id TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','failed','refunded')),
  amount          NUMERIC(10,2) NOT NULL,
  is_cod          BOOLEAN DEFAULT FALSE,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PROMOTIONS (homepage banners + sale events)
-- ─────────────────────────────────────────────
CREATE TABLE public.promotions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  banner_image_url TEXT,
  badge_text       TEXT,                   -- e.g. "Just In", "Sale", "New"
  link_url         TEXT,
  sort_order       INT DEFAULT 0,
  starts_at        TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PROMO PRODUCTS (products featured in a promo)
-- ─────────────────────────────────────────────
CREATE TABLE public.promo_products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id  UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order    INT DEFAULT 0,
  UNIQUE(promotion_id, product_id)
);

-- ─────────────────────────────────────────────
-- WISHLISTS
-- ─────────────────────────────────────────────
CREATE TABLE public.wishlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ─────────────────────────────────────────────
-- REVIEWS
-- ─────────────────────────────────────────────
CREATE TABLE public.reviews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES public.profiles(id),
  rating                INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title                 TEXT,
  body                  TEXT,
  is_verified_purchase  BOOLEAN DEFAULT FALSE,
  is_approved           BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_products_category     ON public.products(category_id);
CREATE INDEX idx_products_slug         ON public.products(slug);
CREATE INDEX idx_products_is_active    ON public.products(is_active);
CREATE INDEX idx_variants_product      ON public.product_variants(product_id);
CREATE INDEX idx_inventory_variant     ON public.inventory(variant_id);
CREATE INDEX idx_cart_user             ON public.cart_items(user_id);
CREATE INDEX idx_orders_user           ON public.orders(user_id);
CREATE INDEX idx_orders_status         ON public.orders(status);
CREATE INDEX idx_order_items_order     ON public.order_items(order_id);
CREATE INDEX idx_status_logs_order     ON public.order_status_logs(order_id);
CREATE INDEX idx_wishlists_user        ON public.wishlists(user_id);
CREATE INDEX idx_reviews_product       ON public.reviews(product_id);

-- Full-text search on products
CREATE INDEX idx_products_fts ON public.products
  USING gin(to_tsvector('english', name || ' ' || COALESCE(description,'') || ' ' || COALESCE(material,'')));
```

---

### Row Level Security policies

```sql
-- Enable RLS on all custom tables
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory         ENABLE ROW LEVEL SECURITY;

-- Products: public read for active items
CREATE POLICY "public_read_products" ON public.products
  FOR SELECT USING (is_active = TRUE);

-- Categories: public read
CREATE POLICY "public_read_categories" ON public.categories
  FOR SELECT USING (is_active = TRUE);

-- Inventory: public read
CREATE POLICY "public_read_inventory" ON public.inventory
  FOR SELECT USING (TRUE);

-- Profiles: user owns their own profile
CREATE POLICY "user_read_own_profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_update_own_profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Addresses: user owns their own
CREATE POLICY "user_owns_addresses" ON public.addresses
  FOR ALL USING (auth.uid() = user_id);

-- Cart: user owns their own cart
CREATE POLICY "user_owns_cart" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Orders: user sees their own orders
CREATE POLICY "user_reads_own_orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- Order items: readable if user owns the order
CREATE POLICY "user_reads_own_order_items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Order status logs: readable if user owns the order
CREATE POLICY "user_reads_own_status_logs" ON public.order_status_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_status_logs.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Payments: user sees their own
CREATE POLICY "user_reads_own_payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Wishlists: user owns their own
CREATE POLICY "user_owns_wishlists" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id);

-- Reviews: public read for approved, users manage their own
CREATE POLICY "public_read_approved_reviews" ON public.reviews
  FOR SELECT USING (is_approved = TRUE);
CREATE POLICY "user_manages_own_reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin full access via custom JWT claim
CREATE POLICY "admin_full_access_orders" ON public.orders
  FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');
CREATE POLICY "admin_full_access_products" ON public.products
  FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');
CREATE POLICY "admin_full_access_inventory" ON public.inventory
  FOR ALL USING ((auth.jwt() ->> 'user_role') = 'admin');
```

---

### Supabase Storage buckets

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('product-images', 'product-images', TRUE),
  ('banner-images',  'banner-images',  TRUE),
  ('user-avatars',   'user-avatars',   FALSE),
  ('invoice-pdfs',   'invoice-pdfs',   FALSE);

-- Storage policies
CREATE POLICY "public_read_product_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "admin_upload_product_images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND (auth.jwt() ->> 'user_role') = 'admin'
  );

CREATE POLICY "user_read_own_invoices" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoice-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
```

---

## Environment variables

### apps/storefront/.env.local
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### apps/admin/.env.local
```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### apps/backend/.env
```env
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_secret
SHIPROCKET_EMAIL=your@email.com
SHIPROCKET_PASSWORD=your_password
RESEND_API_KEY=re_xxx
MSG91_AUTH_KEY=your_key
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
COOKIE_SECRET=your_cookie_secret
MEDUSA_ADMIN_ONBOARDING_TYPE=default
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:3001
```

---

## Core coding rules for Claude Code

### Always follow these patterns:

**1. Supabase client setup**
```typescript
// lib/supabase/client.ts — browser client (storefront/admin)
import { createBrowserClient } from '@supabase/ssr'
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// lib/supabase/server.ts — server client (API routes, server components)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export const createClient = () => createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { cookies: { get: (n) => cookies().get(n)?.value } }
)

// lib/supabase/admin.ts — service role client (backend only, bypasses RLS)
import { createClient } from '@supabase/supabase-js'
export const adminSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

**2. Medusa storefront SDK**
```typescript
// lib/medusa.ts
import Medusa from '@medusajs/js-sdk'
export const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!,
  auth: { type: 'session' }
})
```

**3. Inventory reservation pattern (atomic, prevents overselling)**
```typescript
// Always use this pattern when placing an order
const { error } = await adminSupabase.rpc('reserve_inventory', {
  p_variant_id: variantId,
  p_quantity: qty
})
// The RPC function checks qty_available - qty_reserved >= requested qty
// and atomically increments qty_reserved
```

**4. Order number generation**
```typescript
// Generate: AKI-YYYY-XXXXX (e.g. AKI-2024-00142)
const orderNumber = `AKI-${new Date().getFullYear()}-${String(count).padStart(5,'0')}`
```

**5. Realtime order tracking (storefront)**
```typescript
// Subscribe to a specific order's status changes
const channel = supabase
  .channel(`order:${orderId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `id=eq.${orderId}`
  }, (payload) => {
    setOrderStatus(payload.new.status)
  })
  .subscribe()
```

**6. Realtime admin pipeline**
```typescript
// Admin: subscribe to ALL new/updated orders
const channel = supabase
  .channel('admin-orders')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders'
  }, (payload) => {
    refreshOrders()
  })
  .subscribe()
```

---

## Storefront — pages to build

```
app/
├── page.tsx                          # Home: hero banner, just-in, categories
├── collections/
│   └── [slug]/page.tsx              # Category listing with filters
├── products/
│   └── [slug]/page.tsx              # Product detail page (PDP)
├── cart/page.tsx                    # Cart page
├── checkout/page.tsx                # Checkout: address + payment
├── order-confirmation/[id]/page.tsx # Post-order confirmation
├── account/
│   ├── page.tsx                     # Account dashboard
│   ├── orders/page.tsx              # Order history
│   ├── orders/[id]/page.tsx         # Order detail + live tracking
│   ├── addresses/page.tsx           # Saved addresses
│   └── wishlist/page.tsx            # Saved wishlist
├── search/page.tsx                  # Search results
└── gifting/page.tsx                 # Gifting collection page
```

### Key storefront components

```
components/
├── layout/
│   ├── PromoBar.tsx          # Scrolling promo text: "FREE WAFFLE POUCH ON ORDERS ABOVE ₹2499"
│   ├── Navbar.tsx            # Logo, nav links, wishlist count, cart count
│   └── Footer.tsx
├── product/
│   ├── ProductCard.tsx       # Image hover swap, price, add-to-cart
│   ├── ProductGallery.tsx    # Main image + thumbnails + zoom
│   ├── VariantSelector.tsx   # Color swatches + size pills
│   ├── GiftWrapToggle.tsx    # Toggle + message input
│   └── StickyAddToCart.tsx  # Fixed bottom bar on mobile
├── cart/
│   ├── CartDrawer.tsx        # Slide-out cart with gift wrap per item
│   └── CouponInput.tsx       # Apply coupon code (CUBE, TOTE, etc.)
├── checkout/
│   ├── AddressForm.tsx       # Saved addresses + new address form
│   ├── PaymentSelector.tsx   # Online (Razorpay) vs COD toggle
│   └── OrderSummary.tsx      # Line items + discount + total
└── order/
    └── OrderTracker.tsx      # Live status: placed → packed → shipped → delivered
```

---

## Admin dashboard — pages to build

```
app/(admin)/
├── dashboard/page.tsx               # Revenue KPIs, live order feed, low stock
├── orders/
│   ├── page.tsx                     # All orders table with filters
│   └── [id]/page.tsx                # Order detail: items, timeline, actions
├── products/
│   ├── page.tsx                     # Product list + search
│   ├── new/page.tsx                 # Create product + variants + images
│   └── [id]/page.tsx                # Edit product
├── inventory/page.tsx               # Variant stock levels + adjust
├── customers/page.tsx               # Customer list + order history
├── coupons/page.tsx                 # Create/manage coupon codes
├── promotions/page.tsx              # Banner scheduler + "Just In" manager
├── reviews/page.tsx                 # Approve/reject reviews
└── settings/
    ├── shipping/page.tsx            # Shipping methods + zones
    └── staff/page.tsx               # Staff accounts + roles
```

### Key admin actions per order

```typescript
type OrderAction =
  | 'confirm'      // pending → confirmed (after payment verified)
  | 'pack'         // confirmed → packed (admin marks packed, applies gift wrap)
  | 'ship'         // packed → shipped (creates Shiprocket AWB)
  | 'deliver'      // shipped → delivered (finalises inventory)
  | 'cancel'       // any → cancelled (refund if paid)
  | 'return'       // delivered → returned
```

---

## Medusa v2 customisations to build

### Custom API routes in apps/backend/src/api/

```
POST   /store/custom/cart/gift-wrap          # Add gift wrap to cart item
POST   /store/custom/coupons/validate        # Validate coupon against cart total
GET    /store/custom/shipping/estimate       # Estimate shipping + COD availability
POST   /store/custom/payments/razorpay/create  # Create Razorpay order
POST   /store/custom/payments/razorpay/verify  # Verify payment signature
POST   /store/custom/webhooks/razorpay       # Razorpay webhook handler
POST   /store/custom/orders/place-cod        # Place COD order directly
POST   /admin/custom/orders/:id/ship         # Create Shiprocket shipment
POST   /admin/custom/orders/:id/status       # Update order status + log
GET    /admin/custom/analytics/revenue       # Revenue dashboard data
```

### Supabase Edge Functions

```
supabase/functions/
├── send-order-email/     # Resend: order confirmation, shipping update
├── send-otp-sms/         # MSG91: OTP for phone login
├── low-stock-alert/      # Email admin when qty_available <= reorder_level
└── expire-coupons/       # pg_cron: deactivate expired coupons daily
```

---

## Gift packing logic (brand-critical feature)

```typescript
// Goodsly charges ₹0 for gift packing (it's their brand promise)
// Logic lives in the checkout flow:

interface GiftPackaging {
  is_gift: boolean
  gift_message?: string        // Max 150 chars
  gift_wrap_per_item: boolean  // Each item individually wrapped?
}

// In order total calculation:
const giftWrapFee = 0  // always free for Goodsly brand

// Admin sees gift icon on order card when is_gift = true
// Packing instructions printed on order slip
```

---

## COD logic

```typescript
// COD order flow:
// 1. User selects COD at checkout
// 2. POST /store/custom/orders/place-cod
// 3. Order status = 'confirmed' immediately (no payment webhook needed)
// 4. payments row: method='cod', is_cod=true, status='pending'
// 5. Payment status updated to 'paid' only after delivery confirmed
// 6. COD surcharge: ₹0 (Goodsly offers free COD)

const isCODAvailable = (orderTotal: number, pincode: string): boolean => {
  // Check Shiprocket COD serviceability for the pincode
  // Return false for international pincodes
  return orderTotal <= 50000  // COD limit ₹50,000
}
```

---

## Free gift coupon logic (e.g. CUBE, TOTE)

```typescript
// When coupon type = 'free_product':
// 1. Validate min_order_value met
// 2. Find free_product_id from coupons table
// 3. Auto-add that product variant (qty=1) to order_items with unit_price=0
// 4. Display as "FREE - Waffle Pouch" in order summary

const applyFreeProductCoupon = async (couponCode: string, cartTotal: number) => {
  const coupon = await getCoupon(couponCode)
  if (cartTotal < coupon.min_order_value) {
    throw new Error(`Add ₹${coupon.min_order_value - cartTotal} more to unlock this offer`)
  }
  return { freeProductId: coupon.free_product_id, discountAmt: 0 }
}
```

---

## TypeScript types (packages/types/src/index.ts)

```typescript
export type OrderStatus =
  'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'returned'

export type UserRole = 'customer' | 'admin' | 'staff'

export type CouponType = 'percent' | 'flat' | 'free_product'

export type PaymentMethod = 'online' | 'cod'

export interface CartItem {
  id: string
  variant_id: string
  quantity: number
  gift_wrap: boolean
  gift_message?: string
  product_variants: {
    sku: string
    color?: string
    size?: string
    price: number
    products: {
      name: string
      slug: string
      product_images: { url: string; is_primary: boolean }[]
    }
  }
}

export interface OrderWithItems {
  id: string
  order_number: string
  status: OrderStatus
  is_gift: boolean
  gift_message?: string
  cod_requested: boolean
  subtotal: number
  discount_amt: number
  shipping_fee: number
  total: number
  placed_at: string
  order_items: {
    id: string
    quantity: number
    unit_price: number
    total_price: number
    product_variants: {
      sku: string
      color?: string
      size?: string
      products: { name: string; slug: string }
    }
  }[]
  addresses: {
    full_name: string
    line1: string
    city: string
    state: string
    pincode: string
  }
  payments: {
    method: PaymentMethod
    status: string
    is_cod: boolean
  }
}
```

---

## What NOT to do

- Never write business logic in Next.js API routes — all order/payment/inventory logic goes in the Medusa backend or custom Node.js routes
- Never use the Supabase `service_role` key in any frontend code — only in backend/server-side
- Never skip the `qty_reserved` check when placing an order — always use the `reserve_inventory` RPC to prevent overselling
- Never hardcode prices — always read from the database
- Never allow unauthenticated users to checkout — require Supabase session
- Never send order confirmation emails directly from Next.js — always via Supabase Edge Function or Medusa subscriber

---

## Getting started — first commands to run

```bash
# 1. Install dependencies
pnpm install

# 2. Start local Supabase
npx supabase start

# 3. Run migrations
npx supabase db push

# 4. Seed database
npx supabase db reset --seed-file supabase/seed.sql

# 5. Start Medusa backend
cd apps/backend && npx medusa develop

# 6. Start storefront
cd apps/storefront && pnpm dev

# 7. Start admin
cd apps/admin && pnpm dev
```
