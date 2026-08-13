# Build prompt: Faculty QR Booking System (for coding agent)

Paste everything below into your coding agent (Claude Code, Cursor, etc.) as the starting instruction.

---

## ROLE

You are building a QR-code based faculty slot booking system for an English institute.
A teacher sets free time slots. A student scans the teacher's QR code, sees free slots,
and books one. The teacher and student both get an email notification via SMTP.

## HARD RULES — FOLLOW EXACTLY

1. **Work in sections, in order.** Do not start Section 2 until Section 1 is fully built,
   tested, and I have explicitly said "yes, continue" or "approved."
2. **After finishing each section**, do all of the following before stopping:
   - Show me exactly what you built (files created/changed).
   - Run it / test it yourself (start the server, hit the API, check the database row, etc.)
     and show me the actual output/result — not just "this should work."
   - Tell me clearly: "Section X is complete and tested. Ready for Section Y?"
   - Then **stop and wait** for my confirmation. Do not proceed on your own.
3. **If anything is ambiguous, ask me** instead of guessing or assuming.
4. **No skipping steps, no combining sections** to save time.
5. **Keep the code simple and beginner-readable** — this is a learning project, not a
   production-scale system. Avoid unnecessary libraries, patterns, or abstractions.
6. If a section fails a test, **fix it and re-test before reporting it as done** — never
   report a section as complete if the test failed.

## TECH STACK (use exactly this)

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS |
| Backend | Node.js + Express |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (email/password) |
| QR generation | `qrcode` (npm) |
| QR scanning | `html5-qrcode` (npm) |
| Email | Nodemailer (SMTP) |
| Dashboard theme | Clean white theme — white background, dark text, one accent color (teal or blue), simple sidebar + top nav layout, no dark mode needed for v1 |

Do not substitute any of these without asking me first.

## DATABASE SCHEMA (Supabase / Postgres)

Use these 4 tables. Ask me for my Supabase project URL and anon/service keys before starting
Section 1 — do not invent placeholder credentials.

```sql
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
```

Note the `unique` constraint on `bookings.slot_id` — this is what prevents double booking
at the database level. Use it together with a transaction check in the API, not instead of it.

## SECTIONS — BUILD IN THIS ORDER

### Section 1: Supabase setup + schema + auth
- Create the Supabase project connection (using credentials I provide).
- Run the schema above.
- Build basic signup/login for admin, teacher, student roles using Supabase Auth.
- **Test:** create one user of each role, confirm rows appear correctly in `profiles`
  table with the right role. Show me screenshots or terminal output.
- Stop and ask before continuing.

### Section 2: Backend API — teacher availability
- Express server connected to Supabase.
- Endpoints: add a free slot, list a teacher's slots, delete a slot.
- **Test:** use curl/Postman to add 3 slots for a test teacher, list them back, delete one.
  Show me the actual request/response output.
- Stop and ask before continuing.

### Section 3: QR generation
- Generate a unique QR code per teacher (encodes only `teacher.qr_code`, no personal data).
- Endpoint or admin page to view/download a teacher's QR image.
- **Test:** generate a QR for the test teacher, decode it manually (any QR reader) and
  confirm it returns the correct teacher ID.
- Stop and ask before continuing.

### Section 4: QR scanning + slot display (frontend)
- Build the scan page using `html5-qrcode`.
- After scanning, call the backend, fetch that teacher's free slots, display them.
- **Test:** scan the Section 3 QR code on a real device/browser, confirm the correct
  slots appear.
- Stop and ask before continuing.

### Section 5: Booking logic
- Endpoint: student books a slot.
- Must use a database transaction / conditional update so two students cannot book the
  same slot. If already booked, return a clear error.
- **Test:** try booking the same slot twice quickly (simulate a race) and confirm the
  second attempt is correctly rejected.
- Stop and ask before continuing.

### Section 6: SMTP email notifications
- Configure Nodemailer with SMTP (ask me for SMTP credentials — do not invent them).
- On successful booking, send an email to the teacher and a confirmation to the student.
- Update `bookings.email_sent` after a successful send.
- **Test:** make a real booking, confirm both emails actually arrive, show me proof
  (log output confirming send success).
- Stop and ask before continuing.

### Section 7: Dashboard (white theme)
- Build 3 views:
  - **Admin dashboard** — manage teachers, view all bookings.
  - **Teacher dashboard** — view/add/delete own slots, view own bookings.
  - **Student dashboard** — scan QR, book, view own bookings.
- White background, dark text, single accent color, sidebar navigation, responsive layout.
- **Test:** walk through the full flow in the UI — teacher adds a slot, student scans and
  books it, both dashboards reflect the update, email arrives.
- Stop and ask before continuing.

### Section 8: Final end-to-end test
- Run the complete flow start to finish with fresh test data.
- Summarize what was built, what still needs polishing, and any known limitations.

## BEFORE YOU START

Ask me for:
1. My Supabase project URL and API keys (anon + service role).
2. SMTP credentials (host, port, email, app password).
3. Confirmation of the accent color for the white theme dashboard.

Then begin Section 1 only.
