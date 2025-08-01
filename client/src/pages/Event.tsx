import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface EventDetails {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  organizer: string;
  capacity: number;
  registered: number;
  image?: string;
  agenda: string[];
}

const Event: React.FC = () => {
  const { eventname } = useParams<{ eventname: string }>();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        // Simulate API call to fetch event details
        const mockEvent: EventDetails = {
          id: '1',
          title: eventname || 'Sample Event',
          description: 'This is a detailed description of the event. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          date: '2024-03-15T10:00:00',
          location: 'Conference Center, San Francisco, CA',
          organizer: 'Tech Events Inc.',
          capacity: 500,
          registered: 234,
          agenda: [
            '9:00 AM - Registration & Coffee',
            '10:00 AM - Opening Keynote',
            '11:30 AM - Panel Discussion',
            '1:00 PM - Lunch Break',
            '2:00 PM - Workshop Sessions',
            '4:00 PM - Networking Session',
            '5:00 PM - Closing Remarks'
          ]
        };
        
        setEvent(mockEvent);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching event:', error);
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventname]);

  if (loading) {
    return <div className="loading">Loading event details...</div>;
  }

  if (!event) {
    return <div className="error">Event not found</div>;
  }

  const registrationPercentage = (event.registered / event.capacity) * 100;

  return (
    <div className="event-page">
      <div className="event-hero">
        {event.image && <img src={event.image} alt={event.title} className="event-banner" />}
        <div className="event-hero-content">
          <h1>{event.title}</h1>
          <div className="event-meta">
            <span className="event-date">📅 {new Date(event.date).toLocaleDateString()}</span>
            <span className="event-time">🕒 {new Date(event.date).toLocaleTimeString()}</span>
            <span className="event-location">📍 {event.location}</span>
          </div>
        </div>
      </div>

      <div className="event-content">
        <div className="event-main">
          <section className="event-description">
            <h2>About This Event</h2>
            <p>{event.description}</p>
          </section>

          <section className="event-agenda">
            <h2>Event Agenda</h2>
            <ul className="agenda-list">
              {event.agenda.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="event-sidebar">
          <div className="registration-card">
            <div className="capacity-info">
              <h3>Registration Status</h3>
              <div className="capacity-bar">
                <div 
                  className="capacity-fill" 
                  style={{ width: `${registrationPercentage}%` }}
                ></div>
              </div>
              <p>{event.registered} / {event.capacity} registered</p>
            </div>

            <div className="organizer-info">
              <h4>Organized by</h4>
              <p>{event.organizer}</p>
            </div>

            <button className="btn-primary btn-register">
              Register for Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Event;