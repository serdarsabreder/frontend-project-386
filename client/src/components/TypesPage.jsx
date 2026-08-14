export default function TypesPage({ eventTypes, onSelect }) {
  return (
    <div className="card">
      <div className="event-header">
        <div className="event-title">Book a call</div>
        <div className="event-meta">
          <span className="timezone">🌐 {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
        </div>
      </div>

      <div className="types-list">
        {eventTypes.map((eventType) => (
          <button key={eventType.id} type="button" className="type-row" onClick={() => onSelect(eventType)}>
            <div className="type-text">
              <span className="type-name">{eventType.name}</span>
              {eventType.description && <span className="type-desc">{eventType.description}</span>}
            </div>
            <span className="type-duration">{eventType.durationMinutes} min</span>
          </button>
        ))}
        {eventTypes.length === 0 && (
          <p className="text-muted">No meeting types yet.</p>
        )}
      </div>

      <div className="cal-footer">
        <span className="logo-mark">CB</span>
        <span>Call Booking</span>
      </div>
    </div>
  );
}
