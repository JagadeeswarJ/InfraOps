import React, { useState, useEffect } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  type: 'conference' | 'workshop' | 'networking' | 'webinar';
}

const EventCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    // Mock events data
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Tech Conference 2024',
        date: '2024-03-15',
        time: '09:00',
        location: 'San Francisco',
        type: 'conference'
      },
      {
        id: '2',
        title: 'Web Development Workshop',
        date: '2024-03-18',
        time: '14:00',
        location: 'Online',
        type: 'workshop'
      },
      {
        id: '3',
        title: 'Networking Mixer',
        date: '2024-03-22',
        time: '18:00',
        location: 'New York',
        type: 'networking'
      },
      {
        id: '4',
        title: 'AI & Machine Learning Webinar',
        date: '2024-03-25',
        time: '11:00',
        location: 'Online',
        type: 'webinar'
      }
    ];
    
    setEvents(mockEvents);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    const startingDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    const colors = {
      conference: '#3b82f6',
      workshop: '#10b981',
      networking: '#f59e0b',
      webinar: '#8b5cf6'
    };
    return colors[type];
  };

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <h1>Event Calendar</h1>
        <div className="calendar-controls">
          <div className="view-toggle">
            <button 
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button 
              className={viewMode === 'week' ? 'active' : ''}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button 
              className={viewMode === 'day' ? 'active' : ''}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
          </div>
          
          <div className="month-navigation">
            <button onClick={() => navigateMonth('prev')}>←</button>
            <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <button onClick={() => navigateMonth('next')}>→</button>
          </div>
        </div>
      </div>

      <div className="calendar-container">
        {viewMode === 'month' && (
          <div className="calendar-grid">
            <div className="calendar-header-row">
              {dayNames.map(day => (
                <div key={day} className="calendar-header-cell">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="calendar-body">
              {days.map((day, index) => (
                <div 
                  key={index} 
                  className={`calendar-cell ${day ? 'has-date' : 'empty'} ${
                    selectedDate && day && day.toDateString() === selectedDate.toDateString() ? 'selected' : ''
                  }`}
                  onClick={() => day && setSelectedDate(day)}
                >
                  {day && (
                    <>
                      <span className="date-number">{day.getDate()}</span>
                      <div className="events-preview">
                        {getEventsForDate(day).slice(0, 2).map(event => (
                          <div 
                            key={event.id} 
                            className="event-dot"
                            style={{ backgroundColor: getEventTypeColor(event.type) }}
                            title={event.title}
                          >
                            <span className="event-title">{event.title}</span>
                          </div>
                        ))}
                        {getEventsForDate(day).length > 2 && (
                          <div className="more-events">+{getEventsForDate(day).length - 2} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="calendar-sidebar">
          <div className="event-legend">
            <h3>Event Types</h3>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
                <span>Conference</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
                <span>Workshop</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
                <span>Networking</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#8b5cf6' }}></div>
                <span>Webinar</span>
              </div>
            </div>
          </div>

          {selectedDate && (
            <div className="selected-date-events">
              <h3>Events on {selectedDate.toLocaleDateString()}</h3>
              {getEventsForDate(selectedDate).length > 0 ? (
                <div className="event-list">
                  {getEventsForDate(selectedDate).map(event => (
                    <div key={event.id} className="event-item">
                      <div 
                        className="event-type-indicator"
                        style={{ backgroundColor: getEventTypeColor(event.type) }}
                      ></div>
                      <div className="event-details">
                        <h4>{event.title}</h4>
                        {event.time && <p>⏰ {event.time}</p>}
                        {event.location && <p>📍 {event.location}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No events scheduled for this date.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;