require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

let supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl && process.env.SUPABASE_ANON_KEY) {
  try {
    const payloadBase64 = process.env.SUPABASE_ANON_KEY.split('.')[1];
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
    if (payload.ref) {
      supabaseUrl = `https://${payload.ref}.supabase.co`;
    }
  } catch (e) {}
}

const WebSocket = require('ws');
const supabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket }
});

async function resetSlots() {
  console.log("Restoring all booked slots to 'free' in Supabase...");
  const { error } = await supabase.from('slots').update({ status: 'free' }).eq('status', 'booked');
  
  if (error) {
    console.error("❌ Error restoring slots:", error);
  } else {
    console.log("✅ All slots successfully restored! You can now test the app again.");
  }
}

resetSlots();
