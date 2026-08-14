DO $$
DECLARE
  dummy_id uuid;
BEGIN
  -- 1. Check if the dummy user already exists in auth.users, if not create them
  SELECT id INTO dummy_id FROM auth.users WHERE email = 'dummy@example.com';
  IF dummy_id IS NULL THEN
    dummy_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    VALUES ('00000000-0000-0000-0000-000000000000', dummy_id, 'authenticated', 'authenticated', 'dummy@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  END IF;

  -- 2. Upsert profile for dummy
  INSERT INTO public.profiles (id, name, role)
  VALUES (dummy_id, 'dummy', 'teacher')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- 3. Clean up existing slots/teacher for this user to prevent duplicates if run multiple times
  DELETE FROM public.bookings WHERE slot_id IN (
    SELECT id FROM public.slots WHERE teacher_id IN (SELECT id FROM public.teachers WHERE profile_id = dummy_id)
  );
  DELETE FROM public.slots WHERE teacher_id IN (SELECT id FROM public.teachers WHERE profile_id = dummy_id);
  DELETE FROM public.teachers WHERE profile_id = dummy_id;

  -- 4. Insert teacher record
  INSERT INTO public.teachers (profile_id, qr_code, subject, email, phone)
  VALUES
    (dummy_id, 'qr_dummy', 'Dummy Subject', 'dummy@example.com', '+1-555-000-0000');

  -- 5. Create 20 free slots for the dummy teacher (4 days, 5 slots per day)
  FOR i IN 1..20 LOOP
    INSERT INTO public.slots (teacher_id, date, start_time, end_time, status)
    VALUES (
      (SELECT id FROM public.teachers WHERE email = 'dummy@example.com'),
      CURRENT_DATE + ((i - 1) / 5)::int, -- Spread across 4 days
      ('09:00:00'::time + (((i - 1) % 5) * interval '1 hour')), 
      ('10:00:00'::time + (((i - 1) % 5) * interval '1 hour')),
      'free'
    );
  END LOOP;

END $$;
