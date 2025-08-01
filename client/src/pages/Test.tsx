import React, { useState, useEffect } from 'react';

interface TestResult {
  id: string;
  name: string;
  status: 'passing' | 'failing' | 'pending';
  duration: number;
  error?: string;
}

const Test: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  useEffect(() => {
    // Mock test data
    const mockTests: TestResult[] = [
      {
        id: '1',
        name: 'User Authentication Flow',
        status: 'passing',
        duration: 1250
      },
      {
        id: '2',
        name: 'Event Registration Process',
        status: 'passing',
        duration: 890
      },
      {
        id: '3',
        name: 'Payment Processing',
        status: 'failing',
        duration: 2340,
        error: 'Timeout error: Payment gateway did not respond within 30 seconds'
      },
      {
        id: '4',
        name: 'Email Notification System',
        status: 'passing',
        duration: 456
      },
      {
        id: '5',
        name: 'Event Calendar Integration',
        status: 'pending',
        duration: 0
      },
      {
        id: '6',
        name: 'Dashboard Analytics Loading',
        status: 'passing',
        duration: 1120
      }
    ];
    
    setTests(mockTests);
  }, []);

  const runAllTests = async () => {
    setIsRunning(true);
    
    // Simulate running tests
    for (let i = 0; i < tests.length; i++) {
      setTimeout(() => {
        setTests(prevTests => 
          prevTests.map((test, index) => 
            index === i 
              ? { ...test, status: Math.random() > 0.8 ? 'failing' : 'passing' as const }
              : test
          )
        );
      }, i * 500);
    }
    
    setTimeout(() => {
      setIsRunning(false);
    }, tests.length * 500);
  };

  const runSingleTest = (testId: string) => {
    setTests(prevTests =>
      prevTests.map(test =>
        test.id === testId
          ? { ...test, status: 'pending' as const }
          : test
      )
    );

    setTimeout(() => {
      setTests(prevTests =>
        prevTests.map(test =>
          test.id === testId
            ? { ...test, status: Math.random() > 0.7 ? 'failing' : 'passing' as const, duration: Math.floor(Math.random() * 2000) + 100 }
            : test
        )
      );
    }, 1000);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passing': return '✅';
      case 'failing': return '❌';
      case 'pending': return '⏳';
      default: return '⚪';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passing': return '#10b981';
      case 'failing': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const passingTests = tests.filter(test => test.status === 'passing').length;
  const failingTests = tests.filter(test => test.status === 'failing').length;
  const pendingTests = tests.filter(test => test.status === 'pending').length;

  return (
    <div className="test-page">
      <div className="test-header">
        <h1>Test Dashboard</h1>
        <p>Monitor and run tests for the Bitnap platform</p>
        
        <div className="test-stats">
          <div className="stat-item">
            <span className="stat-number" style={{ color: '#10b981' }}>{passingTests}</span>
            <span className="stat-label">Passing</span>
          </div>
          <div className="stat-item">
            <span className="stat-number" style={{ color: '#ef4444' }}>{failingTests}</span>
            <span className="stat-label">Failing</span>
          </div>
          <div className="stat-item">
            <span className="stat-number" style={{ color: '#f59e0b' }}>{pendingTests}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{tests.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
      </div>

      <div className="test-controls">
        <button 
          className="btn-primary"
          onClick={runAllTests}
          disabled={isRunning}
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>
        
        <div className="test-filters">
          <button className="filter-btn active">All</button>
          <button className="filter-btn">Passing</button>
          <button className="filter-btn">Failing</button>
          <button className="filter-btn">Pending</button>
        </div>
      </div>

      <div className="test-content">
        <div className="test-list">
          {tests.map(test => (
            <div 
              key={test.id} 
              className={`test-item ${selectedTest === test.id ? 'selected' : ''}`}
              onClick={() => setSelectedTest(test.id)}
            >
              <div className="test-status">
                <span className="status-icon">{getStatusIcon(test.status)}</span>
              </div>
              
              <div className="test-info">
                <h3 className="test-name">{test.name}</h3>
                <div className="test-meta">
                  <span 
                    className="test-status-text"
                    style={{ color: getStatusColor(test.status) }}
                  >
                    {test.status.toUpperCase()}
                  </span>
                  {test.duration > 0 && (
                    <span className="test-duration">{test.duration}ms</span>
                  )}
                </div>
              </div>
              
              <div className="test-actions">
                <button 
                  className="btn-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    runSingleTest(test.id);
                  }}
                  title="Run test"
                >
                  ▶️
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="test-details">
          {selectedTest ? (
            <div className="test-detail-panel">
              {(() => {
                const test = tests.find(t => t.id === selectedTest);
                if (!test) return null;
                
                return (
                  <>
                    <div className="detail-header">
                      <h2>{test.name}</h2>
                      <div className="detail-status">
                        <span className="status-icon">{getStatusIcon(test.status)}</span>
                        <span 
                          className="status-text"
                          style={{ color: getStatusColor(test.status) }}
                        >
                          {test.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="detail-content">
                      <div className="detail-section">
                        <h4>Test Information</h4>
                        <div className="info-grid">
                          <div className="info-item">
                            <label>Status:</label>
                            <span style={{ color: getStatusColor(test.status) }}>
                              {test.status}
                            </span>
                          </div>
                          <div className="info-item">
                            <label>Duration:</label>
                            <span>{test.duration}ms</span>
                          </div>
                          <div className="info-item">
                            <label>Last Run:</label>
                            <span>2 minutes ago</span>
                          </div>
                        </div>
                      </div>

                      {test.error && (
                        <div className="detail-section">
                          <h4>Error Details</h4>
                          <div className="error-box">
                            <pre>{test.error}</pre>
                          </div>
                        </div>
                      )}

                      <div className="detail-section">
                        <h4>Test Steps</h4>
                        <ol className="step-list">
                          <li>Initialize test environment</li>
                          <li>Execute test scenario</li>
                          <li>Validate expected outcomes</li>
                          <li>Clean up test data</li>
                        </ol>
                      </div>

                      <div className="detail-actions">
                        <button 
                          className="btn-primary"
                          onClick={() => runSingleTest(test.id)}
                        >
                          Run Test
                        </button>
                        <button className="btn-secondary">
                          View Logs
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="no-selection">
              <p>Select a test to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Test;