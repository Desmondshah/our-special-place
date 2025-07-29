import React from 'react';
import ResponsiveLayout from './ResponsiveLayout';
import './ResponsiveLayout.css';

const ResponsiveDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Layout Example */}
      <section className="mb-8">
        <ResponsiveLayout layoutType="dashboard">
          <div className="mb-6">
            <h2 className="fluid-text-2xl font-bold text-gray-900 mb-2">
              Dashboard Layout
            </h2>
            <p className="fluid-text-base text-gray-600">
              Optimized for data density and full-width utilization across all devices.
            </p>
          </div>
        </ResponsiveLayout>
      </section>

      {/* Content Layout Example */}
      <section className="mb-8">
        <ResponsiveLayout layoutType="content">
          <article className="content-width prose prose-gray max-w-none">
            <h2 className="fluid-text-2xl font-bold text-gray-900 mb-4">
              Content Layout - Reading Optimized
            </h2>
            <p className="fluid-text-base text-gray-700 leading-relaxed mb-4">
              This layout is specifically designed for readable content with optimal line length 
              (45-75 characters) across all device sizes. The text width is constrained using 
              the `ch` unit to ensure comfortable reading experiences.
            </p>
            <p className="fluid-text-base text-gray-700 leading-relaxed mb-4">
              Typography scales fluidly using `clamp()` functions, ensuring text remains 
              readable at all viewport sizes while maintaining proper proportions. This approach 
              eliminates the need for multiple breakpoint-specific font sizes.
            </p>
            <h3 className="fluid-text-xl font-semibold text-gray-900 mb-3">
              Key Features
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Optimal reading width (65ch) maintained across all devices</li>
              <li>Fluid typography that scales with viewport size</li>
              <li>Proper line height for comfortable reading</li>
              <li>Responsive spacing that adapts to available space</li>
            </ul>
          </article>
        </ResponsiveLayout>
      </section>

      {/* Gallery Layout Example */}
      <section className="mb-8">
        <ResponsiveLayout layoutType="gallery">
          <div className="mb-6">
            <h2 className="fluid-text-2xl font-bold text-gray-900 mb-2">
              Gallery Layout
            </h2>
            <p className="fluid-text-base text-gray-600">
              Responsive grid that adapts from 1 column on mobile to 6+ columns on ultra-wide displays.
            </p>
          </div>
        </ResponsiveLayout>
      </section>

      {/* Form Layout Example */}
      <section className="mb-8">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="fluid-text-2xl font-bold text-gray-900 mb-6 text-center">
            Form Layout Example
          </h2>
          
          <div className="form-width">
            <form className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target"
                  placeholder="you@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                  placeholder="Tell us about your project..."
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors touch-target"
                >
                  Send Message
                </button>
                <button
                  type="button"
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors touch-target"
                >
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Testing Grid for Different Breakpoints */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="fluid-text-2xl font-bold text-gray-900 mb-6 text-center">
          Responsive Grid Test
        </h2>
        
        <div className="responsive-grid grid-auto-fit-sm mb-8">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-lg border border-blue-200 text-center contain-layout"
            >
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {i + 1}
              </div>
              <div className="text-sm text-blue-700">
                Grid Item
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Device Testing Information */}
      <section className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="fluid-text-xl font-bold text-gray-900 mb-4">
            Testing Checklist
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Mobile Devices</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ iPhone SE (375×667) - Smallest modern mobile</li>
                <li>✓ iPhone 14 Pro (393×852) - Current standard</li>
                <li>✓ Touch targets minimum 44px height</li>
                <li>✓ Single column layout in portrait</li>
                <li>✓ Readable text without horizontal scroll</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Tablet Devices</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ iPad Mini (768×1024) - Smallest tablet</li>
                <li>✓ iPad Pro 11" (834×1194) - Medium tablet</li>
                <li>✓ iPad Pro 12.9" (1024×1366) - Large tablet</li>
                <li>✓ 2-3 column layouts in portrait</li>
                <li>✓ 3-4 column layouts in landscape</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Desktop Screens</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ MacBook Air (1440×900) - Laptop</li>
                <li>✓ Desktop 1080p (1920×1080) - Standard</li>
                <li>✓ Ultra-wide (2560×1440) - Large desktop</li>
                <li>✓ 4-6 column layouts</li>
                <li>✓ Content constraints on ultra-wide</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Performance & Accessibility</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ 200% zoom compatibility</li>
                <li>✓ Keyboard navigation support</li>
                <li>✓ Screen reader friendly markup</li>
                <li>✓ Proper contrast ratios</li>
                <li>✓ Lazy loading for images</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ResponsiveDemo;
