require('dotenv').config();
const fs = require('fs');
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
  console.log("--- Starting Section 3 Tests ---");

  // Fetch the teacher
  const { data: teachers, error } = await supabase.from('teachers').select('*').limit(1);
  if (error || !teachers.length) {
    console.error("No teacher found in database.");
    process.exit(1);
  }

  const teacher = teachers[0];
  console.log(`Using Teacher ID: ${teacher.id}`);
  console.log(`Expected QR Code content: ${teacher.qr_code}`);

  console.log("\n[TEST] Downloading QR code image from API...");
  
  // Call our new API endpoint
  const res = await fetch(`${API_BASE}/teachers/${teacher.id}/qr`);
  
  if (!res.ok) {
    console.error("API Error:", await res.text());
    process.exit(1);
  }

  // Save the PNG image
  const buffer = await res.arrayBuffer();
  fs.writeFileSync('test_qr.png', Buffer.from(buffer));
  
  console.log("✅ Success! The QR code image was saved as 'test_qr.png' in the scanner directory.");
  console.log("Please open 'test_qr.png' and scan it with your phone camera to verify it matches the Expected QR Code content.");
  console.log("--- Section 3 Tests Completed ---");
}

runTests();
