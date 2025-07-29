import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for different content layouts
type LayoutType = 'dashboard' | 'content' | 'gallery' | 'form';

interface ResponsiveLayoutProps {
  layoutType?: LayoutType;
  children?: React.ReactNode;
  className?: string;
}

interface GridItem {
  id: string;
  title: string;
  content: string;
  image?: string;
  type: 'card' | 'article' | 'stat' | 'form';
}

// Hook for device detection and orientation
const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    orientation: typeof window !== 'undefined' && window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    deviceType: 'desktop' as 'mobile' | 'tablet' | 'desktop' | 'ultrawide'
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = width > height ? 'landscape' : 'portrait';
      
      let deviceType: 'mobile' | 'tablet' | 'desktop' | 'ultrawide';
      if (width < 768) deviceType = 'mobile';
      else if (width < 1024) deviceType = 'tablet';
      else if (width < 1920) deviceType = 'desktop';
      else deviceType = 'ultrawide';

      setDeviceInfo({ width, height, orientation, deviceType });
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
};

// Sample data for demonstration
const sampleItems: GridItem[] = [
  {
    id: '1',
    title: 'Dashboard Analytics',
    content: 'Revenue increased by 24% this month with strong performance across all channels.',
    type: 'stat'
  },
  {
    id: '2',
    title: 'User Engagement',
    content: 'Daily active users reached a new high of 15,000 with 89% retention rate.',
    type: 'stat'
  },
  {
    id: '3',
    title: 'Latest Article',
    content: 'Understanding responsive design principles for modern web applications. This comprehensive guide covers everything from mobile-first design to advanced grid layouts.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    type: 'article'
  },
  {
    id: '4',
    title: 'Product Gallery',
    content: 'Showcase of our latest product lineup with enhanced features and improved user experience.',
    image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop',
    type: 'card'
  },
  {
    id: '5',
    title: 'Contact Form',
    content: 'Get in touch with our team for support, partnerships, or general inquiries.',
    type: 'form'
  },
  {
    id: '6',
    title: 'Performance Metrics',
    content: 'Server response time improved by 45% with new optimization strategies.',
    type: 'stat'
  },
  {
    id: '7',
    title: 'Design Showcase',
    content: 'Explore our design system and component library built for scalability.',
    image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=300&fit=crop',
    type: 'card'
  },
  {
    id: '8',
    title: 'Team Updates',
    content: 'Recent achievements and milestones from our development team this quarter.',
    type: 'article'
  }
];

// Component for individual grid items
const GridItem: React.FC<{ item: GridItem; layoutType: LayoutType }> = ({ item, layoutType }) => {
  const { deviceType } = useDeviceInfo();
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`
        relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm
        hover:shadow-md transition-all duration-300 group
        ${item.type === 'stat' ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : ''}
        ${item.type === 'form' ? 'bg-gradient-to-br from-green-50 to-emerald-50' : ''}
        ${layoutType === 'dashboard' ? 'min-h-[120px]' : 'min-h-[200px]'}
      `}
      style={{
        contain: 'layout'
      }}
    >
      {item.image && (
        <div className="aspect-video overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}
      
      <div className={`p-4 ${layoutType === 'dashboard' ? 'p-3' : 'p-4'}`}>
        <h3 className={`
          font-semibold text-gray-900 mb-2 line-clamp-2
          ${layoutType === 'dashboard' ? 'text-sm' : 'text-base'}
          ${deviceType === 'mobile' ? 'text-sm' : ''}
        `}>
          {item.title}
        </h3>
        
        <p className={`
          text-gray-600 line-clamp-3
          ${layoutType === 'dashboard' ? 'text-xs' : 'text-sm'}
          ${deviceType === 'mobile' ? 'text-xs' : ''}
        `}>
          {item.content}
        </p>
        
        {item.type === 'stat' && (
          <div className="mt-3 flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ↗ Trending Up
            </span>
          </div>
        )}
        
        {item.type === 'form' && (
          <button className={`
            mt-3 w-full bg-blue-600 text-white rounded-md font-medium
            hover:bg-blue-700 transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${deviceType === 'mobile' ? 'py-3 text-sm min-h-[44px]' : 'py-2 text-sm'}
          `}>
            Open Form
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Main ResponsiveLayout component
const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ 
  layoutType = 'gallery', 
  children, 
  className = '' 
}) => {
  const { width, deviceType, orientation } = useDeviceInfo();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Calculate grid columns based on layout type and device
  const getGridConfig = () => {
    const base = {
      minItemWidth: '280px',
      gap: 'clamp(1rem, 2vw, 2rem)',
      columns: 1,
      maxWidth: undefined as string | undefined
    };
    
    switch (layoutType) {
      case 'dashboard':
        if (deviceType === 'mobile') return { ...base, minItemWidth: '260px' };
        if (deviceType === 'tablet') return { ...base, minItemWidth: '300px' };
        if (deviceType === 'desktop') return { ...base, minItemWidth: '280px' };
        return { ...base, minItemWidth: '320px' }; // ultrawide
        
      case 'content':
        // Content should be constrained for readability
        return { ...base, minItemWidth: '100%', maxWidth: '65ch' };
        
      case 'gallery':
        if (deviceType === 'mobile') return { ...base, minItemWidth: '280px' };
        if (deviceType === 'tablet') return { ...base, minItemWidth: '320px' };
        if (deviceType === 'desktop') return { ...base, minItemWidth: '300px' };
        return { ...base, minItemWidth: '320px' }; // ultrawide
        
      case 'form':
        if (deviceType === 'mobile') return { ...base, minItemWidth: '100%' };
        return { ...base, minItemWidth: '400px', maxWidth: '800px' };
        
      default:
        return base;
    }
  };
  
  const gridConfig = getGridConfig();
  
  return (
    <div className={`w-full min-h-screen bg-gray-50 ${className}`}>
      {/* Header with responsive controls */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className={`
          mx-auto px-4 py-3
          ${layoutType === 'content' ? 'max-w-4xl' : ''}
          ${layoutType === 'dashboard' ? 'max-w-none' : 'max-w-7xl'}
        `}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">
                Responsive Layout Demo
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {deviceType} • {orientation} • {width}px • {layoutType}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Layout type selector */}
              <select 
                value={layoutType}
                className={`
                  rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                  focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                  ${deviceType === 'mobile' ? 'min-h-[44px]' : ''}
                `}
              >
                <option value="dashboard">Dashboard</option>
                <option value="content">Content</option>
                <option value="gallery">Gallery</option>
                <option value="form">Form</option>
              </select>
              
              {/* View mode toggle for larger screens */}
              {deviceType !== 'mobile' && layoutType !== 'content' && (
                <div className="flex border border-gray-300 rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    List
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content area */}
      <main className={`
        mx-auto px-4 py-6
        ${layoutType === 'content' ? 'max-w-4xl' : ''}
        ${layoutType === 'dashboard' ? 'max-w-none' : 'max-w-7xl'}
      `}>
        {children ? (
          <div className={
            layoutType === 'content' 
              ? 'prose prose-gray max-w-none'
              : ''
          }>
            {children}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${viewMode}-${layoutType}-${deviceType}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={
                viewMode === 'grid' && layoutType !== 'content'
                  ? `
                    grid gap-[${gridConfig.gap}]
                    ${layoutType === 'dashboard' || layoutType === 'gallery' 
                      ? `grid-cols-[repeat(auto-fit,minmax(${gridConfig.minItemWidth},1fr))]`
                      : 'grid-cols-1'
                    }
                    ${gridConfig.maxWidth ? `max-w-[${gridConfig.maxWidth}] mx-auto` : ''}
                  `
                  : 'space-y-4'
              }
              style={{
                gridTemplateColumns: 
                  viewMode === 'grid' && layoutType !== 'content'
                    ? `repeat(auto-fit, minmax(${gridConfig.minItemWidth}, 1fr))`
                    : undefined,
                gap: gridConfig.gap,
                maxWidth: gridConfig.maxWidth || undefined
              }}
            >
              {sampleItems.map((item) => (
                <GridItem 
                  key={item.id} 
                  item={item} 
                  layoutType={layoutType}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
      
      {/* Device info overlay (for demonstration) */}
      <div className="fixed bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-xs font-mono z-50">
        <div>W: {width}px</div>
        <div>Type: {deviceType}</div>
        <div>Orientation: {orientation}</div>
      </div>
    </div>
  );
};

export default ResponsiveLayout;
