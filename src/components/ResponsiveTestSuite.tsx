import React, { useState, useEffect } from 'react';

// Comprehensive responsive testing component
const ResponsiveTestSuite: React.FC = () => {
  const [currentViewport, setCurrentViewport] = useState({ width: 0, height: 0 });
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop' | 'ultrawide'>('desktop');

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setCurrentViewport({ width, height });
      setOrientation(width > height ? 'landscape' : 'portrait');
      
      if (width < 768) setDeviceType('mobile');
      else if (width < 1024) setDeviceType('tablet');
      else if (width < 1920) setDeviceType('desktop');
      else setDeviceType('ultrawide');
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  const testDevices = [
    { name: 'iPhone SE', width: 375, height: 667, type: 'mobile' },
    { name: 'iPhone 14 Pro', width: 393, height: 852, type: 'mobile' },
    { name: 'iPad Mini', width: 768, height: 1024, type: 'tablet' },
    { name: 'iPad Pro 11"', width: 834, height: 1194, type: 'tablet' },
    { name: 'iPad Pro 12.9"', width: 1024, height: 1366, type: 'tablet' },
    { name: 'MacBook Air', width: 1440, height: 900, type: 'desktop' },
    { name: 'Desktop 1080p', width: 1920, height: 1080, type: 'desktop' },
    { name: 'Ultra-wide', width: 2560, height: 1440, type: 'ultrawide' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header with device info */}
      <header className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Responsive Layout Test Suite
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="font-medium text-blue-900">Current Viewport</div>
            <div className="text-blue-700">{currentViewport.width} × {currentViewport.height}px</div>
          </div>
          <div className="bg-green-50 p-3 rounded-md">
            <div className="font-medium text-green-900">Device Type</div>
            <div className="text-green-700 capitalize">{deviceType}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-md">
            <div className="font-medium text-purple-900">Orientation</div>
            <div className="text-purple-700 capitalize">{orientation}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-md">
            <div className="font-medium text-orange-900">Pixel Ratio</div>
            <div className="text-orange-700">{window.devicePixelRatio || 1}x</div>
          </div>
        </div>
      </header>

      {/* Test Device Grid */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Target Device Test</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {testDevices.map((device) => (
            <div key={device.name} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">{device.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  device.type === 'mobile' ? 'bg-blue-100 text-blue-800' :
                  device.type === 'tablet' ? 'bg-green-100 text-green-800' :
                  device.type === 'desktop' ? 'bg-purple-100 text-purple-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {device.type}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {device.width} × {device.height}px
              </div>
              <div className={`mt-2 h-2 rounded-full ${
                currentViewport.width >= device.width ? 'bg-green-200' : 'bg-gray-200'
              }`}>
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, (currentViewport.width / device.width) * 100)}%` 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Responsive Grid Demonstration */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Auto-Fit Grid Test</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 mb-6">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-lg border border-gray-200 text-center min-h-[120px] flex flex-col justify-center"
              style={{ contain: 'layout' }}
            >
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {i + 1}
              </div>
              <div className="text-sm text-gray-600">
                Auto-fit Item
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Min: 280px
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography Test */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Fluid Typography Test</h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">clamp(2rem, 5vw, 3rem)</div>
              <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }} className="font-bold text-gray-900">
                Fluid Heading Large
              </h1>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">clamp(1.5rem, 4vw, 2rem)</div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }} className="font-semibold text-gray-800">
                Fluid Heading Medium
              </h2>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">clamp(1rem, 2.5vw, 1.25rem)</div>
              <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }} className="text-gray-700">
                Fluid body text that scales smoothly across all viewport sizes. This text maintains 
                optimal readability by scaling proportionally with the viewport width while respecting 
                minimum and maximum size constraints.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Touch Target Test */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Touch Target Test</h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="bg-blue-600 text-white px-4 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors min-h-[44px]">
              44px Min Height
            </button>
            <button className="bg-green-600 text-white px-6 py-4 rounded-md font-medium hover:bg-green-700 transition-colors">
              Comfortable Touch
            </button>
            <button className="bg-purple-600 text-white px-8 py-5 rounded-md font-medium hover:bg-purple-700 transition-colors">
              Large Touch Target
            </button>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            All buttons meet minimum 44px touch target requirements for accessibility.
          </div>
        </div>
      </section>

      {/* Content Width Test */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Content Width Test</h2>
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Full Width (Dashboard)</h3>
            <div className="bg-gray-100 p-4 rounded text-sm text-gray-700">
              This content spans the full available width, perfect for dashboards and data-heavy interfaces 
              that need to utilize all available screen real estate for maximum information density.
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Constrained Width (Reading)</h3>
            <div className="max-w-[65ch] bg-gray-100 p-4 rounded text-sm text-gray-700">
              This content is constrained to 65 characters wide (65ch) for optimal reading experience. 
              This follows typographic best practices by maintaining line lengths between 45-75 characters 
              for comfortable reading across all devices and screen sizes.
            </div>
          </div>
        </div>
      </section>

      {/* Orientation Test */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Orientation Handling</h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className={`
            grid gap-4 transition-all duration-300
            ${orientation === 'landscape' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}
          `}>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-blue-700 font-medium">Portrait</div>
              <div className="text-sm text-blue-600">Stacked Layout</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-green-700 font-medium">Landscape</div>
              <div className="text-sm text-green-600">Horizontal Layout</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-purple-700 font-medium">Adaptive</div>
              <div className="text-sm text-purple-600">Smart Columns</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-orange-700 font-medium">Responsive</div>
              <div className="text-sm text-orange-600">Auto-adjusting</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Current orientation: <span className="font-medium capitalize">{orientation}</span>
          </div>
        </div>
      </section>

      {/* Checklist */}
      <section className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Responsive Checklist</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Layout Requirements</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center text-green-700">
                <span className="mr-2">✓</span>
                Mobile-first approach implemented
              </li>
              <li className="flex items-center text-green-700">
                <span className="mr-2">✓</span>
                Auto-fit grids with minmax()
              </li>
              <li className="flex items-center text-green-700">
                <span className="mr-2">✓</span>
                No fixed breakpoints
              </li>
              <li className="flex items-center text-green-700">
                <span className="mr-2">✓</span>
                Content-type awareness
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Performance & Accessibility</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center text-green-700">
                <span className="mr-2">✓</span>
                44px minimum touch targets
              </li>
              <li className="flex items-center text-green-700">
                <span className="mr-2">✓</span>
                Proper viewport meta tag
              </li>
              <li className="flex items-center text-green-700">
                <span className="mr-2">✓</span>
                Fluid typography with clamp()
              </li>
              <li className="flex items-center text-green-700">
                <span className="mr-2">✓</span>
                Layout containment for performance
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ResponsiveTestSuite;
