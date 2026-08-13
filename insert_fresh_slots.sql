DO $$
DECLARE
  v_teacher_id uuid;
BEGIN
  -- 1. Get the specific teacher ID we are using in the frontend
  SELECT id INTO v_teacher_id FROM teachers WHERE qr_code = 'qr_talha_57' LIMIT 1;
  
  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Teacher qr_talha_57 not found.';
  END IF;

  -- 2. Delete existing bookings for this teacher's slots to avoid foreign key constraints (Optional: uncomment to wipe old data)
  -- DELETE FROM bookings WHERE slot_id IN (SELECT id FROM slots WHERE teacher_id = v_teacher_id);
  
  -- 3. Delete existing slots (Optional: uncomment to wipe old data)
  -- DELETE FROM slots WHERE teacher_id = v_teacher_id;

  -- 4. Insert 5 fresh slots for today and tomorrow
  INSERT INTO slots (teacher_id, date, start_time, end_time, status)
  VALUES
    (v_teacher_id, CURRENT_DATE, '09:00:00', '10:00:00', 'free'),
    (v_teacher_id, CURRENT_DATE, '10:30:00', '11:30:00', 'free'),
    (v_teacher_id, CURRENT_DATE, '13:00:00', '14:00:00', 'free'),
    (v_teacher_id, CURRENT_DATE + INTERVAL '1 day', '09:00:00', '10:00:00', 'free'),
    (v_teacher_id, CURRENT_DATE + INTERVAL '1 day', '14:00:00', '15:00:00', 'free');

END $$;
