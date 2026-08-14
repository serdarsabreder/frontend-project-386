function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SlotPicker({ date, minDate, onDateChange, slots, loading, onSelect }) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Pick a time</h2>
          <p className="muted">
            Select a free 30-minute slot and book your call with the calendar owner.
          </p>
        </div>
        <label className="date-field">
          <span className="muted">Date</span>
          <input
            type="date"
            value={date}
            min={minDate}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </label>
      </div>

      <div className="slots">
        {loading && <p className="muted">Loading available slots…</p>}
        {!loading && slots.length === 0 && (
          <p className="muted">No slots available for this date.</p>
        )}
        {!loading &&
          slots.map((slot) => {
            const taken = slot.status === 'booked';
            return (
              <button
                key={slot.id}
                type="button"
                className={`slot ${taken ? 'slot-taken' : ''}`}
                disabled={taken}
                title={taken ? 'Already booked' : `${formatTime(slot.start)} – ${formatTime(slot.end)}`}
                onClick={() => onSelect(slot)}
              >
                {formatTime(slot.start)}
              </button>
            );
          })}
      </div>

      <div className="legend">
        <span className="legend-item">
          <span className="dot available" /> Available
        </span>
        <span className="legend-item">
          <span className="dot booked" /> Booked
        </span>
      </div>
    </section>
  );
}
