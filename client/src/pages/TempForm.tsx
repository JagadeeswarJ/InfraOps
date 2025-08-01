import React, { useState } from 'react';

interface FormData {
  eventType: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  description: string;
  capacity: number;
  isPublic: boolean;
  requiresApproval: boolean;
  ticketPrice: number;
  tags: string[];
}

const TempForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    eventType: '',
    eventName: '',
    eventDate: '',
    eventTime: '',
    location: '',
    description: '',
    capacity: 100,
    isPublic: true,
    requiresApproval: false,
    ticketPrice: 0,
    tags: []
  });

  const totalSteps = 3;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission logic here
    alert('Event created successfully!');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="form-step">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="eventType">Event Type *</label>
              <select
                id="eventType"
                name="eventType"
                value={formData.eventType}
                onChange={handleInputChange}
                required
              >
                <option value="">Select event type</option>
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
                <option value="seminar">Seminar</option>
                <option value="networking">Networking</option>
                <option value="webinar">Webinar</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="eventName">Event Name *</label>
              <input
                type="text"
                id="eventName"
                name="eventName"
                value={formData.eventName}
                onChange={handleInputChange}
                placeholder="Enter event name"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="eventDate">Event Date *</label>
                <input
                  type="date"
                  id="eventDate"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="eventTime">Event Time *</label>
                <input
                  type="time"
                  id="eventTime"
                  name="eventTime"
                  value={formData.eventTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="location">Location *</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Event location or 'Online'"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="form-step">
            <h2>Event Details</h2>
            
            <div className="form-group">
              <label htmlFor="description">Event Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                placeholder="Describe your event..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="capacity">Event Capacity</label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                min="1"
                max="10000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (comma-separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags.join(', ')}
                onChange={handleTagsChange}
                placeholder="technology, networking, startup, etc."
              />
            </div>

            <div className="form-group">
              <label htmlFor="ticketPrice">Ticket Price ($)</label>
              <input
                type="number"
                id="ticketPrice"
                name="ticketPrice"
                value={formData.ticketPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="form-step">
            <h2>Event Settings</h2>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                />
                <span className="checkmark"></span>
                Make this event public
              </label>
              <p className="helper-text">Public events can be discovered by anyone</p>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="requiresApproval"
                  checked={formData.requiresApproval}
                  onChange={handleInputChange}
                />
                <span className="checkmark"></span>
                Require approval for registration
              </label>
              <p className="helper-text">You'll need to approve each registration manually</p>
            </div>

            <div className="form-summary">
              <h3>Event Summary</h3>
              <div className="summary-item">
                <strong>Event:</strong> {formData.eventName || 'Not specified'}
              </div>
              <div className="summary-item">
                <strong>Type:</strong> {formData.eventType || 'Not specified'}
              </div>
              <div className="summary-item">
                <strong>Date & Time:</strong> {formData.eventDate} at {formData.eventTime}
              </div>
              <div className="summary-item">
                <strong>Location:</strong> {formData.location || 'Not specified'}
              </div>
              <div className="summary-item">
                <strong>Capacity:</strong> {formData.capacity} attendees
              </div>
              <div className="summary-item">
                <strong>Price:</strong> {formData.ticketPrice === 0 ? 'Free' : `$${formData.ticketPrice}`}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="temp-form-page">
      <div className="form-container">
        <div className="form-header">
          <h1>Create New Event</h1>
          <div className="progress-bar">
            <div className="progress-steps">
              {[1, 2, 3].map(step => (
                <div 
                  key={step}
                  className={`progress-step ${currentStep >= step ? 'active' : ''}`}
                >
                  <span className="step-number">{step}</span>
                  <span className="step-label">
                    {step === 1 ? 'Basic Info' : step === 2 ? 'Details' : 'Settings'}
                  </span>
                </div>
              ))}
            </div>
            <div className="progress-fill" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="multi-step-form">
          {renderStep()}

          <div className="form-actions">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="btn-secondary">
                Previous
              </button>
            )}
            
            {currentStep < totalSteps ? (
              <button type="button" onClick={nextStep} className="btn-primary">
                Next
              </button>
            ) : (
              <button type="submit" className="btn-primary">
                Create Event
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TempForm;