import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to Bitnap</h1>
        <p>Your premier event management platform</p>
        <div className="cta-buttons">
          <button className="btn-primary">Get Started</button>
          <button className="btn-secondary">Learn More</button>
        </div>
      </div>
      
      <div className="features-preview">
        <h2>Why Choose Bitnap?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Easy Event Creation</h3>
            <p>Create and manage events with our intuitive tools</p>
          </div>
          <div className="feature-card">
            <h3>Registration Management</h3>
            <p>Streamlined registration process for your attendees</p>
          </div>
          <div className="feature-card">
            <h3>Real-time Analytics</h3>
            <p>Track your event performance with detailed insights</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;