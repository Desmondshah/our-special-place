import { useState } from "react";
export type CinemaFilterType = "all" | "watched" | "unwatched";
export type CinemaSortByType = "recent" | "alpha" | "watched_date";

interface MobileControlPanelProps {
  onAddClick: () => void;
  onFilterChange: (filter: CinemaFilterType) => void; // Use specific type
  currentFilter: CinemaFilterType;                     // Use specific type
  onSortChange: (sort: CinemaSortByType) => void;      // Use specific type
  currentSort: CinemaSortByType;                       // Use specific type
  onSearchToggle: () => void;
  isSearchVisible: boolean;
}

export function MobileControlPanel({
  onAddClick,
  onFilterChange,
  currentFilter,
  onSortChange,
  currentSort,
  onSearchToggle,
  isSearchVisible
}: MobileControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleOptionClick = (callback: Function, value?: any) => {
    if (value !== undefined) {
      callback(value);
    } else {
      callback();
    }
    setIsExpanded(false);
  };
  
  return (
    <div className="lg:hidden cinema-mobile-controls"> {/* Added a more specific class for potential theming */}
      <button
        className="fab-button shadow-lg cinema-fab" // Added a more specific class
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="Movie Controls"
      >
        {isExpanded ? "✕" : "⚙️"}
      </button>
      
      {isExpanded && (
        <div className="fixed inset-x-0 bottom-0 z-40 animate-slide-up">
          {/* Ensure this bottom-sheet class matches the one targeted by your Cinema CSS overrides */}
          <div className="bottom-sheet cinema-bottom-sheet-themed"> 
            <div className="drag-indicator"></div>
            <h3 className="mobile-section-title cinema-sheet-title">Movie Controls</h3>
            
            <button
              onClick={() => handleOptionClick(onAddClick)}
              className="mobile-action-button pixel-button flex items-center justify-center gap-2 cinema-sheet-button"
            >
              <span>🎬</span> Add Movie
            </button>
            
            <button
              onClick={() => handleOptionClick(onSearchToggle)}
              className={`mobile-action-button pixel-button flex items-center justify-center gap-2 cinema-sheet-button ${
                isSearchVisible ? 'bg-[#FFB6B6] text-white' : '' // Consider using CSS variables for active state
              }`}
            >
              <span>🔍</span> {isSearchVisible ? 'Hide Search' : 'Search Movies'}
            </button>
            
            <div className="my-3">
              <p className="text-[#5D4037] mb-2 cinema-sheet-label">Filter:</p>
              <div className="mobile-tab-filter tab-filter mb-4 overflow-x-auto py-1">
                <button
                  onClick={() => handleOptionClick(onFilterChange, "all" as CinemaFilterType)}
                  className={`tab-filter-button mobile-category-chip cinema-sheet-tab ${currentFilter === "all" ? "tab-filter-button-active" : ""}`}
                >
                  All Movies
                </button>
                <button
                  onClick={() => handleOptionClick(onFilterChange, "unwatched" as CinemaFilterType)}
                  className={`tab-filter-button mobile-category-chip cinema-sheet-tab ${currentFilter === "unwatched" ? "tab-filter-button-active" : ""}`}
                >
                  To Watch
                </button>
                <button
                  onClick={() => handleOptionClick(onFilterChange, "watched" as CinemaFilterType)}
                  className={`tab-filter-button mobile-category-chip cinema-sheet-tab ${currentFilter === "watched" ? "tab-filter-button-active" : ""}`}
                >
                  Watched
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-[#5D4037] mb-2 cinema-sheet-label">Sort By:</p>
              <div className="mobile-tab-filter tab-filter overflow-x-auto py-1">
                <button
                  onClick={() => handleOptionClick(onSortChange, "recent" as CinemaSortByType)}
                  className={`tab-filter-button mobile-category-chip cinema-sheet-tab ${currentSort === "recent" ? "tab-filter-button-active" : ""}`}
                >
                  Recently Added
                </button>
                <button
                  onClick={() => handleOptionClick(onSortChange, "alpha" as CinemaSortByType)}
                  className={`tab-filter-button mobile-category-chip cinema-sheet-tab ${currentSort === "alpha" ? "tab-filter-button-active" : ""}`}
                >
                  Alphabetical
                </button>
                <button
                  onClick={() => handleOptionClick(onSortChange, "watched_date" as CinemaSortByType)}
                  className={`tab-filter-button mobile-category-chip cinema-sheet-tab ${currentSort === "watched_date" ? "tab-filter-button-active" : ""}`}
                >
                  Recently Watched
                </button>
              </div>
            </div>
            
            <button
              onClick={() => setIsExpanded(false)}
              className="mobile-action-button pixel-button bg-[#FFCCBC] text-[#BF360C] cinema-sheet-button close" // Consider CSS variables
            >
              Close
            </button>
            
            <div className="h-6"></div>
          </div>
        </div>
      )}
    </div>
  );
}