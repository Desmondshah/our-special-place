import { useEffect, useRef, useState } from 'react';

interface SocialEmbedProps {
  url: string;
  embedType: string;
  className?: string; // Keep this for general classes
  // style removed as it's better handled by CSS classes for theming
}

const SocialEmbed: React.FC<SocialEmbedProps> = ({ 
  url, 
  embedType, 
  className = '', 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframelyApiKey = '814cc6b45e93043061479f'; // Keep your API key

  useEffect(() => {
    if (!url || !containerRef.current) return;
    setIsLoading(true);
    setHasError(false);

    const iframe = document.createElement('iframe');
    const embedUrl = `https://cdn.iframe.ly/api/iframe?url=${encodeURIComponent(url)}&key=${iframelyApiKey}&card=small&omit_script=1`; // Added card=small & omit_script
    
    iframe.src = embedUrl;
    iframe.className = "social-embed-iframe-pixel-perfect"; // New class for iframe styling
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.onload = () => setIsLoading(false);
    iframe.onerror = () => { setIsLoading(false); setHasError(true); };
    
    containerRef.current.innerHTML = ''; // Clear previous
    containerRef.current.appendChild(iframe);

    const timeout = setTimeout(() => { if(isLoading) setIsLoading(false); }, 7000); // Longer timeout
    return () => clearTimeout(timeout);
  }, [url, iframelyApiKey, isLoading]); // Added isLoading to dependencies

  const platformClass = `social-embed-${embedType.toLowerCase()}`;

  return (
    // Added 'social-embed-pixel-wrapper' for consistent theming
    <div className={`social-embed-pixel-wrapper ${platformClass} ${className}`}>
      <div ref={containerRef} className="social-embed-iframe-container-pixel" />
      
      {isLoading && (
        <div className="social-embed-loading-state-pixel">
          <div className="loading-icon">💖</div>
          <div>Loading {embedType} Post...</div>
        </div>
      )}
      
      {hasError && !isLoading && ( // Only show error if not loading
        <div className="social-embed-error-state-pixel">
          <div className="error-icon">💔</div>
          <div>Couldn't load this scrap!</div>
          <a href={url} target="_blank" rel="noopener noreferrer">View on {embedType}</a>
        </div>
      )}
    </div>
  );
};

export default SocialEmbed;