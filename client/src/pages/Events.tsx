import React, { useState, useEffect } from 'react';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image?: string;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate API call to fetch events
    const fetchEvents = async () => {
      try {
        // Replace with actual API call
        const mockEvents: Event[] = [
          {
            id: '1',
            title: 'Tech Conference 2024',
            description: 'Annual technology conference featuring the latest innovations',
            date: '2024-03-15',
            location: 'San Francisco, CA'
          },
          {
            id: '2',
            title: 'Digital Marketing Summit',
            description: 'Learn from industry experts about digital marketing trends',
            date: '2024-04-20',
            location: 'New York, NY'
          }
        ];
        
        setEvents(mockEvents);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading events...</div>;
  }

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>Upcoming Events</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="events-grid">
        {filteredEvents.map(event => (
          <div key={event.id} className="event-card">
            <div className="event-image">
              {event.image ? (
                <img src={event.image} alt={event.title} />
              ) : (
                <div className="placeholder-image">📅</div>
              )}
            </div>
            <div className="event-content">
              <h3>{event.title}</h3>
              <p className="event-description">{event.description}</p>
              <div className="event-details">
                <span className="event-date">📅 {new Date(event.date).toLocaleDateString()}</span>
                <span className="event-location">📍 {event.location}</span>
              </div>
              <button className="btn-primary">View Details</button>
            </div>
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="no-events">
          <p>No events found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default Events;