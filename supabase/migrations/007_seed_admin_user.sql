-- Seed or update an admin user for Supabase Auth
-- WARNING: This stores credentials in your migrations history. Use only for development or rotate
-- the password immediately after provisioning the user. For production, create the admin user
-- manually from the Supabase Dashboard instead of committing credentials.

DO $$
DECLARE
  v_email TEXT := 'admin@whimsical.local';
  v_password TEXT := 'Achlys2025!';
  v_user_id UUID;
BEGIN
  -- Check if the user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_user_id IS NULL THEN
    -- Create new admin user and confirm email
    PERFORM auth.admin.create_user(
      jsonb_build_object(
        'email', v_email,
        'password', v_password,
        'email_confirm', true,
        'user_metadata', jsonb_build_object('role','admin','name','Admin'),
        'app_metadata', jsonb_build_object('role','admin')
      )
    );
  ELSE
    -- Update existing user: ensure role in metadata and reset password if needed
    PERFORM auth.admin.update_user_by_id(
      v_user_id,
      jsonb_build_object(
        'password', v_password,
        'email_confirm', true,
        'user_metadata', jsonb_build_object('role','admin','name','Admin'),
        'app_metadata', jsonb_build_object('role','admin')
      )
    );
  END IF;
END $$;
