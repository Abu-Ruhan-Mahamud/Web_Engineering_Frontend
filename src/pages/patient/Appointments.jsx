import { useState, useEffect } from 'react';
import api, { getResults } from '../../services/api';
import useDebounce from '../../hooks/useDebounce';
import '../../styles/appointments.css';

const SPECIALIZATIONS = [
  { value: '', label: 'All Specialties' },
  { value: 'general_practice', label: 'General Practice' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'psychiatry', label: 'Psychiatry' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'ophthalmology', label: 'Ophthalmology' },
  { value: 'ent', label: 'ENT' },
  { value: 'gynecology', label: 'Gynecology' },
  { value: 'urology', label: 'Urology' },
  { value: 'oncology', label: 'Oncology' },
];

const STATUS_FILTERS = ['All', 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PatientAppointments() {
  // View toggle: "list" | "book"
  const [view, setView] = useState('list');

  // ── List state ──
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [listLoading, setListLoading] = useState(true);

  // ── Booking state ──
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [bookedSlots, setBookedSlots] = useState([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  // ── Fetch appointments ──
  const fetchAppointments = async (signal) => {
    setListLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      const res = await api.get('/appointments/', { params, ...(signal ? { signal } : {}) });
      setAppointments(getResults(res.data));
    } catch (err) {
      if (signal?.aborted) return;
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAppointments(controller.signal);
    return () => controller.abort();
  }, [statusFilter]);

  const debouncedSearch = useDebounce(search, 300);

  // ── Fetch doctors when booking view opens ──
  useEffect(() => {
    if (view !== 'book') return;
    const controller = new AbortController();
    const fetchDoctors = async () => {
      try {
        const params = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (specFilter) params.specialization = specFilter;
        const res = await api.get('/auth/doctors/', { params, signal: controller.signal });
        setDoctors(res.data);
      } catch (err) {
        if (controller.signal.aborted) return;
      }
    };
    fetchDoctors();
    return () => controller.abort();
  }, [view, debouncedSearch, specFilter]);

  // ── Reset date/time when doctor changes ──
  useEffect(() => {
    setSelectedDate(null);
    setSelectedTime(null);
    setBookedSlots([]);
  }, [selectedDoctor?.id]);

  // ── Reset time when date changes ──
  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDate]);

  // ── Fetch booked slots when doctor + date selected ──
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setBookedSlots([]);
      return;
    }
    const controller = new AbortController();
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    setFetchingSlots(true);
    api
      .get('/appointments/booked-slots/', {
        params: { doctor_id: selectedDoctor.id, date: dateStr },
        signal: controller.signal,
      })
      .then((res) => setBookedSlots(res.data.booked_slots || []))
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setFetchingSlots(false); });
    return () => controller.abort();
  }, [selectedDoctor?.id, selectedDate, calMonth, calYear]);

  // ── Calendar helpers ──
  const daysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (m, y) => new Date(y, m, 1).getDay();

  // Day-of-week map: JS getDay() 0=Sun … 6=Sat → lowercase day name
  const JS_DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const calendarDays = () => {
    const total = daysInMonth(calMonth, calYear);
    const startDay = firstDayOfMonth(calMonth, calYear);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const availDays = selectedDoctor?.available_days?.map((d) => d.toLowerCase()) || [];

    const cells = [];
    // Empty cells for leading days
    for (let i = 0; i < startDay; i++) {
      cells.push({ day: null, disabled: true, key: `e-${i}` });
    }
    for (let d = 1; d <= total; d++) {
      const date = new Date(calYear, calMonth, d);
      const isPast = date < today;
      const dayName = JS_DAY_NAMES[date.getDay()];
      const isUnavailableDay = selectedDoctor && !availDays.includes(dayName);
      cells.push({ day: d, disabled: isPast || isUnavailableDay, unavailable: isUnavailableDay, key: `d-${d}` });
    }
    return cells;
  };

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const monthName = new Date(calYear, calMonth).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  // ── Generate time slots from doctor schedule ──
  const generateSlots = () => {
    if (!selectedDoctor) return [];
    const start = selectedDoctor.working_hours_start || '09:00:00';
    const end = selectedDoctor.working_hours_end || '17:00:00';
    const duration = selectedDoctor.slot_duration || 30;

    const slots = [];
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let current = sh * 60 + sm;
    const endMin = eh * 60 + em;

    while (current + duration <= endMin) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push(timeStr);
      current += duration;
    }
    return slots;
  };

  const formatTime12 = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  // ── Book appointment ──
  const handleBook = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return;
    setBooking(true);
    setMessage({ text: '', type: '' });
    try {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
      await api.post('/appointments/', {
        doctor: selectedDoctor.id,
        appointment_date: dateStr,
        appointment_time: selectedTime + ':00',
        reason,
      });
      setMessage({ text: 'Appointment booked successfully!', type: 'success' });
      // Reset booking form
      setSelectedDoctor(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setReason('');
      // Switch back to list after short delay
      setTimeout(() => {
        setView('list');
        setMessage({ text: '', type: '' });
        fetchAppointments();
      }, 2000);
    } catch (err) {
      const detail =
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        'Failed to book appointment.';
      setMessage({ text: detail, type: 'error' });
    } finally {
      setBooking(false);
    }
  };

  // ── Cancel appointment ──
  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await api.patch(`/appointments/${id}/`, { status: 'cancelled' });
      fetchAppointments();
    } catch (err) {
      // silently handle
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return {
      day: d.getDate(),
      month: d.toLocaleString('default', { month: 'short' }),
    };
  };

  const statusLabel = (s) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ') : '';

  const statusClass = (s) => {
    const map = {
      scheduled: 'dash-status-scheduled',
      confirmed: 'dash-status-confirmed',
      completed: 'dash-status-completed',
      cancelled: 'dash-status-cancelled',
      in_progress: 'dash-status-in-progress',
      no_show: 'dash-status-no-show',
      rescheduled: 'dash-status-rescheduled',
    };
    return map[s] || 'dash-status-scheduled';
  };

  // ──────────────────────────────────────────────
  // BOOKING VIEW
  // ──────────────────────────────────────────────
  if (view === 'book') {
    const slots = generateSlots();
    const doctorInitials = (d) =>
      `${d.first_name?.[0] || ''}${d.last_name?.[0] || ''}`.toUpperCase();

    return (
      <>
        <div className="appt-page-header">
          <div>
            <h1 className="appt-page-title">Book an Appointment</h1>
            <p className="appt-page-subtitle">
              Schedule your consultation with our healthcare professionals
            </p>
          </div>
          <button className="appt-toggle-btn" onClick={() => setView('list')}>
            ← My Appointments
          </button>
        </div>

        {message.text && (
          <div className={`appt-message ${message.type}`}>{message.text}</div>
        )}

        <div className="appt-booking-grid">
          {/* LEFT — Doctor Selection */}
          <div className="dash-card">
            <div className="appt-search-bar">
              <input
                className="appt-search-input"
                placeholder="Search by doctor name or specialty"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="appt-filter-select"
                value={specFilter}
                onChange={(e) => setSpecFilter(e.target.value)}
              >
                {SPECIALIZATIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="appt-doctors-list">
              {doctors.length === 0 ? (
                <div className="dash-empty">
                  <p>No doctors found</p>
                </div>
              ) : (
                doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className={`appt-doctor-card ${selectedDoctor?.id === doc.id ? 'selected' : ''}`}
                    onClick={() => setSelectedDoctor(doc)}
                  >
                    <div className="appt-doctor-avatar">{doctorInitials(doc)}</div>
                    <div className="appt-doctor-info">
                      <div className="doctor-name">
                        Dr. {doc.first_name} {doc.last_name}
                      </div>
                      <div className="doctor-specialty">
                        {SPECIALIZATIONS.find((s) => s.value === doc.specialization)?.label ||
                          doc.specialization}
                      </div>
                      <div className="appt-doctor-meta">
                        {doc.years_experience > 0 && (
                          <span>{doc.years_experience} yrs exp</span>
                        )}
                        {doc.consultation_fee && (
                          <span>Fee: ৳{Number(doc.consultation_fee).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <button
                      className="appt-select-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDoctor(doc);
                      }}
                    >
                      {selectedDoctor?.id === doc.id ? 'Selected ✓' : 'Select'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT — Calendar + Summary */}
          <div>
            <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
              {/* Calendar */}
              <div className="appt-calendar-section">
                <div className="appt-section-title">Select Date</div>
                <div className="appt-calendar-header">
                  <div className="appt-calendar-month">{monthName}</div>
                  <div className="appt-calendar-nav">
                    <button className="appt-nav-btn" onClick={prevMonth}>
                      ‹
                    </button>
                    <button className="appt-nav-btn" onClick={nextMonth}>
                      ›
                    </button>
                  </div>
                </div>
                <div className="appt-calendar-grid">
                  {DAY_LABELS.map((d) => (
                    <div key={d} className="appt-cal-day-label">
                      {d}
                    </div>
                  ))}
                  {calendarDays().map((cell) => {
                    if (cell.day === null)
                      return <div key={cell.key} className="appt-cal-day empty" />;
                    const isSelected = selectedDate === cell.day;
                    return (
                      <div
                        key={cell.key}
                        className={`appt-cal-day ${cell.disabled ? 'disabled' : ''} ${cell.unavailable ? 'unavailable' : ''} ${isSelected ? 'selected' : ''}`}
                        onClick={() => !cell.disabled && setSelectedDate(cell.day)}
                      >
                        {cell.day}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDoctor && selectedDate && (
                <div className="appt-calendar-section">
                  <div className="appt-section-title">Available Time Slots</div>
                  {fetchingSlots ? (
                    <div className="dash-empty"><p>Loading slots…</p></div>
                  ) : slots.length === 0 ? (
                    <div className="dash-empty">
                      <p>No available slots</p>
                    </div>
                  ) : (
                    <div className="appt-time-slots">
                      {slots.map((t) => {
                        const isBooked = bookedSlots.includes(t);
                        return (
                          <div
                            key={t}
                            className={`appt-time-slot ${selectedTime === t ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                            onClick={() => !isBooked && setSelectedTime(t)}
                            title={isBooked ? 'Already booked' : ''}
                          >
                            {formatTime12(t)}
                            {isBooked && <span className="appt-slot-taken">Taken</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="dash-card">
              <div className="appt-summary-box">
                <div className="appt-summary-title">Appointment Summary</div>
                <div className="appt-summary-item">
                  <div className="appt-summary-label">Doctor</div>
                  <div className="appt-summary-value">
                    {selectedDoctor
                      ? `Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name}`
                      : '—'}
                  </div>
                </div>
                <div className="appt-summary-item">
                  <div className="appt-summary-label">Specialty</div>
                  <div className="appt-summary-value">
                    {selectedDoctor
                      ? SPECIALIZATIONS.find((s) => s.value === selectedDoctor.specialization)
                          ?.label || selectedDoctor.specialization
                      : '—'}
                  </div>
                </div>
                <div className="appt-summary-item">
                  <div className="appt-summary-label">Date</div>
                  <div className="appt-summary-value">
                    {selectedDate
                      ? new Date(calYear, calMonth, selectedDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </div>
                </div>
                <div className="appt-summary-item">
                  <div className="appt-summary-label">Time</div>
                  <div className="appt-summary-value">
                    {selectedTime ? formatTime12(selectedTime) : '—'}
                  </div>
                </div>
                {selectedDoctor?.consultation_fee && (
                  <div className="appt-summary-item">
                    <div className="appt-summary-label">Fee</div>
                    <div className="appt-summary-value">
                      ৳{Number(selectedDoctor.consultation_fee).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div className="appt-form-group" style={{ marginTop: '1rem' }}>
                <label className="appt-form-label">Reason for Visit (optional)</label>
                <textarea
                  className="appt-form-textarea"
                  placeholder="Briefly describe your symptoms or reason…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <button
                className="appt-btn-book"
                disabled={!selectedDoctor || !selectedDate || !selectedTime || booking}
                onClick={handleBook}
              >
                {booking ? 'Booking…' : 'Book Appointment →'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ──────────────────────────────────────────────
  // LIST VIEW
  // ──────────────────────────────────────────────
  return (
    <>
      <div className="appt-page-header">
        <div>
          <h1 className="appt-page-title">My Appointments</h1>
          <p className="appt-page-subtitle">View and manage your appointments</p>
        </div>
        <button className="appt-toggle-btn" onClick={() => setView('book')}>
          + Book Appointment
        </button>
      </div>

      <div className="appt-filter-tabs">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            className={`appt-filter-tab ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'All' ? 'All' : statusLabel(s)}
          </button>
        ))}
      </div>

      {listLoading ? (
        <div className="dash-empty">
          <p>Loading appointments…</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="dash-empty">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
          </svg>
          <p>No appointments found</p>
        </div>
      ) : (
        <div className="appt-list">
          {appointments.map((apt) => {
            const { day, month } = formatDate(apt.appointment_date);
            return (
              <div key={apt.id} className="appt-item">
                <div className="appt-date-box">
                  <div className="appt-date-day">{day}</div>
                  <div className="appt-date-month">{month}</div>
                </div>
                <div className="appt-details">
                  <div className="appt-doctor-name">{apt.doctor_name}</div>
                  <div className="appt-specialty">{apt.doctor_specialization}</div>
                  <div className="appt-time">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                    </svg>
                    {formatTime12(apt.appointment_time)}
                    {apt.end_time ? ` – ${formatTime12(apt.end_time)}` : ''}
                  </div>
                </div>
                <div className="appt-actions">
                  <span className={`dash-status ${statusClass(apt.status)}`}>
                    {statusLabel(apt.status)}
                  </span>
                  {['scheduled', 'confirmed'].includes(apt.status) && (
                    <button
                      className="appt-cancel-btn"
                      onClick={() => handleCancel(apt.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
