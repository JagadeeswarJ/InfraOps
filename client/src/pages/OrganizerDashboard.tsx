import React, { useState, useEffect } from 'react';

interface DashboardStats {
  totalEvents: number;
  totalRegistrations: number;
  upcomingEvents: number;
  revenue: number;
}

interface RecentEvent {
  id: string;
  title: string;
  date: string;
  registrations: number;
  status: 'upcoming' | 'ongoing' | 'completed';
}

const OrganizerDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalRegistrations: 0,
    upcomingEvents: 0,
    revenue: 0
  });
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API calls
    const fetchDashboardData = async () => {
      try {
        // Mock data
        const mockStats: DashboardStats = {
          totalEvents: 24,
          totalRegistrations: 1248,
          upcomingEvents: 6,
          revenue: 12450
        };

        const mockEvents: RecentEvent[] = [
          {
            id: '1',
            title: 'Tech Conference 2024',
            date: '2024-03-15',
            registrations: 234,
            status: 'upcoming'
          },
          {
            id: '2',
            title: 'Digital Marketing Workshop',
            date: '2024-03-10',
            registrations: 89,
            status: 'completed'
          },
          {
            id: '3',
            title: 'Startup Networking Event',
            date: '2024-03-20',
            registrations: 156,
            status: 'upcoming'
          },
          {
            id: '4',
            title: 'AI & ML Symposium',
            date: '2024-03-12',
            registrations: 312,
            status: 'ongoing'
          }
        ];

        setStats(mockStats);
        setRecentEvents(mockEvents);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: RecentEvent['status']) => {
    switch (status) {
      case 'upcoming': return '#3b82f6';
      case 'ongoing': return '#10b981';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Organizer Dashboard</h1>
        <p>Welcome back! Here's what's happening with your events.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.totalEvents}</h3>
            <p>Total Events</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalRegistrations.toLocaleString()}</h3>
            <p>Total Registrations</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>{stats.upcomingEvents}</h3>
            <p>Upcoming Events</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>${stats.revenue.toLocaleString()}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-main">
          <section className="recent-events">
            <div className="section-header">
              <h2>Recent Events</h2>
              <button className="btn-secondary">View All</button>
            </div>
            
            <div className="events-table">
              <div className="table-header">
                <span>Event Name</span>
                <span>Date</span>
                <span>Registrations</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              
              {recentEvents.map(event => (
                <div key={event.id} className="table-row">
                  <span className="event-name">{event.title}</span>
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                  <span>{event.registrations}</span>
                  <span>
                    <div 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(event.status) }}
                    >
                      {event.status}
                    </div>
                  </span>
                  <span className="actions">
                    <button className="btn-link">View</button>
                    <button className="btn-link">Edit</button>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button className="action-btn">
                <span className="action-icon">➕</span>
                <span>Create New Event</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">📊</span>
                <span>View Analytics</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">💬</span>
                <span>Send Announcement</span>
              </button>
              <button className="action-btn">
                <span className="action-icon">⚙️</span>
                <span>Event Settings</span>
              </button>
            </div>
          </section>
        </div>

        <div className="dashboard-sidebar">
          <div className="activity-feed">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">👤</div>
                <div className="activity-content">
                  <p>New registration for Tech Conference 2024</p>
                  <span className="activity-time">2 hours ago</span>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon">📝</div>
                <div className="activity-content">
                  <p>Event details updated for Workshop</p>
                  <span className="activity-time">5 hours ago</span>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon">💰</div>
                <div className="activity-content">
                  <p>Payment received from attendee</p>
                  <span className="activity-time">1 day ago</span>
                </div>
              </div>
            </div>
          </div>

          <div className="upcoming-deadlines">
            <h3>Upcoming Deadlines</h3>
            <div className="deadline-list">
              <div className="deadline-item">
                <div className="deadline-date">Mar 10</div>
                <div className="deadline-content">
                  <p>Early bird pricing ends</p>
                  <span>Tech Conference 2024</span>
                </div>
              </div>
              
              <div className="deadline-item">
                <div className="deadline-date">Mar 12</div>
                <div className="deadline-content">
                  <p>Final registration deadline</p>
                  <span>Marketing Workshop</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;