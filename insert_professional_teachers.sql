DO $$
DECLARE
  prof1_id uuid;
  prof2_id uuid;
  prof3_id uuid;
BEGIN
  ---------------------------------------------------------
  -- PROFESSOR 1: Dr. Alan Turing (Computer Science)
  ---------------------------------------------------------
  SELECT id INTO prof1_id FROM auth.users WHERE email = 'alan.turing@example.com';
  IF prof1_id IS NULL THEN
    prof1_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
    VALUES ('00000000-0000-0000-0000-000000000000', prof1_id, 'authenticated', 'authenticated', 'alan.turing@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}');
  END IF;

  INSERT INTO public.profiles (id, name, role) VALUES (prof1_id, 'Dr. Alan Turing', 'teacher') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
  
  -- Clean up old data for idempotency
  DELETE FROM public.bookings WHERE slot_id IN (SELECT id FROM public.slots WHERE teacher_id IN (SELECT id FROM public.teachers WHERE profile_id = prof1_id));
  DELETE FROM public.slots WHERE teacher_id IN (SELECT id FROM public.teachers WHERE profile_id = prof1_id);
  DELETE FROM public.teachers WHERE profile_id = prof1_id;

  INSERT INTO public.teachers (profile_id, qr_code, subject, email, phone)
  VALUES (prof1_id, 'qr_alan_turing', 'Computer Science & AI (15 Yrs Exp)', 'alan.turing@example.com', '+1-555-101-0001');

  ---------------------------------------------------------
  -- PROFESSOR 2: Prof. Marie Curie (Physics)
  ---------------------------------------------------------
  SELECT id INTO prof2_id FROM auth.users WHERE email = 'marie.curie@example.com';
  IF prof2_id IS NULL THEN
    prof2_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
    VALUES ('00000000-0000-0000-0000-000000000000', prof2_id, 'authenticated', 'authenticated', 'marie.curie@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}');
  END IF;

  INSERT INTO public.profiles (id, name, role) VALUES (prof2_id, 'Prof. Marie Curie', 'teacher') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
  
  DELETE FROM public.bookings WHERE slot_id IN (SELECT id FROM public.slots WHERE teacher_id IN (SELECT id FROM public.teachers WHERE profile_id = prof2_id));
  DELETE FROM public.slots WHERE teacher_id IN (SELECT id FROM public.teachers WHERE profile_id = prof2_id);
  DELETE FROM public.teachers WHERE profile_id = prof2_id;

  INSERT INTO public.teachers (profile_id, qr_code, subject, email, phone)
  VALUES (prof2_id, 'qr_marie_curie', 'Quantum Physics (20 Yrs Exp)', 'marie.curie@example.com', '+1-555-202-0002');

  ---------------------------------------------------------
  -- PROFESSOR 3: Sir Isaac Newton (Mathematics)
  ---------------------------------------------------------
  SELECT id INTO prof3_id FROM auth.users WHERE email = 'isaac.newton@example.com';
  IF prof3_id IS NULL THEN
    prof3_id := gen_random_uuid();
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
    VALUES ('00000000-0000-0000-0000-000000000000', prof3_id, 'authenticated', 'authenticated', 'isaac.newton@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}');
  END IF;

  INSERT INTO public.profiles (id, name, role) VALUES (prof3_id, 'Sir Isaac Newton', 'teacher') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
  
  DELETE FROM public.bookings WHERE slot_id IN (SELECT id FROM public.slots WHERE teacher_id IN (SELECT id FROM public.teachers WHERE profile_id = prof3_id));
  DELETE FROM public.slots WHERE teacher_id IN (SELECT id FROM public.teachers WHERE profile_id = prof3_id);
  DELETE FROM public.teachers WHERE profile_id = prof3_id;

  INSERT INTO public.teachers (profile_id, qr_code, subject, email, phone)
  VALUES (prof3_id, 'qr_isaac_newton', 'Calculus & Mechanics (12 Yrs Exp)', 'isaac.newton@example.com', '+1-555-303-0003');

  ---------------------------------------------------------
  -- GENERATE SLOTS FOR ALL 3 PROFESSORS
  ---------------------------------------------------------
  
  -- Slots for Dr. Alan Turing (Morning / Technical sessions)
  FOR i IN 1..10 LOOP
    INSERT INTO public.slots (teacher_id, date, start_time, end_time, status)
    VALUES (
      (SELECT id FROM public.teachers WHERE email = 'alan.turing@example.com'),
      CURRENT_DATE + ((i - 1) / 3)::int, 
      ('08:00:00'::time + (((i - 1) % 3) * interval '2 hours')), -- 8am, 10am, 12pm 
      ('10:00:00'::time + (((i - 1) % 3) * interval '2 hours')),
      'free'
    );
  END LOOP;

  -- Slots for Prof. Marie Curie (Afternoon / Lab sessions)
  FOR i IN 1..12 LOOP
    INSERT INTO public.slots (teacher_id, date, start_time, end_time, status)
    VALUES (
      (SELECT id FROM public.teachers WHERE email = 'marie.curie@example.com'),
      CURRENT_DATE + ((i - 1) / 4)::int, 
      ('13:00:00'::time + (((i - 1) % 4) * interval '1.5 hours')), -- 1:00pm, 2:30pm, 4:00pm, 5:30pm
      ('14:30:00'::time + (((i - 1) % 4) * interval '1.5 hours')),
      'free'
    );
  END LOOP;

  -- Slots for Sir Isaac Newton (Mixed / Office Hours)
  FOR i IN 1..8 LOOP
    INSERT INTO public.slots (teacher_id, date, start_time, end_time, status)
    VALUES (
      (SELECT id FROM public.teachers WHERE email = 'isaac.newton@example.com'),
      CURRENT_DATE + ((i - 1) / 2)::int, 
      ('11:00:00'::time + (((i - 1) % 2) * interval '4 hours')), -- 11am, 3pm
      ('12:00:00'::time + (((i - 1) % 2) * interval '4 hours')),
      'free'
    );
  END LOOP;

END $$;
