import { useState } from "react";

interface MobileControlPanelProps {
  onAddClick: () => void;
  onFilterChange: (filter: string) => void;
  currentFilter: string;
  onSortChange: (sort: string) => void;
  currentSort: string;
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
  
  // Handle click on any option (close panel)
  const handleOptionClick = (callback: Function, value?: any) => {
    if (value !== undefined) {
      callback(value);
    } else {
      callback();
    }
    setIsExpanded(false);
  };
  
  return (
    <div className="lg:hidden">
      {/* FAB Button - Always visible */}
      <button
        className="fab-button shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="Movie Controls"
      >
        {isExpanded ? "✕" : "⚙️"}
      </button>
      
      {/* Expanded Controls */}
      {isExpanded && (
        <div className="fixed inset-x-0 bottom-0 z-40 animate-slide-up">
          <div className="bottom-sheet">
            <div className="drag-indicator"></div>
            <h3 className="mobile-section-title">Movie Controls</h3>
            
            {/* Add Movie Button */}
            <button
              onClick={() => handleOptionClick(onAddClick)}
              className="mobile-action-button pixel-button flex items-center justify-center gap-2"
            >
              <span>🎬</span> Add Movie
            </button>
            
            {/* Search Toggle */}
            <button
              onClick={() => handleOptionClick(onSearchToggle)}
              className={`mobile-action-button pixel-button flex items-center justify-center gap-2 ${
                isSearchVisible ? 'bg-[#FFB6B6] text-white' : ''
              }`}
            >
              <span>🔍</span> {isSearchVisible ? 'Hide Search' : 'Search Movies'}
            </button>
            
            {/* Filter Options */}
            <div className="my-3">
              <p className="text-[#5D4037] mb-2">Filter:</p>
              <div className="mobile-tab-filter tab-filter mb-4 overflow-x-auto py-1">
                <button
                  onClick={() => handleOptionClick(onFilterChange, "all")}
                  className={`tab-filter-button mobile-category-chip ${currentFilter === "all" ? "tab-filter-button-active" : ""}`}
                >
                  All Movies
                </button>
                <button
                  onClick={() => handleOptionClick(onFilterChange, "unwatched")}
                  className={`tab-filter-button mobile-category-chip ${currentFilter === "unwatched" ? "tab-filter-button-active" : ""}`}
                >
                  To Watch
                </button>
                <button
                  onClick={() => handleOptionClick(onFilterChange, "watched")}
                  className={`tab-filter-button mobile-category-chip ${currentFilter === "watched" ? "tab-filter-button-active" : ""}`}
                >
                  Watched
                </button>
              </div>
            </div>
            
            {/* Sort Options */}
            <div className="mb-4">
              <p className="text-[#5D4037] mb-2">Sort By:</p>
              <div className="mobile-tab-filter tab-filter overflow-x-auto py-1">
                <button
                  onClick={() => handleOptionClick(onSortChange, "recent")}
                  className={`tab-filter-button mobile-category-chip ${currentSort === "recent" ? "tab-filter-button-active" : ""}`}
                >
                  Recently Added
                </button>
                <button
                  onClick={() => handleOptionClick(onSortChange, "alpha")}
                  className={`tab-filter-button mobile-category-chip ${currentSort === "alpha" ? "tab-filter-button-active" : ""}`}
                >
                  Alphabetical
                </button>
                <button
                  onClick={() => handleOptionClick(onSortChange, "watched")}
                  className={`tab-filter-button mobile-category-chip ${currentSort === "watched" ? "tab-filter-button-active" : ""}`}
                >
                  Recently Watched
                </button>
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="mobile-action-button pixel-button bg-[#FFCCBC] text-[#BF360C]"
            >
              Close
            </button>
            
            {/* Spacer for bottom of screen devices */}
            <div className="h-6"></div>
          </div>
        </div>
      )}
    </div>
  );
}