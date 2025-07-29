import React, { useState } from 'react';

const BrutalistDemo: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState('buttons');
  const [progress, setProgress] = useState(65);
  const [showNotification, setShowNotification] = useState(false);

  const demoSections = [
    { id: 'buttons', label: 'BUTTONS', icon: '🔲' },
    { id: 'forms', label: 'FORMS', icon: '📝' },
    { id: 'cards', label: 'CARDS', icon: '🎴' },
    { id: 'notifications', label: 'ALERTS', icon: '⚠️' },
  ];

  const handleNotificationDemo = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  return (
    <div className="space-y-8">
      <div className="brutal-mega-card p-8">
        <h2 className="brutal-title-small text-center mb-6" data-text="BRUTALIST PIXEL UI DEMO">
          BRUTALIST PIXEL UI DEMO
        </h2>
        <div className="brutal-divider"></div>
        
        {/* Demo Navigation */}
        <div className="brutal-tab-container mb-8">
          {demoSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setSelectedDemo(section.id)}
              className={`brutal-tab-button ${
                selectedDemo === section.id ? 'brutal-tab-active' : 'brutal-tab-inactive'
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>

        {/* Demo Content */}
        <div className="brutal-content-area">
          {selectedDemo === 'buttons' && (
            <div className="space-y-6">
              <h3 className="brutal-text-accent text-xl mb-4">⚡ BUTTON VARIANTS ⚡</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="brutal-button">DEFAULT BUTTON</button>
                <button className="brutal-button brutal-button-primary">PRIMARY ACTION</button>
                <button className="brutal-button brutal-button-success">SUCCESS STATE</button>
                <button className="brutal-button brutal-button-danger">DANGER ZONE</button>
                <button className="brutal-icon-button">🚀</button>
                <button className="brutal-icon-button">💎</button>
              </div>
            </div>
          )}

          {selectedDemo === 'forms' && (
            <div className="space-y-6">
              <h3 className="brutal-text-accent text-xl mb-4">📝 FORM ELEMENTS 📝</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="brutal-form-group">
                  <label className="brutal-form-label">Username</label>
                  <div className="brutal-input-container">
                    <input 
                      type="text" 
                      className="brutal-input" 
                      placeholder="ENTER USERNAME..."
                    />
                  </div>
                </div>
                
                <div className="brutal-form-group">
                  <label className="brutal-form-label">Email</label>
                  <div className="brutal-input-container">
                    <input 
                      type="email" 
                      className="brutal-input" 
                      placeholder="USER@DOMAIN.COM"
                    />
                  </div>
                </div>

                <div className="brutal-form-group">
                  <label className="brutal-form-label">Message</label>
                  <div className="brutal-input-container">
                    <textarea 
                      className="brutal-input" 
                      placeholder="TYPE YOUR MESSAGE HERE..."
                      rows={4}
                    ></textarea>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="brutal-checkbox" id="demo-check" />
                    <label htmlFor="demo-check" className="brutal-text-primary">
                      I AGREE TO TERMS
                    </label>
                  </div>
                  
                  <div className="brutal-form-group">
                    <label className="brutal-form-label">Progress</label>
                    <div className="brutal-progress">
                      <div 
                        className="brutal-progress-fill" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <button 
                        className="brutal-button brutal-button-primary text-sm px-3 py-1"
                        onClick={() => setProgress(Math.max(0, progress - 10))}
                      >
                        -10%
                      </button>
                      <span className="brutal-text-accent">{progress}%</span>
                      <button 
                        className="brutal-button brutal-button-success text-sm px-3 py-1"
                        onClick={() => setProgress(Math.min(100, progress + 10))}
                      >
                        +10%
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedDemo === 'cards' && (
            <div className="space-y-6">
              <h3 className="brutal-text-accent text-xl mb-4">🎴 CARD LAYOUTS 🎴</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="brutal-card p-6">
                  <h4 className="brutal-text-primary text-lg mb-3">Standard Card</h4>
                  <p className="brutal-text-secondary">
                    This is a standard brutalist card with sharp edges and bold shadows.
                  </p>
                  <div className="mt-4">
                    <button className="brutal-button">LEARN MORE</button>
                  </div>
                </div>

                <div className="brutal-card brutal-card-primary p-6">
                  <h4 className="brutal-text-primary text-lg mb-3">Primary Card</h4>
                  <p className="brutal-text-secondary">
                    Enhanced primary card with accent styling and hover effects.
                  </p>
                  <div className="mt-4">
                    <button className="brutal-button brutal-button-primary">ACTION</button>
                  </div>
                </div>

                <div className="brutal-mega-card p-6">
                  <h4 className="brutal-text-accent text-lg mb-3">💥 MEGA CARD 💥</h4>
                  <p className="brutal-text-secondary">
                    Ultra-aggressive mega card with maximum visual impact and pixel patterns.
                  </p>
                  <div className="mt-4 space-x-2">
                    <button className="brutal-button brutal-button-success">✓ ACCEPT</button>
                    <button className="brutal-button brutal-button-danger">✗ REJECT</button>
                  </div>
                </div>

                <div className="brutal-list-item">
                  <h4 className="brutal-text-primary text-lg mb-2">List Item Style</h4>
                  <p className="brutal-text-secondary text-sm">
                    Special list item with corner decorations and hover animations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedDemo === 'notifications' && (
            <div className="space-y-6">
              <h3 className="brutal-text-accent text-xl mb-4">⚠️ ALERT SYSTEM ⚠️</h3>
              
              <div className="space-y-4">
                <button 
                  className="brutal-button brutal-button-primary"
                  onClick={handleNotificationDemo}
                >
                  TRIGGER NOTIFICATION
                </button>

                <div className="brutal-notification">
                  <div className="pl-8">
                    <h4 className="brutal-text-primary font-bold">Default Alert</h4>
                    <p className="brutal-text-secondary">This is a standard brutalist notification.</p>
                  </div>
                </div>

                <div className="brutal-notification brutal-notification-success">
                  <div className="pl-8">
                    <h4 className="brutal-text-primary font-bold">Success Alert</h4>
                    <p className="brutal-text-secondary">Operation completed successfully!</p>
                  </div>
                </div>

                <div className="brutal-notification brutal-notification-error">
                  <div className="pl-8">
                    <h4 className="brutal-text-primary font-bold">Error Alert</h4>
                    <p className="brutal-text-secondary">Something went wrong. Please try again.</p>
                  </div>
                </div>

                <div className="flex items-center justify-center p-8">
                  <div className="brutal-loading"></div>
                  <span className="ml-4 brutal-text-accent">LOADING PIXEL DATA...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-[brutalSlideIn_0.5s_ease-out]">
          <div className="brutal-notification brutal-notification-success">
            <div className="pl-8">
              <h4 className="brutal-text-primary font-bold">DEMO ACTIVATED!</h4>
              <p className="brutal-text-secondary">Brutalist notification system online.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrutalistDemo;
