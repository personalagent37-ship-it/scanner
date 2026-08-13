require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

let supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl && process.env.SUPABASE_ANON_KEY) {
  try {
    const payload = JSON.parse(Buffer.from(process.env.SUPABASE_ANON_KEY.split('.')[1], 'base64').toString('utf8'));
    if (payload.ref) supabaseUrl = `https://${payload.ref}.supabase.co`;
  } catch (e) {}
}

const supabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket }
});

const API_BASE = 'http://localhost:3000/api';

async function runTests() {
  console.log("--- Starting Section 2 Tests ---");
  
  // 1. Fetch the dummy teacher from the database
  console.log("[TEST] Fetching a dummy teacher for Section 2...");
  const { data: teachers, error: fetchError } = await supabase
    .from('teachers')
    .select('*')
    .limit(1);

  if (fetchError) {
    console.error("Supabase Error fetching teacher:", fetchError);
    process.exit(1);
  }

  if (!teachers || teachers.length === 0) {
    console.error("No teacher found in the database! It seems the 'disable row level security' SQL didn't run properly in your dashboard, OR the insert script failed.");
    process.exit(1);
  }

  const teacherId = teachers[0].id;
  console.log(`Using Teacher ID: ${teacherId}`);

  // 2. Add 3 free slots
  console.log("\n[TEST] Adding 3 free slots...");
  const slotsToCreate = [
    { teacher_id: teacherId, date: '2026-09-01', start_time: '09:00:00', end_time: '10:00:00' },
    { teacher_id: teacherId, date: '2026-09-01', start_time: '10:00:00', end_time: '11:00:00' },
    { teacher_id: teacherId, date: '2026-09-02', start_time: '14:00:00', end_time: '15:00:00' }
  ];

  let createdSlotIds = [];
  for (const slot of slotsToCreate) {
    const res = await fetch(`${API_BASE}/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slot)
    });
    const json = await res.json();
    console.log(`POST /api/slots Response:`, json);
    if (json.slot) createdSlotIds.push(json.slot.id);
  }

  // 3. List the teacher's slots
  console.log("\n[TEST] Listing teacher's slots...");
  const listRes = await fetch(`${API_BASE}/slots/${teacherId}`);
  const listJson = await listRes.json();
  console.log(`GET /api/slots/${teacherId} Response:`, JSON.stringify(listJson, null, 2));

  // 4. Delete one slot
  if (createdSlotIds.length > 0) {
    const slotToDelete = createdSlotIds[0];
    console.log(`\n[TEST] Deleting slot ${slotToDelete}...`);
    const delRes = await fetch(`${API_BASE}/slots/${slotToDelete}`, { method: 'DELETE' });
    const delJson = await delRes.json();
    console.log(`DELETE /api/slots/${slotToDelete} Response:`, delJson);
  }

  console.log("\n--- Section 2 Tests Completed ---");
}

runTests();
