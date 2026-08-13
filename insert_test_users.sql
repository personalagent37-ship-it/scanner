-- This script creates 3 dummy users directly in the database, bypassing Auth rate limits
DO $$
DECLARE
  admin_id uuid := gen_random_uuid();
  teacher_id uuid := gen_random_uuid();
  student_id uuid := gen_random_uuid();
BEGIN
  -- 1. Insert into auth.users (Bypassing rate limits & email validation)
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES
    ('00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated', 'admin_test@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', teacher_id, 'authenticated', 'authenticated', 'teacher_test@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', student_id, 'authenticated', 'authenticated', 'student_test@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

  -- 2. Insert into our profiles table
  INSERT INTO public.profiles (id, name, role)
  VALUES
    (admin_id, 'Admin User', 'admin'),
    (teacher_id, 'Teacher User', 'teacher'),
    (student_id, 'Student User', 'student');

  -- 3. Also create a teacher record for the teacher user so they can have slots later
  INSERT INTO public.teachers (profile_id, qr_code, subject)
  VALUES
    (teacher_id, 'qr_teacher_test_123', 'English 101');

END $$;
