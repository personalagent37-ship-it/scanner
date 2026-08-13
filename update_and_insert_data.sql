ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS phone text;

-- Update the existing test teacher just in case
UPDATE public.teachers SET email = 'teacher_test@example.com', phone = '+1-000-0000' WHERE email IS NULL;

DO $$
DECLARE
  teacher1_id uuid;
  teacher2_id uuid;
BEGIN
  -- 1. Check if teacher 1 exists in auth.users, if not create
  SELECT id INTO teacher1_id FROM auth.users WHERE email = 'talharafhe57@gmail.com';
  IF teacher1_id IS NULL THEN
    teacher1_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    VALUES ('00000000-0000-0000-0000-000000000000', teacher1_id, 'authenticated', 'authenticated', 'talharafhe57@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  END IF;

  -- 2. Check if teacher 2 exists in auth.users, if not create
  SELECT id INTO teacher2_id FROM auth.users WHERE email = 'personalagnet57@gmail.com';
  IF teacher2_id IS NULL THEN
    teacher2_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    VALUES ('00000000-0000-0000-0000-000000000000', teacher2_id, 'authenticated', 'authenticated', 'personalagnet57@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  END IF;

  -- 3. Upsert profiles
  INSERT INTO public.profiles (id, name, role)
  VALUES (teacher1_id, 'Prof. Talha Rafhe', 'teacher')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO public.profiles (id, name, role)
  VALUES (teacher2_id, 'Prof. Personal Agent', 'teacher')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- 4. Clean up existing slots/teachers for these users to prevent duplicates if run multiple times
  -- First, delete any bookings that depend on these slots
  DELETE FROM public.bookings WHERE slot_id IN (
    SELECT id FROM public.slots WHERE teacher_id IN (SELECT id FROM public.teachers WHERE profile_id IN (teacher1_id, teacher2_id))
  );
  -- Then delete the slots
  DELETE FROM public.slots WHERE teacher_id IN (SELECT id FROM public.teachers WHERE profile_id IN (teacher1_id, teacher2_id));
  -- Finally delete the teachers
  DELETE FROM public.teachers WHERE profile_id IN (teacher1_id, teacher2_id);

  -- 5. Insert teachers
  INSERT INTO public.teachers (profile_id, qr_code, subject, email, phone)
  VALUES
    (teacher1_id, 'qr_talha_57', 'Computer Science', 'talharafhe57@gmail.com', '+1-555-987-6543'),
    (teacher2_id, 'qr_agent_57', 'Artificial Intelligence', 'personalagnet57@gmail.com', '+1-555-123-4567');

  -- 6. Create MORE free slots for Prof. Talha
  INSERT INTO public.slots (teacher_id, date, start_time, end_time, status)
  VALUES
    ((SELECT id FROM public.teachers WHERE email = 'talharafhe57@gmail.com'), CURRENT_DATE + interval '1 day', '09:00:00', '10:00:00', 'free'),
    ((SELECT id FROM public.teachers WHERE email = 'talharafhe57@gmail.com'), CURRENT_DATE + interval '1 day', '10:30:00', '11:30:00', 'free'),
    ((SELECT id FROM public.teachers WHERE email = 'talharafhe57@gmail.com'), CURRENT_DATE + interval '1 day', '13:00:00', '14:00:00', 'free'),
    ((SELECT id FROM public.teachers WHERE email = 'talharafhe57@gmail.com'), CURRENT_DATE + interval '2 days', '09:00:00', '10:30:00', 'free'),
    ((SELECT id FROM public.teachers WHERE email = 'talharafhe57@gmail.com'), CURRENT_DATE + interval '2 days', '11:00:00', '12:00:00', 'free'),
    ((SELECT id FROM public.teachers WHERE email = 'talharafhe57@gmail.com'), CURRENT_DATE + interval '2 days', '14:00:00', '15:00:00', 'free'),
    ((SELECT id FROM public.teachers WHERE email = 'talharafhe57@gmail.com'), CURRENT_DATE + interval '3 days', '15:30:00', '16:30:00', 'free');

  -- 7. Create MORE free slots for Prof. Agent
  INSERT INTO public.slots (teacher_id, date, start_time, end_time, status)
  VALUES
    ((SELECT id FROM public.teachers WHERE email = 'personalagnet57@gmail.com'), CURRENT_DATE + interval '1 day', '11:00:00', '12:00:00', 'free'),
    ((SELECT id FROM public.teachers WHERE email = 'personalagnet57@gmail.com'), CURRENT_DATE + interval '1 day', '13:30:00', '14:30:00', 'free'),
    ((SELECT id FROM public.teachers WHERE email = 'personalagnet57@gmail.com'), CURRENT_DATE + interval '2 days', '10:00:00', '11:30:00', 'free'),
    ((SELECT id FROM public.teachers WHERE email = 'personalagnet57@gmail.com'), CURRENT_DATE + interval '2 days', '15:00:00', '16:00:00', 'free'),
    ((SELECT id FROM public.teachers WHERE email = 'personalagnet57@gmail.com'), CURRENT_DATE + interval '3 days', '09:00:00', '10:00:00', 'free'),
    ((SELECT id FROM public.teachers WHERE email = 'personalagnet57@gmail.com'), CURRENT_DATE + interval '3 days', '11:30:00', '13:00:00', 'free');

END $$;
