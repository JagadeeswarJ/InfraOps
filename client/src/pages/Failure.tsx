import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Failure: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get error details from URL params or state
  const searchParams = new URLSearchParams(location.search);
  const type = searchParams.get('type') || 'general';
  const reason = searchParams.get('reason') || '';
  const eventName = searchParams.get('event') || '';
  
  const getFailureContent = () => {
    switch (type) {
      case 'registration':
        return {
          icon: '❌',
          title: 'Registration Failed',
          message: `We couldn't complete your registration for ${eventName}. ${reason || 'Please try again.'}`,
          troubleshooting: [
            'Check your internet connection',
            'Verify all required fields are filled correctly',
            'Ensure the event is still accepting registrations',
            'Clear your browser cache and try again'
          ],
          actions: [
            { label: 'Try Again', action: () => navigate(`/events/${eventName}/register`) },
            { label: 'Contact Support', action: () => navigate('/support') }
          ]
        };
      
      case 'payment':
        return {
          icon: '💳',
          title: 'Payment Failed',
          message: `Your payment could not be processed. ${reason || 'Please check your payment details and try again.'}`,
          troubleshooting: [
            'Verify your card details are correct',
            'Check if your card has sufficient funds',
            'Ensure your card is not expired',
            'Try a different payment method'
          ],
          actions: [
            { label: 'Retry Payment', action: () => window.history.back() },
            { label: 'Use Different Payment Method', action: () => navigate('/pricing') }
          ]
        };
      
      case 'event-creation':
        return {
          icon: '📅',
          title: 'Event Creation Failed',
          message: `We couldn't create your event "${eventName}". ${reason || 'Please review your information and try again.'}`,
          troubleshooting: [
            'Check all required fields are completed',
            'Verify event date is in the future',
            'Ensure event capacity is a valid number',
            'Check if you have reached your event limit'
          ],
          actions: [
            { label: 'Edit and Retry', action: () => navigate('/form') },
            { label: 'Save as Draft', action: () => navigate('/event/orgdsh') }
          ]
        };
      
      case 'login':
        return {
          icon: '🔐',
          title: 'Login Failed',
          message: `We couldn't log you in. ${reason || 'Please check your credentials and try again.'}`,
          troubleshooting: [
            'Verify your email and password are correct',
            'Check if Caps Lock is on',
            'Reset your password if forgotten',
            'Clear browser cookies and cache'
          ],
          actions: [
            { label: 'Try Again', action: () => navigate('/login') },
            { label: 'Reset Password', action: () => navigate('/reset-password') }
          ]
        };
      
      default:
        return {
          icon: '⚠️',
          title: 'Something Went Wrong',
          message: `We encountered an unexpected error. ${reason || 'Please try again later.'}`,
          troubleshooting: [
            'Refresh the page and try again',
            'Check your internet connection',
            'Clear your browser cache',
            'Try using a different browser'
          ],
          actions: [
            { label: 'Try Again', action: () => window.location.reload() },
            { label: 'Go Home', action: () => navigate('/') }
          ]
        };
    }
  };

  const content = getFailureContent();

  return (
    <div className="failure-page">
      <div className="failure-container">
        <div className="failure-content">
          <div className="failure-icon">
            {content.icon}
          </div>
          
          <h1 className="failure-title">
            {content.title}
          </h1>
          
          <p className="failure-message">
            {content.message}
          </p>
          
          <div className="failure-actions">
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
        
        <div className="failure-details">
          <div className="troubleshooting-card">
            <h3>Troubleshooting Tips</h3>
            <ul>
              {content.troubleshooting.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
          
          <div className="error-info">
            <h4>Error Details</h4>
            <div className="error-details">
              <p><strong>Error Type:</strong> {type}</p>
              {reason && <p><strong>Reason:</strong> {reason}</p>}
              <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
            </div>
          </div>
          
          <div className="support-info">
            <h4>Still Need Help?</h4>
            <p>
              If the problem persists, please contact our support team with the error details above.
            </p>
            <button 
              className="btn-link"
              onClick={() => navigate('/support')}
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Failure;