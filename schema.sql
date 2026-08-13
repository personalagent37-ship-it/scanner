-- users handled by Supabase Auth (auth.users) + this profile table
create table profiles (
  id uuid references auth.users primary key,
  name text not null,
  role text not null check (role in ('admin','teacher','student')),
  created_at timestamp default now()
);

create table teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  qr_code text unique not null,
  subject text,
  created_at timestamp default now()
);

create table slots (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id),
  date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'free' check (status in ('free','booked')),
  created_at timestamp default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid references slots(id) unique,
  student_id uuid references profiles(id),
  booked_at timestamp default now(),
  email_sent boolean default false
);
