-- ============================================================
-- Goodsly — promote a user to admin
-- Run AFTER you've created the user in Supabase Dashboard:
--   Authentication → Users → Add user
--     Email:     admin@goodsly.com  (use whatever you want)
--     Password:  <set one>
--     ☑ Auto Confirm User
--
-- Then paste this script into the SQL editor and replace the email below.
-- ============================================================

DO $$
DECLARE
  v_user_id UUID;
  v_email   TEXT := 'admin@goodsly.store';
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User % not found in auth.users. Create them in Dashboard → Authentication → Users first.', v_email;
  END IF;

  -- Ensure a profile row exists (the on_auth_user_created trigger normally
  -- creates one automatically, but this is idempotent in case it didn't fire).
  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (v_user_id, 'Admin', 'admin', TRUE)
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      is_active = TRUE,
      updated_at = NOW();

  RAISE NOTICE 'Promoted % (id %) to admin.', v_email, v_user_id;
END $$;
