import { useCallback, useEffect, useState } from 'react';
import { listBookings, listSlots } from './api.js';
import BookingModal from './components/BookingModal.jsx';
import OwnerView from './components/OwnerView.jsx';
import SlotPicker from './components/SlotPicker.jsx';
import Toast from './components/Toast.jsx';

function todayLocal() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function App() {
  const [view, setView] = useState('book');
  const [date, setDate] = useState(todayLocal());
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [toast, setToast] = useState(null);
  const minDate = todayLocal();

  const notify = useCallback((message, kind = 'info') => {
    setToast({ message, kind });
  }, []);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSlots(date);
      setSlots(data.slots);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [date, notify]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const handleBooked = useCallback(
    (message, kind) => {
      setSelectedSlot(null);
      notify(message, kind);
      loadSlots();
    },
    [loadSlots, notify],
  );

  const switchView = (next) => {
    setView(next);
    setSelectedSlot(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">CB</span>
          <h1>Call Booking</h1>
        </div>
        <nav className="tabs">
          <button
            type="button"
            className={`tab ${view === 'book' ? 'active' : ''}`}
            onClick={() => switchView('book')}
          >
            Book a call
          </button>
          <button
            type="button"
            className={`tab ${view === 'owner' ? 'active' : ''}`}
            onClick={() => switchView('owner')}
          >
            Owner view
          </button>
        </nav>
      </header>

      <main className="content">
        {view === 'book' ? (
          <SlotPicker
            date={date}
            minDate={minDate}
            onDateChange={setDate}
            slots={slots}
            loading={loading}
            onSelect={setSelectedSlot}
          />
        ) : (
          <OwnerView api={listBookings} />
        )}
      </main>

      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onBooked={handleBooked}
        />
      )}

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
