DO $$
DECLARE
  v_teacher_id uuid;
BEGIN
  -- We are targeting the Alan Turing profile which is currently hardcoded in your frontend
  SELECT id INTO v_teacher_id FROM teachers WHERE qr_code = 'qr_alan_turing' LIMIT 1;
  
  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Teacher qr_alan_turing not found. Make sure the professional teachers script was run.';
  END IF;

  -- Insert a large batch of fresh slots spanning the next 5 days
  INSERT INTO slots (teacher_id, date, start_time, end_time, status)
  VALUES
    -- TODAY
    (v_teacher_id, CURRENT_DATE, '09:00:00', '10:00:00', 'free'),
    (v_teacher_id, CURRENT_DATE, '10:15:00', '11:15:00', 'free'),
    (v_teacher_id, CURRENT_DATE, '11:30:00', '12:30:00', 'free'),
    (v_teacher_id, CURRENT_DATE, '13:00:00', '14:00:00', 'free'),
    (v_teacher_id, CURRENT_DATE, '14:30:00', '15:30:00', 'free'),
    (v_teacher_id, CURRENT_DATE, '16:00:00', '17:00:00', 'free'),
    
    -- TOMORROW
    (v_teacher_id, CURRENT_DATE + INTERVAL '1 day', '09:00:00', '10:00:00', 'free'),
    (v_teacher_id, CURRENT_DATE + INTERVAL '1 day', '10:15:00', '11:15:00', 'free'),
    (v_teacher_id, CURRENT_DATE + INTERVAL '1 day', '13:00:00', '14:00:00', 'free'),
    (v_teacher_id, CURRENT_DATE + INTERVAL '1 day', '15:00:00', '16:00:00', 'free'),
    
    -- DAY 3
    (v_teacher_id, CURRENT_DATE + INTERVAL '2 days', '08:00:00', '09:00:00', 'free'),
    (v_teacher_id, CURRENT_DATE + INTERVAL '2 days', '09:15:00', '10:15:00', 'free'),
    (v_teacher_id, CURRENT_DATE + INTERVAL '2 days', '11:00:00', '12:00:00', 'free'),
    (v_teacher_id, CURRENT_DATE + INTERVAL '2 days', '14:00:00', '15:00:00', 'free'),
    (v_teacher_id, CURRENT_DATE + INTERVAL '2 days', '16:30:00', '17:30:00', 'free'),

    -- DAY 4
    (v_teacher_id, CURRENT_DATE + INTERVAL '3 days', '09:00:00', '10:00:00', 'free'),
    (v_teacher_id, CURRENT_DATE + INTERVAL '3 days', '10:30:00', '11:30:00', 'free'),
    (v_teacher_id, CURRENT_DATE + INTERVAL '3 days', '13:00:00', '14:00:00', 'free'),
    (v_teacher_id, CURRENT_DATE + INTERVAL '3 days', '15:30:00', '16:30:00', 'free'),

    -- DAY 5
    (v_teacher_id, CURRENT_DATE + INTERVAL '4 days', '10:00:00', '11:00:00', 'free'),
    (v_teacher_id, CURRENT_DATE + INTERVAL '4 days', '12:00:00', '13:00:00', 'free'),
    (v_teacher_id, CURRENT_DATE + INTERVAL '4 days', '14:00:00', '15:00:00', 'free'),
    
    -- DAY 6
    (v_teacher_id, CURRENT_DATE + INTERVAL '5 days', '09:00:00', '10:00:00', 'free'),
    (v_teacher_id, CURRENT_DATE + INTERVAL '5 days', '11:00:00', '12:00:00', 'free'),
    (v_teacher_id, CURRENT_DATE + INTERVAL '5 days', '13:30:00', '14:30:00', 'free'),
    (v_teacher_id, CURRENT_DATE + INTERVAL '5 days', '16:00:00', '17:00:00', 'free');
END $$;
