import React, { useState } from 'react';

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  cta: string;
}

const Pricing: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans: PricingPlan[] = [
    {
      name: 'Free',
      price: billingPeriod === 'monthly' ? '$0' : '$0',
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      features: [
        'Up to 3 events',
        '50 attendees per event',
        'Basic analytics',
        'Email support',
        'Standard templates'
      ],
      cta: 'Get Started'
    },
    {
      name: 'Professional',
      price: billingPeriod === 'monthly' ? '$29' : '$290',
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      features: [
        'Unlimited events',
        '500 attendees per event',
        'Advanced analytics',
        'Custom branding',
        'Priority support',
        'Integration options',
        'Custom templates'
      ],
      popular: true,
      cta: 'Start Free Trial'
    },
    {
      name: 'Enterprise',
      price: billingPeriod === 'monthly' ? '$99' : '$990',
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      features: [
        'Unlimited events',
        'Unlimited attendees',
        'Premium analytics',
        'White-label solution',
        'Dedicated support',
        'API access',
        'Custom integrations',
        'SSO support'
      ],
      cta: 'Contact Sales'
    }
  ];

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1>Choose Your Plan</h1>
        <p>Select the perfect plan for your event management needs</p>
        
        <div className="billing-toggle">
          <span className={billingPeriod === 'monthly' ? 'active' : ''}>Monthly</span>
          <button 
            className="toggle-switch"
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
          >
            <div className={`toggle-slider ${billingPeriod === 'yearly' ? 'yearly' : ''}`}></div>
          </button>
          <span className={billingPeriod === 'yearly' ? 'active' : ''}>
            Yearly
            <span className="savings-badge">Save 20%</span>
          </span>
        </div>
      </div>

      <div className="pricing-grid">
        {plans.map((plan, index) => (
          <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
            {plan.popular && <div className="popular-badge">Most Popular</div>}
            
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="amount">{plan.price}</span>
                <span className="period">{plan.period}</span>
              </div>
            </div>

            <ul className="features-list">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex}>
                  <span className="checkmark">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button className={`btn-cta ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}>
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="pricing-faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>Can I change my plan anytime?</h4>
            <p>Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.</p>
          </div>
          <div className="faq-item">
            <h4>What payment methods do you accept?</h4>
            <p>We accept all major credit cards, PayPal, and bank transfers for enterprise plans.</p>
          </div>
          <div className="faq-item">
            <h4>Is there a free trial?</h4>
            <p>Yes, the Professional plan comes with a 14-day free trial. No credit card required.</p>
          </div>
          <div className="faq-item">
            <h4>Do you offer refunds?</h4>
            <p>We offer a 30-day money-back guarantee for all paid plans.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;