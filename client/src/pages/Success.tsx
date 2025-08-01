import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Success: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get success message from URL params or state
  const searchParams = new URLSearchParams(location.search);
  const type = searchParams.get('type') || 'general';
  const eventName = searchParams.get('event') || '';
  
  const getSuccessContent = () => {
    switch (type) {
      case 'registration':
        return {
          icon: '🎉',
          title: 'Registration Successful!',
          message: `You have successfully registered for ${eventName}. Check your email for confirmation details.`,
          actions: [
            { label: 'View Event Details', action: () => navigate(`/events/${eventName}`) },
            { label: 'Browse More Events', action: () => navigate('/events') }
          ]
        };
      
      case 'event-creation':
        return {
          icon: '✅',
          title: 'Event Created Successfully!',
          message: `Your event "${eventName}" has been created and is now live.`,
          actions: [
            { label: 'View Your Event', action: () => navigate(`/events/${eventName}`) },
            { label: 'Go to Dashboard', action: () => navigate('/event/orgdsh') }
          ]
        };
      
      case 'payment':
        return {
          icon: '💳',
          title: 'Payment Successful!',
          message: 'Your payment has been processed successfully. You will receive a receipt via email.',
          actions: [
            { label: 'View Receipt', action: () => navigate('/profile') },
            { label: 'Back to Events', action: () => navigate('/events') }
          ]
        };
      
      case 'subscription':
        return {
          icon: '🚀',
          title: 'Welcome to Bitnap Pro!',
          message: 'Your subscription has been activated. You now have access to all premium features.',
          actions: [
            { label: 'Explore Features', action: () => navigate('/features') },
            { label: 'Create Your First Event', action: () => navigate('/form') }
          ]
        };
      
      default:
        return {
          icon: '✨',
          title: 'Success!',
          message: 'Your action has been completed successfully.',
          actions: [
            { label: 'Go Home', action: () => navigate('/') },
            { label: 'Browse Events', action: () => navigate('/events') }
          ]
        };
    }
  };

  const content = getSuccessContent();

  return (
    <div className="success-page">
      <div className="success-container">
        <div className="success-content">
          <div className="success-icon">
            {content.icon}
          </div>
          
          <h1 className="success-title">
            {content.title}
          </h1>
          
          <p className="success-message">
            {content.message}
          </p>
          
          <div className="success-actions">
            {content.actions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={index === 0 ? 'btn-primary' : 'btn-secondary'}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="success-details">
          <div className="detail-card">
            <h3>What's Next?</h3>
            <ul>
              {type === 'registration' && (
                <>
                  <li>Check your email for event details and calendar invite</li>
                  <li>Join our event community for updates</li>
                  <li>Prepare any required materials</li>
                </>
              )}
              
              {type === 'event-creation' && (
                <>
                  <li>Share your event with potential attendees</li>
                  <li>Monitor registrations in your dashboard</li>
                  <li>Set up event reminders and communications</li>
                </>
              )}
              
              {(type === 'payment' || type === 'subscription') && (
                <>
                  <li>Receipt will be sent to your email</li>
                  <li>Access premium features in your dashboard</li>
                  <li>Contact support if you have any questions</li>
                </>
              )}
              
              {type === 'general' && (
                <>
                  <li>Explore more features on our platform</li>
                  <li>Join our community for updates</li>
                  <li>Contact support if you need help</li>
                </>
              )}
            </ul>
          </div>
          
          <div className="support-info">
            <h4>Need Help?</h4>
            <p>
              If you have any questions or issues, don't hesitate to reach out to our support team.
            </p>
            <button className="btn-link">Contact Support</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Success;