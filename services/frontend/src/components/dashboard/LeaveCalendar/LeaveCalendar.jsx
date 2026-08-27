import React from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import './LeaveCalendar.css';

const LeaveCalendar = ({ leaves }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const days = daysInMonth(month, year);
  const firstDay = firstDayOfMonth(month, year);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getLeavesForDay = (day) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return leaves.filter(l => {
      const start = l.start_date;
      const end = l.end_date;
      return dayStr >= start && dayStr <= end;
    });
  };

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }
  for (let d = 1; d <= days; d++) {
    const dayLeaves = getLeavesForDay(d);
    calendarDays.push(
      <div key={d} className={`calendar-day ${dayLeaves.length > 0 ? 'has-leave' : ''}`} aria-label={`${monthNames[month]} ${d}, ${year}${dayLeaves.length ? `, ${dayLeaves.length} leave request${dayLeaves.length === 1 ? '' : 's'}` : ''}`}>
        <span className="day-num">{d}</span>
        <div className="day-leaves">
          {dayLeaves.map((l, idx) => (
             <div key={idx} className={`leave-dot ${l.status}`} title={`${l.leave_type}: ${l.status}`} aria-label={`${l.leave_type} leave: ${l.status}`}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="leave-calendar">
      <div className="calendar-header">
        <h2>{monthNames[month]} {year}</h2>
        <div className="calendar-nav">
          <button type="button" onClick={prevMonth} aria-label="Previous month" title="Previous month"><LuChevronLeft aria-hidden="true" /></button>
          <button type="button" onClick={nextMonth} aria-label="Next month" title="Next month"><LuChevronRight aria-hidden="true" /></button>
        </div>
      </div>
      <div className="calendar-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="calendar-grid">
        {calendarDays}
      </div>
      <div className="calendar-legend">
        <div className="legend-item"><span className="dot approved"></span> Approved</div>
        <div className="legend-item"><span className="dot pending"></span> Pending</div>
        <div className="legend-item"><span className="dot rejected"></span> Rejected</div>
      </div>
    </div>
  );
};

export default LeaveCalendar;
