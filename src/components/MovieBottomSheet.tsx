import React, { useEffect, useRef } from "react";

// Define Movie type
interface Movie {
  _id: any;
  title: string;
  poster: string;
  link: string;
  addedAt: number;
  watched?: boolean;
  watchedAt?: number;
}

interface MovieBottomSheetProps {
  movie: Movie;
  onClose: () => void;
  onMarkWatched: (e: React.MouseEvent) => void;
  onMarkUnwatched: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onOpenTrailer: () => void;
}

export function MovieBottomSheet({
  movie,
  onClose,
  onMarkWatched,
  onMarkUnwatched,
  onDelete,
  onOpenTrailer
}: MovieBottomSheetProps) {
  
  // Ref for the sheet container
  const sheetRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Prevent body scrolling when sheet is open
    document.body.style.overflow = 'hidden';
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  // Handle touch events for closing with swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    const startY = e.touches[0].clientY;
    const sheet = sheetRef.current;
    
    if (!sheet) return;
    
    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      
      if (deltaY > 0) {
        sheet.style.transform = `translateY(${deltaY}px)`;
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const currentY = e.changedTouches[0].clientY;
      const deltaY = currentY - startY;
      
      if (deltaY > 100) {
        // Swipe down detected, close the sheet
        onClose();
      } else {
        // Reset position
        sheet.style.transform = '';
      }
      
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };
  
  // Format the watched date if available
  const formattedWatchedDate = movie.watchedAt 
    ? new Date(movie.watchedAt).toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      })
    : null;
    
  // Format the added date
  const formattedAddedDate = new Date(movie.addedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Format link for display (prevent long links)
  const displayLink = movie.link.length > 40 
    ? movie.link.substring(0, 37) + '...' 
    : movie.link;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md z-50 flex items-end justify-center animate-fade-in"
      onClick={onClose}
    >
      <div 
        ref={sheetRef}
        className="bottom-sheet w-full max-w-md animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
        <div className="drag-indicator mb-6"></div>
        
        {/* Title section with clearer text */}
        <h3 className="text-center text-2xl mb-6 px-4" style={{ color: 'var(--text-primary)' }}>
          Movie Details
        </h3>
        
        <div className="flex mb-6 px-4">
          {/* Movie poster thumbnail - larger and better framed */}
          <div className="w-28 h-40 flex-shrink-0 mr-5 rounded-lg overflow-hidden border-3"
               style={{ 
                 borderColor: 'var(--border-primary)',
                boxShadow: '3px 3px 0 var(--shadow-color)'
               }}>
            <img 
              src={movie.poster} 
              alt={movie.title} 
              className="w-full h-full object-cover" 
            />
          </div>
          
          {/* Movie info with better spacing */}
          <div className="flex-1">
            <h3 className="text-xl mb-3 font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
              {movie.title}
            </h3>
            
            {/* Watched status - more visible */}
            {movie.watched ? (
              <div className="inline-block rounded-full px-3 py-1 text-sm mb-3 font-medium bg-[#A5D6A7] text-[#1B5E20]">
                Watched {formattedWatchedDate ? `on ${formattedWatchedDate}` : ''}
              </div>
            ) : (
              <div className="inline-block rounded-full px-3 py-1 text-sm mb-3 font-medium bg-[#FFCCBC] text-[#BF360C]">
                Not watched yet
              </div>
            )}
            
            {/* Link display - well contained */}
            <div className="text-sm mb-3 p-2 rounded-md break-words" 
                 style={{ 
                   backgroundColor: 'var(--background-tertiary)',
                   borderColor: 'var(--border-primary)',
                   color: 'var(--text-secondary)',
                   border: '1px solid var(--border-primary)'
                 }}>
              <strong>Link:</strong> {displayLink}
            </div>
            
            {/* Added date - better styled */}
            <div className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
              Added on {formattedAddedDate}
            </div>
          </div>
        </div>
        
        {/* Action buttons with more space and better layout */}
        <div className="grid grid-cols-2 gap-4 mb-4 px-4">
          <button 
            onClick={onOpenTrailer}
            className="pixel-button mobile-touch-button flex items-center justify-center gap-2 py-3 text-base"
          >
            <span>🎬</span> Watch Trailer
          </button>
          
          {movie.watched ? (
           <button 
  onClick={onMarkUnwatched}
  className={`pixel-button mobile-touch-button flex items-center justify-center gap-2 py-3 text-base bottom-sheet-mark-unwatched-btn`}
>
  <span>↩</span> Mark Unwatched
</button>
          ) : (
            <button 
  onClick={onMarkWatched}
  className={`pixel-button mobile-touch-button flex items-center justify-center gap-2 py-3 text-base bottom-sheet-mark-watched-btn`}
>
  <span>✓</span> Mark Watched
</button>
          )}
        </div>
        
        {/* Link and delete buttons */}
        <div className="grid grid-cols-2 gap-4 px-4 mb-8">
          <a 
            href={movie.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="pixel-button mobile-touch-button flex items-center justify-center gap-2 py-3 text-base"
          >
            <span>🔗</span> Open Link
          </a>
          
         <button 
    onClick={onDelete}
    className={`pixel-button mobile-touch-button flex items-center justify-center gap-2 py-3 text-base bottom-sheet-delete-btn`}
>
    <span>🗑️</span> Delete Movie
</button>
        </div>
        
        {/* Close button at bottom for easy tapping */}
        <button
          onClick={onClose}
          className="w-full pixel-button py-3 text-base mb-4 mx-auto block max-w-xs"
        >
          Close
        </button>
        
        {/* Bottom safe area padding */}
        <div className="h-4"></div>
      </div>
    </div>
  );
}