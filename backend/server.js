require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const app = express();
app.use(cors());
app.use(express.json());

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

const supabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket }
});

// 1. ADD a free slot
app.post('/api/slots', async (req, res) => {
  const { teacher_id, date, start_time, end_time } = req.body;
  if (!teacher_id || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabase
    .from('slots')
    .insert([{ teacher_id, date, start_time, end_time, status: 'free' }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Slot created successfully', slot: data[0] });
});

// 2. LIST a teacher's slots
app.get('/api/slots/:teacher_id', async (req, res) => {
  const { teacher_id } = req.params;
  const { data, error } = await supabase
    .from('slots')
    .select('*')
    .eq('teacher_id', teacher_id)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ slots: data });
});

// 3. DELETE a slot
app.delete('/api/slots/:slot_id', async (req, res) => {
  const { slot_id } = req.params;
  const { error } = await supabase
    .from('slots')
    .delete()
    .eq('id', slot_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Slot deleted successfully' });
});

// 4. GENERATE QR Code for a teacher
const QRCode = require('qrcode');

app.get('/api/teachers/:teacher_id/qr', async (req, res) => {
  const { teacher_id } = req.params;
  
  const { data: teacher, error } = await supabase
    .from('teachers')
    .select('qr_code')
    .eq('id', teacher_id)
    .single();

  if (error || !teacher) {
    return res.status(404).json({ error: 'Teacher not found' });
  }

  try {
    // Generate QR code as a PNG buffer for the full booking URL
    const frontendUrl = process.env.FRONTEND_URL || 'https://teal-truffle-1399ec.netlify.app';
    const qrUrl = `${frontendUrl}/book/${teacher.qr_code}`;
    
    const qrBuffer = await QRCode.toBuffer(qrUrl);
    res.type('image/png');
    res.send(qrBuffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// 5. GET teacher by QR Code string
app.get('/api/teachers/by-qr/:qr_code', async (req, res) => {
  const { qr_code } = req.params;
  const { data: teacher, error } = await supabase
    .from('teachers')
    .select('id, subject, email, phone, profiles(name)')
    .eq('qr_code', qr_code)
    .single();

  if (error || !teacher) return res.status(404).json({ error: 'Teacher not found' });
  res.json({ teacher });
});

// 6. BOOK a slot and send email (Sections 5 & 6)
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_ADDRESS,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

app.post('/api/bookings', async (req, res) => {
  const { slot_id, student_email, student_name } = req.body;
  
  if (!slot_id || !student_email || !student_name) {
    return res.status(400).json({ error: 'Missing slot_id, student_email, or student_name' });
  }

  // 1. Fetch the slot to ensure it's free and get teacher details
  const { data: slot, error: slotError } = await supabase
    .from('slots')
    .select('*, teachers(email, profiles(name))')
    .eq('id', slot_id)
    .single();

  if (slotError || !slot) return res.status(404).json({ error: 'Slot not found' });
  if (slot.status !== 'free') return res.status(400).json({ error: 'Slot is already booked!' });

  // 2. Fetch a dummy student ID to satisfy the foreign key (for testing)
  const { data: student } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'student')
    .limit(1)
    .single();
    
  if (!student) return res.status(500).json({ error: 'No dummy student found in DB for testing' });

  // 3. Mark slot as booked
  const { error: updateError } = await supabase
    .from('slots')
    .update({ status: 'booked' })
    .eq('id', slot_id);

  if (updateError) return res.status(500).json({ error: 'Failed to update slot status' });

  // 4. Create booking record
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert([{ slot_id, student_id: student.id }])
    .select()
    .single();

  if (bookingError) {
    // Rollback slot if booking fails
    await supabase.from('slots').update({ status: 'free' }).eq('id', slot_id);
    return res.status(500).json({ error: 'Failed to create booking record' });
  }

  // 5. Send Confirmation Emails (To Student AND Teacher)
  try {
    const teacherName = slot.teachers?.profiles?.name || 'Your Teacher';
    
    // Email 1: To the Student
    const studentMailOptions = {
      from: process.env.GMAIL_ADDRESS,
      to: student_email,
      subject: 'Booking Confirmed!',
      text: `Hello ${student_name},\n\nYour booking with ${teacherName} on ${slot.date} from ${slot.start_time} to ${slot.end_time} is confirmed.\n\nThank you!`
    };

    // Email 2: To the Teacher (Using their actual email from DB!)
    const teacherEmail = slot.teachers?.email || process.env.GMAIL_ADDRESS; 
    const teacherMailOptions = {
      from: process.env.GMAIL_ADDRESS,
      to: teacherEmail,
      subject: 'New Slot Booking Alert!',
      text: `Hello ${teacherName},\n\nA student named ${student_name} (${student_email}) has just booked your free slot on ${slot.date} from ${slot.start_time} to ${slot.end_time}.\n\nPlease log in to check your dashboard.`
    };

    // Send both emails
    await transporter.sendMail(studentMailOptions);
    await transporter.sendMail(teacherMailOptions);
    
    // Update email_sent status
    await supabase.from('bookings').update({ email_sent: true }).eq('id', booking.id);
    
    res.json({ message: 'Booking successful and emails sent to both student and teacher!', booking });
  } catch (emailError) {
    console.error("Email failed:", emailError);
    res.json({ message: 'Booking successful, but failed to send emails.', booking, emailError: emailError.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
