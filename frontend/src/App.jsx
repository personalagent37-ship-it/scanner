import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';

const API_BASE = 'https://scanner-1-wd48.onrender.com/api';

// --- Home / In-App Scanner Component ---
function Home() {
  const navigate = useNavigate();
  const scannerRef = React.useRef(null);
  const [demoTeacherId, setDemoTeacherId] = useState(null);

  useEffect(() => {
    // Fetch a valid teacher ID so the demo QR code on screen actually works
    const fetchFirstTeacher = async () => {
      try {
        const res = await fetch(`${API_BASE}/teachers/by-qr/qr_alan_turing`); 
        if (res.ok) {
          const data = await res.json();
          setDemoTeacherId(data.teacher.id);
        }
      } catch (err) {
        console.error("Could not fetch demo teacher", err);
      }
    };
    fetchFirstTeacher();

    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          if (scannerRef.current) {
            scannerRef.current.clear();
          }
          let teacherId = decodedText;
          if (decodedText.includes('/book/')) {
            teacherId = decodedText.split('/book/')[1];
          }
          navigate(`/book/${teacherId}`);
        },
        (err) => {
          // Ignore background scanning errors
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Failed to clear scanner", e));
        scannerRef.current = null;
      }
    };
  }, [navigate]);

  // HARDCODED scanner function per Boss's instructions (fallback testing)
  const simulateScan = () => {
    const hardcodedQr = 'qr_alan_turing'; // Updated to point to the new professional teacher!
    // Instead of setting state, navigate to the new route
    navigate(`/book/${hardcodedQr}`);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-accent">Faculty QR Booking</h1>
      
      <div className="w-full flex flex-col items-center gap-6">
        
        {/* In-App Scanner (For students already using the app) */}
        <div className="w-full max-w-md border-2 border-accent rounded-lg overflow-hidden bg-gray-50 p-4 shadow-lg">
          <h3 className="text-center font-bold text-gray-700 mb-2">Scan Faculty QR Code</h3>
          <div id="reader" className="w-full bg-white"></div>
        </div>

        <div className="text-gray-400 font-semibold text-sm">OR</div>
        
        {/* Display the Teacher's QR Code Image directly on the UI */}
        <div className="w-full max-w-md border-2 border-accent rounded-lg overflow-hidden bg-white p-6 shadow-lg flex flex-col items-center">
          <h3 className="text-center font-bold text-gray-700 mb-4 text-xl">Teacher's QR Code</h3>
          {demoTeacherId ? (
            <img 
              src={`${API_BASE}/teachers/${demoTeacherId}/qr?t=${Date.now()}`} 
              alt="Teacher QR Code" 
              className="w-64 h-64 object-contain"
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded text-gray-400">Loading QR...</div>
          )}
          <p className="text-sm text-gray-500 mt-4 text-center">Scan this with your phone camera!</p>
        </div>
        
        <div className="text-gray-400 font-semibold text-sm mt-4">OR IF TESTING ON DESKTOP:</div>

        <button 
          onClick={simulateScan}
          className="bg-accent text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-teal-700 transition shadow-lg w-full max-w-md"
        >
          Simulate Scan (Hardcoded QR)
        </button>
      </div>
    </div>
  );
}

// --- Booking Page Component ---
function BookingPage() {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  
  const [teacher, setTeacher] = useState(null);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');
  
  // Booking Form State
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [bookingStatus, setBookingStatus] = useState(''); // 'loading', 'success', 'error'

  useEffect(() => {
    if (teacherId) {
      fetchTeacherAndSlots(teacherId);
    }
  }, [teacherId]);

  const fetchTeacherAndSlots = async (qrCodeStr) => {
    setError('');
    try {
      const tRes = await fetch(`${API_BASE}/teachers/by-qr/${qrCodeStr}`);
      if (!tRes.ok) throw new Error('Invalid QR Code or Teacher not found');
      const tData = await tRes.json();
      setTeacher(tData.teacher);

      const sRes = await fetch(`${API_BASE}/slots/${tData.teacher.id}`);
      if (!sRes.ok) throw new Error('Failed to fetch slots');
      const sData = await sRes.json();
      setSlots(sData.slots);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingStatus('loading');
    
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: selectedSlot.id,
          student_name: studentName,
          student_email: studentEmail
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book slot');
      
      setBookingStatus('success');
      alert(data.message);
      
      // Refresh slots to remove the booked one
      fetchTeacherAndSlots(teacherId);
      
      // Close modal
      setSelectedSlot(null);
      setStudentName('');
      setStudentEmail('');
      setBookingStatus('');
    } catch (err) {
      setBookingStatus('error');
      alert(`Error: ${err.message}`);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white p-8 flex flex-col items-center">
        <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg max-w-md text-center">
          {error}
          <button 
            onClick={() => navigate('/')}
            className="ml-4 underline font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8 flex flex-col items-center relative">
      
      {/* Booking Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
            <button 
              onClick={() => setSelectedSlot(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 font-bold"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold mb-2">Book Slot</h3>
            <p className="text-gray-600 mb-6">
              {selectedSlot.date} at {selectedSlot.start_time}
            </p>
            
            <form onSubmit={handleBooking} className="flex flex-col gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Your Name</label>
                <input 
                  type="text" 
                  required
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-accent outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Your Email (To receive confirmation)</label>
                <input 
                  type="email" 
                  required
                  value={studentEmail}
                  onChange={e => setStudentEmail(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-accent outline-none"
                  placeholder="student@example.com"
                />
              </div>
              
              <button 
                type="submit"
                disabled={bookingStatus === 'loading'}
                className="mt-4 bg-accent text-white font-bold py-3 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition"
              >
                {bookingStatus === 'loading' ? 'Booking...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
        {/* Dashboard Header */}
        <div className="bg-accent text-white p-6">
          <h2 className="text-3xl font-bold mb-2">{teacher.profiles?.name || 'Faculty Member'}</h2>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-teal-100 font-medium">
            <p>Subject: {teacher.subject}</p>
            {teacher.email && (
              <p className="flex items-center gap-1">
                ✉️ {teacher.email}
              </p>
            )}
            {teacher.phone && (
              <p className="flex items-center gap-1">
                📞 {teacher.phone}
              </p>
            )}
          </div>
        </div>

        {/* Slots List */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Available Booking Slots</h3>
          
          {slots.length === 0 ? (
            <p className="text-center text-gray-500 italic py-8">No free slots currently available.</p>
          ) : (
            <ul className="space-y-4">
              {slots.map(slot => {
                if (slot.status !== 'free') return null; // Don't show booked slots
                return (
                  <li key={slot.id} className="p-4 border-2 border-gray-100 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-accent transition bg-gray-50">
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{slot.date}</p>
                      <p className="text-gray-600 font-medium">{slot.start_time} — {slot.end_time}</p>
                    </div>
                    
                    <button 
                      onClick={() => setSelectedSlot(slot)}
                      className="bg-accent text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-teal-700 transition w-full sm:w-auto"
                    >
                      Book Slot
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <button 
            onClick={() => navigate('/')}
            className="mt-8 w-full border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
          >
            Scan a Different Faculty QR
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main App ---
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/book/:teacherId" element={<BookingPage />} />
    </Routes>
  );
}

export default App;
