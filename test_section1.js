require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

// Constructing the Supabase URL from the Anon Key's JWT payload if URL is not in .env
// We decode the JWT (second part) to get the 'ref'
let supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl && process.env.SUPABASE_ANON_KEY) {
  try {
    const payloadBase64 = process.env.SUPABASE_ANON_KEY.split('.')[1];
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
    if (payload.ref) {
      supabaseUrl = `https://${payload.ref}.supabase.co`;
      console.log(`Inferred Supabase URL: ${supabaseUrl}`);
    }
  } catch (e) {
    console.error("Could not parse SUPABASE_ANON_KEY to infer URL.");
  }
}

if (!supabaseUrl || !process.env.SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  global: { fetch: fetch },
  realtime: { transport: WebSocket }
});

async function signUpUser(email, password, name, role) {
  console.log(`Signing up ${role}: ${email}...`);
  // 1. Sign up the user via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error(`Error signing up ${role}:`, authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log(`Auth successful. User ID: ${userId}`);

  // 2. Insert into the profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([
      {
        id: userId,
        name: name,
        role: role
      }
    ]);

  if (profileError) {
    console.error(`Error creating profile for ${role}:`, profileError.message);
  } else {
    console.log(`Profile created successfully for ${role} (${name}).`);
  }
}

async function runTests() {
  console.log("--- Starting Section 1 Tests ---");
  // Use unique emails for testing
  const timestamp = Date.now();
  
  await signUpUser(`admin_${timestamp}@test.com`, 'password123', 'Admin User', 'admin');
  await signUpUser(`teacher_${timestamp}@test.com`, 'password123', 'Teacher User', 'teacher');
  await signUpUser(`student_${timestamp}@test.com`, 'password123', 'Student User', 'student');

  console.log("--- Tests Completed ---");
}

runTests();
