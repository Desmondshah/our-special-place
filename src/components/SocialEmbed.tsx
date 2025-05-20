import { useEffect, useRef, useState } from 'react';

interface SocialEmbedProps {
  url: string;
  embedType: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A component to render social media embeds using iframely
 */
const SocialEmbed: React.FC<SocialEmbedProps> = ({ 
  url, 
  embedType, 
  className = '', 
  style = {} 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframelyApiKey = '814cc6b45e93043061479f';

  useEffect(() => {
    // Only run if we have a URL and the containerRef is available
    if (!url || !containerRef.current) return;
    setIsLoading(true);
    setHasError(false);

    // Create a direct iframe for the embed
    const createDirectEmbed = () => {
      if (!containerRef.current) return;
      
      // Clear any existing content
      containerRef.current.innerHTML = '';
      
      // Create iframe element
      const iframe = document.createElement('iframe');
      
      // Use the direct CDN URL for iframely
      const embedUrl = `https://cdn.iframe.ly/api/iframe?url=${encodeURIComponent(url)}&key=${iframelyApiKey}`;
      
      // Set iframe attributes
      iframe.src = embedUrl;
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.style.minHeight = '240px';
      iframe.style.border = 'none';
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.onload = () => {
        setIsLoading(false);
      };
      iframe.onerror = () => {
        setIsLoading(false);
        setHasError(true);
      };
      
      // Append to container
      containerRef.current.appendChild(iframe);
    };

    // Try to create the embed
    try {
      createDirectEmbed();
      
      // Set a timeout to handle cases where the iframe doesn't trigger onload/onerror
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 5000);
      
      return () => {
        clearTimeout(timeout);
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      };
    } catch (error) {
      console.error('Error creating embed:', error);
      setIsLoading(false);
      setHasError(true);
    }
  }, [url, iframelyApiKey]);

  // Platform-specific styling class
  const platformClass = `${embedType}-embed`;

  return (
    <div 
      className={`social-embed ${platformClass} ${className}`}
      style={{ 
        minHeight: '240px',
        border: '2px solid #FFDAB9',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        ...style
      }}
    >
      {/* Container for the iframe */}
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ minHeight: '240px' }}
      />
      
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#FFF5EE] bg-opacity-80">
          <div className="text-center p-4">
            <div className="text-3xl mb-2 animate-bounce">
              {embedType === 'pinterest' && '📌'}
              {embedType === 'twitter' && '🐦'}
              {embedType === 'instagram' && '📷'}
            </div>
            <div className="text-[#5D4037]">
              Loading {embedType.charAt(0).toUpperCase() + embedType.slice(1)} post...
            </div>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#FFF5EE]">
          <div className="text-center p-4">
            <div className="text-3xl mb-2">❌</div>
            <div className="text-[#5D4037] font-medium mb-1">
              Could not load embed
            </div>
            <div className="text-[#8D6E63] text-sm">
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-[#FF6B6B]"
              >
                View post on {embedType.charAt(0).toUpperCase() + embedType.slice(1)}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialEmbed;