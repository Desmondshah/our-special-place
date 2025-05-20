import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MovieBottomSheet } from "./MovieBottomSheet";
import { MobileControlPanel } from "./MobileControlPanel";

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

export default function CinemaSection() {
  // Basic state
  const [link, setLink] = useState("");
  const [movieName, setMovieName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentTrailer, setCurrentTrailer] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);

  // Enhanced UI state
  const [filter, setFilter] = useState("all"); // "all", "watched", "unwatched"
  const [sortBy, setSortBy] = useState("recent"); // "recent", "alpha", "watched"
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Refs for drag scrolling
  const moviesContainerRef = useRef<HTMLDivElement>(null);
  
  // Convex hooks - corrected function name from unmarkAsWatched to markAsUnwatched
  const movies = useQuery(api.cinema.getAll) ?? [];
  const addMovie = useMutation(api.cinema.add);
  const removeMovie = useMutation(api.cinema.remove);
  const markAsWatched = useMutation(api.cinema.markAsWatched);
  const markAsUnwatched = useMutation(api.cinema.markAsUnwatched); // Corrected function name

  // API keys
  const OMDB_API_KEY = '5f2c66a6';
  const YOUTUBE_API_KEY = 'AIzaSyC1hx_06tH-F2btecw0emxRoLZzpgD_UsM';

  // Mobile detection
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Simple drag scroll implementation
  const enableDragScroll = (ref: HTMLDivElement | null) => {
    if (!ref) return;
    
    let isDown = false;
    let startX: number;
    let scrollLeft: number;
    
    const mouseDownHandler = (e: MouseEvent) => {
      isDown = true;
      ref.style.cursor = 'grabbing';
      ref.style.userSelect = 'none';
      startX = e.pageX - ref.offsetLeft;
      scrollLeft = ref.scrollLeft;
    };
    
    const mouseLeaveHandler = () => {
      isDown = false;
      ref.style.cursor = 'grab';
      ref.style.removeProperty('user-select');
    };
    
    const mouseUpHandler = () => {
      isDown = false;
      ref.style.cursor = 'grab';
      ref.style.removeProperty('user-select');
    };
    
    const mouseMoveHandler = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - ref.offsetLeft;
      const walk = (x - startX) * 2;
      ref.scrollLeft = scrollLeft - walk;
    };
    
    ref.addEventListener('mousedown', mouseDownHandler);
    ref.addEventListener('mouseleave', mouseLeaveHandler);
    ref.addEventListener('mouseup', mouseUpHandler);
    ref.addEventListener('mousemove', mouseMoveHandler);
    
    return () => {
      ref.removeEventListener('mousedown', mouseDownHandler);
      ref.removeEventListener('mouseleave', mouseLeaveHandler);
      ref.removeEventListener('mouseup', mouseUpHandler);
      ref.removeEventListener('mousemove', mouseMoveHandler);
    };
  };

  // Set up drag scroll once container is rendered
  useEffect(() => {
    if (moviesContainerRef.current) {
      moviesContainerRef.current.style.cursor = 'grab';
      const cleanup = enableDragScroll(moviesContainerRef.current);
      return cleanup;
    }
  }, [moviesContainerRef.current]);

  // Filter and sort movies
  const filteredMovies = movies.filter(movie => {
    // Apply search filter
    if (searchQuery) {
      return movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    // Apply watched/unwatched filter
    if (filter === "watched") return movie.watched;
    if (filter === "unwatched") return !movie.watched;
    return true;
  }).sort((a, b) => {
    // Apply sorting
    if (sortBy === "alpha") return a.title.localeCompare(b.title);
    if (sortBy === "watched" && a.watchedAt && b.watchedAt) return b.watchedAt - a.watchedAt;
    if (sortBy === "watched" && a.watchedAt) return -1;
    if (sortBy === "watched" && b.watchedAt) return 1;
    return b.addedAt - a.addedAt; // Default: most recent first
  });

  // Add movie handler
  const handleAddMovie = async () => {
    if (!link || !movieName) {
      alert('Please paste a link and enter a movie name!');
      return;
    }

    try {
      const response = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${OMDB_API_KEY}`);
      const data = await response.json();
      
      if (data.Poster && data.Poster !== "N/A") {
        await addMovie({
          title: movieName,
          poster: data.Poster,
          link: link,
        });
        setLink("");
        setMovieName("");
        setShowAddForm(false);
      } else {
        alert('Poster not found for "' + movieName + '"');
      }
    } catch (error) {
      console.error('Error fetching poster:', error);
      alert('Error adding movie. Please try again.');
    }
  };

  // Delete movie handlers
  const confirmDelete = (movie: Movie) => {
    setMovieToDelete(movie);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (movieToDelete) {
      removeMovie({ id: movieToDelete._id });
      setIsDeleteModalOpen(false);
      setMovieToDelete(null);
    }
  };

  // Watch/Unwatch handlers - corrected function name
  const handleMarkAsWatched = (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    markAsWatched({ id, watchedAt: Date.now() });
  };

  const handleMarkAsUnwatched = (e: React.MouseEvent, id: any) => {
    e.stopPropagation();
    markAsUnwatched({ id }); // Corrected function name
  };

  // Movie click handler (different behavior for mobile vs desktop)
  const handleMovieClick = (movie: Movie) => {
    if (isMobile) {
      setSelectedMovie(movie);
    } else {
      openTrailer(movie.title);
    }
  };

  // Trailer handlers
  const openTrailer = async (movieTitle: string) => {
    try {
      const query = encodeURIComponent(movieTitle + " official trailer");
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${YOUTUBE_API_KEY}&type=video&maxResults=1`);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const videoId = data.items[0].id.videoId;
        setCurrentTrailer(`https://www.youtube.com/embed/${videoId}?autoplay=1`);
        setShowModal(true);
      } else {
        alert('Trailer not found.');
      }
    } catch (error) {
      console.error('Error fetching YouTube trailer:', error);
      alert('Error loading trailer. Please try again.');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentTrailer("");
  };

  // Toggle search bar
  const toggleSearchBar = () => {
    setShowSearchBar(!showSearchBar);
    if (showSearchBar) {
      setSearchQuery("");
    }
  };

  // Toggle add form
  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
  };

  return (
    <div className="space-y-6 animate-fade-slide-up">
      <h2 className="text-center text-3xl text-[#FF6B6B] mb-6">Our Cinema Hub 🎬</h2>
      
      {/* Desktop Controls - show only on larger screens */}
      <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:mb-6 sm:px-2">
        {/* Add movie button */}
        <button
          onClick={toggleAddForm}
          className="pixel-button flex items-center gap-2 text-lg"
        >
          {showAddForm ? "Cancel" : "Add Movie"} {!showAddForm && "🎥"}
        </button>
        
        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search toggle */}
          <button
            onClick={toggleSearchBar}
            className={`pixel-button w-12 h-12 flex items-center justify-center p-0 text-xl ${showSearchBar ? 'bg-[#FFB6B6] text-white' : ''}`}
            aria-label="Search"
          >
            🔍
          </button>
          
          {/* View filter */}
          <div className="tab-filter">
            <button
              onClick={() => setFilter("all")}
              className={`tab-filter-button px-4 py-2 ${filter === "all" ? "tab-filter-button-active" : ""}`}
            >
              All Movies
            </button>
            <button
              onClick={() => setFilter("unwatched")}
              className={`tab-filter-button px-4 py-2 ${filter === "unwatched" ? "tab-filter-button-active" : ""}`}
            >
              To Watch
            </button>
            <button
              onClick={() => setFilter("watched")}
              className={`tab-filter-button px-4 py-2 ${filter === "watched" ? "tab-filter-button-active" : ""}`}
            >
              Watched
            </button>
          </div>
          
          {/* Sort options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="pixel-input py-2 px-3 h-12 min-w-[180px] text-base"
          >
            <option value="recent">Recently Added</option>
            <option value="alpha">Alphabetical</option>
            <option value="watched">Recently Watched</option>
          </select>
        </div>
      </div>
      
      {/* Mobile Controls */}
      <MobileControlPanel
        onAddClick={toggleAddForm}
        onFilterChange={setFilter}
        currentFilter={filter}
        onSortChange={setSortBy}
        currentSort={sortBy}
        onSearchToggle={toggleSearchBar}
        isSearchVisible={showSearchBar}
      />
      
      {/* Search bar (conditional) */}
      {showSearchBar && (
        <div className="w-full animate-fade-slide-up mb-6 px-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movies..."
            className="pixel-input w-full py-3 text-lg"
            autoFocus
          />
        </div>
      )}
      
      {/* Add movie form (conditional) */}
      {showAddForm && (
        <div className="flex flex-col items-center gap-4 animate-fade-slide-up mb-8 p-6 border-3 border-dashed border-[#FFDAB9] rounded-xl mx-2">
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Paste Netflix (or any) URL"
            className="pixel-input w-full max-w-md py-3 text-lg"
          />
          <input
            type="text"
            value={movieName}
            onChange={(e) => setMovieName(e.target.value)}
            placeholder="Enter Movie Name"
            className="pixel-input w-full max-w-md py-3 text-lg"
          />
          <button
            onClick={handleAddMovie}
            className="pixel-button w-full max-w-md py-3 text-lg"
          >
            Add to Our Collection 🎬
          </button>
        </div>
      )}
      
      {/* Movies gallery section with section title based on filter */}
      <div className="mb-8 px-2">
        {filter === "watched" && filteredMovies.length > 0 && (
          <h3 className="section-title text-2xl mb-4 pl-4">Movies We've Watched Together 💖</h3>
        )}
        {filter === "unwatched" && filteredMovies.length > 0 && (
          <h3 className="section-title text-2xl mb-4 pl-4">Movies We Want to Watch 🍿</h3>
        )}
        {filter === "all" && filteredMovies.length > 0 && (
          <h3 className="section-title text-2xl mb-4 pl-4">Our Movie Collection 🎬</h3>
        )}
        
        {/* Fixed movie card container with better spacing and alignment */}
        <div 
          ref={moviesContainerRef}
          className="flex overflow-x-auto gap-6 py-6 px-3 pb-6 snap-x scrollbar-hide"
          style={{ paddingBottom: "20px", minHeight: "350px" }}
        >
          {filteredMovies.map((movie: Movie) => (
            <div
              key={movie._id}
              className={`relative flex-none w-56 h-80 movie-card-hover cursor-pointer snap-center transition-all duration-300 ${movie.watched ? 'movie-watched' : ''}`}
              onClick={() => handleMovieClick(movie)}
              style={{ minWidth: "220px" }}
            >
              {/* Delete button - moved to ensure it's not crowded */}
              <button
                className="absolute top-3 right-3 z-30 movie-delete-btn w-10 h-10 rounded-full flex items-center justify-center text-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete(movie);
                }}
                aria-label="Delete movie"
              >
                &times;
              </button>
              
              {/* Watch toggle button - repositioned */}
              {movie.watched ? (
                <button
                  className="watch-button watch-button-undo left-3 top-3"
                  onClick={(e) => handleMarkAsUnwatched(e, movie._id)}
                  title="Mark as unwatched"
                  aria-label="Mark as unwatched"
                >
                  ↩
                </button>
              ) : (
                <button
                  className="watch-button watch-button-check left-3 top-3"
                  onClick={(e) => handleMarkAsWatched(e, movie._id)}
                  title="Mark as watched"
                  aria-label="Mark as watched"
                >
                  ✓
                </button>
              )}
              
              {/* Watched badge - repositioned for better visibility */}
              {movie.watched && (
                <div className="watched-badge animate-pulse-subtle right-3 bottom-[60px]">
                  Watched
                </div>
              )}
              
              {/* Movie poster - contained properly */}
              <div className="w-full h-full overflow-hidden rounded-xl border-4 border-[#FFDAB9]">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  draggable="false"
                />
              </div>
              
              {/* Improved title container with better text handling */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#5D4037] to-transparent py-4 px-3 rounded-b-xl">
                <div className="text-white text-center font-bold text-lg" style={{ 
                  textShadow: "0px 1px 2px rgba(0,0,0,0.8)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: "2",
                  WebkitBoxOrient: "vertical",
                  lineHeight: "1.2em",
                  maxHeight: "2.4em"
                }}>
                  {movie.title}
                </div>
              </div>
            </div>
          ))}
          
          {/* Improved empty state with better spacing */}
          {filteredMovies.length === 0 && (
            <div className="empty-state w-full min-h-[300px] flex flex-col items-center justify-center p-8">
              <div className="empty-state-icon text-5xl mb-4">🍿</div>
              <div className="empty-state-title text-2xl mb-3">No movies found</div>
              <div className="empty-state-desc text-lg mb-6 max-w-md text-center">
                {searchQuery 
                  ? "Try a different search term"
                  : filter === "watched" 
                    ? "You haven't watched any movies together yet" 
                    : filter === "unwatched"
                      ? "You don't have any movies on your watchlist"
                      : "Add your first movie to start your collection!"}
              </div>
              {!showAddForm && (
                <button onClick={toggleAddForm} className="pixel-button text-lg px-6 py-3 mt-2">
                  Add Your First Movie 🎬
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Movie count with better spacing */}
      {filteredMovies.length > 0 && (
        <div className="text-center text-[#8D6E63] text-lg mb-8">
          {filter === "all" 
            ? `${filteredMovies.length} movie${filteredMovies.length !== 1 ? 's' : ''} in our collection`
            : filter === "watched"
              ? `We've watched ${filteredMovies.length} movie${filteredMovies.length !== 1 ? 's' : ''} together`
              : `${filteredMovies.length} movie${filteredMovies.length !== 1 ? 's' : ''} on our watchlist`}
        </div>
      )}
      
      {/* Improved trailer modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-85 flex items-center justify-center z-50 backdrop-blur-sm trailer-modal" 
          onClick={closeModal}
        >
          <div 
            className="w-11/12 max-w-4xl trailer-modal-content relative" 
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-4 text-3xl text-white z-10 close-modal-btn"
              onClick={closeModal}
              aria-label="Close trailer"
            >
              &times;
            </button>
            <iframe
              src={currentTrailer}
              className="w-full h-64 sm:h-96 md:h-[500px] border-none trailer-frame"
              allowFullScreen
              title="Movie Trailer"
            ></iframe>
          </div>
        </div>
      )}
      
      {/* Improved delete confirmation modal */}
      {isDeleteModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in" 
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div 
            className="bg-[#FFF5EE] p-8 rounded-xl border-4 border-[#FFDAB9] max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl text-[#5D4037] mb-4 text-center">
              Delete "{movieToDelete?.title}"?
            </h3>
            <p className="text-lg text-[#8D6E63] mb-8 text-center">
              Are you sure you want to remove this movie from your collection?
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="pixel-button bg-[#FFF5EE] px-6 py-3 text-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="pixel-button bg-[#FFCCBC] text-[#BF360C] px-6 py-3 text-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Bottom Sheet - improved layout */}
      {isMobile && selectedMovie && (
        <MovieBottomSheet
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onMarkWatched={(e) => {
            handleMarkAsWatched(e, selectedMovie._id);
            setSelectedMovie(null);
          }}
          onMarkUnwatched={(e) => {
            handleMarkAsUnwatched(e, selectedMovie._id);
            setSelectedMovie(null);
          }}
          onDelete={() => {
            confirmDelete(selectedMovie);
            setSelectedMovie(null);
          }}
          onOpenTrailer={() => {
            openTrailer(selectedMovie.title);
            setSelectedMovie(null);
          }}
        />
      )}
    </div>
  );
}