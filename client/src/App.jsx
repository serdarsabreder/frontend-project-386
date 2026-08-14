import { useCallback, useEffect, useState } from 'react';
import { getOwner, listEventTypes } from './api.js';
import BookingPage from './components/BookingPage.jsx';
import OwnerView from './components/OwnerView.jsx';
import TypesPage from './components/TypesPage.jsx';

export default function App() {
  const [view, setView] = useState('types'); // 'types' | 'book' | 'owner'
  const [eventType, setEventType] = useState(null);
  const [owner, setOwner] = useState(null);
  const [eventTypes, setEventTypes] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [ownerData, typesData] = await Promise.all([getOwner(), listEventTypes()]);
      setOwner(ownerData);
      setEventTypes(typesData);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openTypes = () => {
    setView('types');
    setEventType(null);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">CB</span>
          <span className="brand-name">Call Booking</span>
        </div>
        <nav className="tabs">
          <button
            type="button"
            className={`tab ${view === 'types' || view === 'book' ? 'active' : ''}`}
            onClick={openTypes}
          >
            Book a call
          </button>
          <button
            type="button"
            className={`tab ${view === 'owner' ? 'active' : ''}`}
            onClick={() => {
              setView('owner');
              setEventType(null);
            }}
          >
            Owner
          </button>
        </nav>
      </header>

      <main className="content">
        {error && (
          <div className="notice error">
            {error}
            <button type="button" className="notice-action" onClick={load}>
              Retry
            </button>
          </div>
        )}
        {view === 'types' && (
          <TypesPage
            eventTypes={eventTypes}
            onSelect={(et) => {
              setEventType(et);
              setView('book');
            }}
          />
        )}
        {view === 'book' && eventType && owner && (
          <BookingPage eventType={eventType} owner={owner} onBack={openTypes} />
        )}
        {view === 'owner' && <OwnerView />}
      </main>
    </div>
  );
}
