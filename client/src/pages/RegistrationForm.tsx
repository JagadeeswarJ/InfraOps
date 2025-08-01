import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  dietary?: string;
  specialRequests?: string;
}

const RegistrationForm: React.FC = () => {
  const { eventname } = useParams<{ eventname: string }>();
  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    dietary: '',
    specialRequests: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Simulate API call to register user
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Registration submitted:', formData);
      alert('Registration successful!');
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="registration-page">
      <div className="registration-container">
        <div className="registration-header">
          <h1>Register for {eventname}</h1>
          <p>Please fill out all required fields to complete your registration.</p>
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="company">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="jobTitle">Job Title</label>
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dietary">Dietary Restrictions</label>
            <input
              type="text"
              id="dietary"
              name="dietary"
              value={formData.dietary}
              onChange={handleInputChange}
              placeholder="e.g., Vegetarian, Gluten-free, etc."
            />
          </div>

          <div className="form-group">
            <label htmlFor="specialRequests">Special Requests</label>
            <textarea
              id="specialRequests"
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleInputChange}
              rows={4}
              placeholder="Any special accommodations or requests..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Registering...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;