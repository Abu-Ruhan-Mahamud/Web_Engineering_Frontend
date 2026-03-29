import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getResults } from '../../services/api';
import '../../styles/doctor-schedule.css';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
const HOURS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

export default function ScheduleManagement() {
  const [schedule, setSchedule] = useState({
    available_days: [],
    working_hours_start: '09:00:00',
    working_hours_end: '17:00:00',
    slot_duration: 30,
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [error, setError] = useState('');

  // Fetch data function (can be called multiple times)
  const fetchData = async (controller) => {
    try {
      setError('');
      const [schedRes, aptRes] = await Promise.all([
        api.get('/auth/doctor/schedule/', { signal: controller.signal }),
        api.get('/appointments/', { signal: controller.signal }),
      ]);
      setSchedule(schedRes.data);
      const fetchedAppointments = getResults(aptRes.data);
      setAppointments(fetchedAppointments);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError('Failed to load schedule. Please refresh the page.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller);
    return () => controller.abort();
  }, []);

  // Auto-refresh when window regains focus (e.g., returning from patient booking page)
  useEffect(() => {
    const handleFocus = () => {
      const controller = new AbortController();
      setLoading(true);
      fetchData(controller);
      return () => controller.abort();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Get the week dates
  const getWeekDates = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay() + 1 + weekOffset * 7); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates();

  const formatWeekRange = () => {
    const first = weekDates[0];
    const last = weekDates[6];
    const opts = { month: 'short', day: 'numeric' };
    return `${first.toLocaleDateString('en-US', opts)} — ${last.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(h), parseInt(m));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Map appointments to calendar cells (only active ones)
  const activeAppointments = appointments.filter(
    (a) => a.status !== 'cancelled' && a.status !== 'no_show'
  );

  const getAppointmentsForCell = (date, hourLabel) => {
    // Convert to local date string (not UTC) to match backend date format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const hourMap = {
      '9:00 AM': 9, '10:00 AM': 10, '11:00 AM': 11, '12:00 PM': 12,
      '1:00 PM': 13, '2:00 PM': 14, '3:00 PM': 15, '4:00 PM': 16,
    };
    const hour = hourMap[hourLabel];
    return activeAppointments.filter((apt) => {
      if (apt.appointment_date !== dateStr || !apt.appointment_time) return false;
      const aptHour = parseInt(apt.appointment_time.split(':')[0]);
      return aptHour === hour;
    });
  };

  const totalSlots = schedule.available_days.length * 8;
  const bookedCount = activeAppointments.length;

  if (loading) {
    return (
      <div className="doc-loading">
        <div className="doc-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: '64px', height: '64px', opacity: 0.4 }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
        <p style={{ color: '#d32f2f', fontWeight: 500, marginTop: '0.5rem' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="sched-page">
      {/* Stats */}
      <div className="sched-stats">
        <div className="sched-stat-card">
          <div className="value">{activeAppointments.length}</div>
          <div className="label">Active Appointments</div>
        </div>
        <div className="sched-stat-card">
          <div className="value">{Math.max(0, totalSlots - bookedCount)}</div>
          <div className="label">Available Slots</div>
        </div>
        <div className="sched-stat-card">
          <div className="value">{bookedCount}</div>
          <div className="label">Booked Slots</div>
        </div>
        <div className="sched-stat-card">
          <div className="value">
            {schedule.working_hours_start && schedule.working_hours_end
              ? `${parseInt(schedule.working_hours_end) - parseInt(schedule.working_hours_start)}h`
              : '8h'}
          </div>
          <div className="label">Daily Hours</div>
        </div>
      </div>

      {/* Schedule Summary Bar */}
      <div className="sched-summary-bar">
        <div className="sched-summary-info">
          <div className="sched-summary-days">
            {DAYS.map((day) => (
              <span
                key={day}
                className={`sched-summary-day ${schedule.available_days.includes(day) ? 'active' : ''}`}
              >
                {DAY_LABELS[day]}
              </span>
            ))}
          </div>
          <span className="sched-summary-hours">
            {formatTime(schedule.working_hours_start)} — {formatTime(schedule.working_hours_end)}
          </span>
          <span className="sched-summary-slot">{schedule.slot_duration} min slots</span>
        </div>
        <Link to="/doctor/profile?tab=schedule" className="sched-edit-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit Schedule
        </Link>
      </div>

      {/* Calendar View — Full Width */}
      <div className="sched-card">
        <div className="sched-calendar-nav">
          <h2>Week View</h2>
          <div className="sched-nav-btns">
            <button className="sched-nav-btn" onClick={() => setWeekOffset((p) => p - 1)}>
              ‹
            </button>
            <button className="sched-nav-today" onClick={() => setWeekOffset(0)}>
              Today
            </button>
            <button className="sched-nav-btn" onClick={() => setWeekOffset((p) => p + 1)}>
              ›
            </button>
          </div>
          <h3>{formatWeekRange()}</h3>
        </div>

        <div className="sched-week-grid">
          {/* Header Row */}
          <div className="sched-week-header corner">Time</div>
          {weekDates.map((d, i) => {
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`sched-week-header${isToday ? ' today' : ''}`}>
                {DAY_LABELS[DAYS[i]]}
                <span className="date">{d.getDate()}</span>
              </div>
            );
          })}

          {/* Time Rows */}
          {HOURS.map((hour) => (
            <>
              <div key={`label-${hour}`} className="sched-time-label">
                {hour}
              </div>
              {weekDates.map((date, di) => {
                const dayName = DAYS[di];
                const isAvailable = schedule.available_days.includes(dayName);
                const isToday = date.toDateString() === new Date().toDateString();
                const cellApts = getAppointmentsForCell(date, hour);
                const hasBooking = cellApts.length > 0;

                return (
                  <div
                    key={`${hour}-${di}`}
                    className={`sched-time-cell ${
                      hasBooking ? 'booked' : isAvailable ? 'available' : ''
                    }${isToday ? ' today-col' : ''}`}
                  >
                    {cellApts.map((apt) => (
                      <div key={apt.id} className="sched-apt-block">
                        <div className="name">{apt.patient_name || 'Patient'}</div>
                        <div className="type">{apt.reason || 'Consultation'}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>

        {/* Legend */}
        <div className="sched-legend">
          <div className="sched-legend-item">
            <div className="sched-legend-color available" />
            Available
          </div>
          <div className="sched-legend-item">
            <div className="sched-legend-color booked" />
            Booked
          </div>
          <div className="sched-legend-item">
            <div className="sched-legend-color unavailable" />
            Unavailable
          </div>
        </div>
      </div>
    </div>
  );
}
