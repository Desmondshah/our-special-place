import { useState, useRef, useEffect, FormEvent, MouseEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { MovieBottomSheet } from "./MovieBottomSheet";
import { CinemaFilterType, CinemaSortByType, MobileControlPanel } from "./MobileControlPanel";
import './CinemaSection.brutal-pixel.css';

interface Movie {
  _id: Id<"cinema">;
  title: string;
  poster: string;
  link: string;
  addedAt: number;
  watched?: boolean;
  watchedAt?: number;
}

// API Keys - It's better to move these to environment variables
const OMDB_API_KEY = '5f2c66a6';
const YOUTUBE_API_KEY = 'AIzaSyC1hx_06tH-F2btecw0emxRoLZzpgD_UsM';

export default function CinemaSection() {
  const [link, setLink] = useState("");
  const [movieName, setMovieName] = useState("");
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [currentTrailerUrl, setCurrentTrailerUrl] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);

  const [filter, setFilter] = useState<"all" | "watched" | "unwatched">("all");
  const [sortBy, setSortBy] = useState<"recent" | "alpha" | "watched_date">("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMovieForSheet, setSelectedMovieForSheet] = useState<Movie | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoadingAdd, setIsLoadingAdd] = useState(false);

  const moviesContainerRef = useRef<HTMLDivElement>(null);
  
  const movies = useQuery(api.cinema.getAll) ?? [];
  const addMovieMutation = useMutation(api.cinema.add);
  const removeMovieMutation = useMutation(api.cinema.remove);
  const markAsWatchedMutation = useMutation(api.cinema.markAsWatched);
  const markAsUnwatchedMutation = useMutation(api.cinema.markAsUnwatched);

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  const filteredAndSortedMovies = movies
    .filter(movie => {
      const matchesSearch = searchQuery ? movie.title.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      if (!matchesSearch) return false;
      if (filter === "watched") return movie.watched;
      if (filter === "unwatched") return !movie.watched;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "alpha") return a.title.localeCompare(b.title);
      if (sortBy === "watched_date") {
        if (a.watched && !b.watched) return -1;
        if (!a.watched && b.watched) return 1;
        return (b.watchedAt || 0) - (a.watchedAt || 0);
      }
      return b.addedAt - a.addedAt;
    });

  const handleAddMovie = async (e: FormEvent) => {
    e.preventDefault();
    if (!link.trim() || !movieName.trim()) {
      alert('Please enter both a movie title and watch link!');
      return;
    }
    setIsLoadingAdd(true);
    try {
      const response = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${OMDB_API_KEY}`);
      const data = await response.json();
      
      if (data.Response === "True" && data.Poster && data.Poster !== "N/A") {
        await addMovieMutation({ title: movieName, poster: data.Poster, link });
        setLink("");
        setMovieName("");
        setShowAddForm(false);
      } else {
        alert(`Couldn't find a poster for "${movieName}". Please check the movie title! (OMDb: ${data.Error || 'Unknown error'})`);
      }
    } catch (error) {
      console.error('Error fetching poster:', error);
      alert('Error adding movie. Please try again.');
    } finally {
      setIsLoadingAdd(false);
    }
  };

  const handleDeleteRequest = (movie: Movie) => {
    setMovieToDelete(movie);
    setShowDeleteModal(true);
  };

  const confirmDeleteMovie = async () => {
    if (movieToDelete) {
      await removeMovieMutation({ id: movieToDelete._id });
      setShowDeleteModal(false);
      setMovieToDelete(null);
    }
  };

  const toggleWatchedStatus = async (e: MouseEvent, movie: Movie) => {
    e.stopPropagation();
    if (movie.watched) {
      await markAsUnwatchedMutation({ id: movie._id });
    } else {
      await markAsWatchedMutation({ id: movie._id, watchedAt: Date.now() });
    }
  };
  
  const playTrailer = async (movieTitle: string) => {
    try {
      const query = encodeURIComponent(`${movieTitle} official trailer`);
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${YOUTUBE_API_KEY}&type=video&maxResults=1`);
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const videoId = data.items[0].id.videoId;
        setCurrentTrailerUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`);
        setShowTrailerModal(true);
        document.body.classList.add('overflow-hidden');
      } else {
        alert('No trailer found for this epic film!');
      }
    } catch (error) {
      console.error('Error fetching YouTube trailer:', error);
      alert('Trailer projector is broken! Try again.');
    }
  };

  const closeTrailerModal = () => {
    setShowTrailerModal(false);
    setCurrentTrailerUrl("");
    document.body.classList.remove('overflow-hidden');
  };

  const handleMovieCardClick = (movie: Movie) => {
    if (isMobile) {
      setSelectedMovieForSheet(movie);
    } else {
      playTrailer(movie.title);
    }
  };

  return (
    <div className="cinema-brutal-container">
      {/* HEADER SECTION */}
      <header className="cinema-brutal-header">
        <h1 className="cinema-brutal-title">
          OUR CINEMA
        </h1>
        <div className="cinema-brutal-divider"></div>
        
        {/* SEARCH BAR */}
        {showSearchBar && (
          <div className="cinema-brutal-search">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search your collection..."
              className="cinema-brutal-search-input cinema-brutal-input"
              autoFocus
            />
          </div>
        )}
      </header>

      {/* CONTROLS SECTION */}
      <div className="cinema-brutal-controls">
        <button 
          onClick={() => setShowAddForm(prev => !prev)} 
          className={`cinema-brutal-button cinema-brutal-button--primary ${isLoadingAdd ? 'cinema-brutal-loading' : ''}`}
          disabled={isLoadingAdd}
        >
          <span>🎬</span>
          {showAddForm ? "CLOSE FORM" : "ADD MOVIE"}
        </button>
        
        <button 
          onClick={() => setShowSearchBar(prev => !prev)} 
          className={`cinema-brutal-button cinema-brutal-button--search ${showSearchBar ? 'active' : ''}`}
        >
          <span>🔍</span>
          SEARCH
        </button>
        
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value as typeof filter)} 
          className="cinema-brutal-select"
        >
          <option value="all">🎭 ALL MOVIES</option>
          <option value="unwatched">🎞️ TO WATCH</option>
          <option value="watched">✅ WATCHED</option>
        </select>
        
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)} 
          className="cinema-brutal-select"
        >
          <option value="recent">⚡ NEWEST</option>
          <option value="alpha">🔤 A-Z</option>
          <option value="watched_date">📅 LAST WATCHED</option>
        </select>
      </div>

      {/* ADD MOVIE FORM */}
      {showAddForm && (
        <form onSubmit={handleAddMovie} className="cinema-brutal-add-form">
          <h3 className="cinema-brutal-add-title">
            ➕ ADD NEW EPIC FILM ➕
          </h3>
          
          <div className="cinema-brutal-form-grid">
            <input
              type="text"
              value={movieName}
              onChange={(e) => setMovieName(e.target.value)}
              placeholder="Movie Title (be exact for best poster results)"
              className="cinema-brutal-form-input cinema-brutal-input"
              required
            />
            
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Watch Link (Netflix, Disney+, etc.)"
              className="cinema-brutal-form-input cinema-brutal-input"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className={`cinema-brutal-button cinema-brutal-button--success ${isLoadingAdd ? 'cinema-brutal-loading' : ''}`}
            disabled={isLoadingAdd}
          >
            {isLoadingAdd ? "🎨 FINDING POSTER..." : "🚀 ADD TO COLLECTION!"}
          </button>
        </form>
      )}

      {/* MOVIE GALLERY */}
      <div className="cinema-brutal-gallery">
        {filteredAndSortedMovies.length === 0 ? (
          <div className="cinema-brutal-empty">
            <div className="cinema-brutal-empty-icon">🎮</div>
            <h2 className="cinema-brutal-empty-title">NO MOVIES FOUND</h2>
            <p className="cinema-brutal-empty-text">
              {searchQuery 
                ? "Try a different search term or clear your filters!" 
                : "Time to add some blockbusters to your collection!"}
            </p>
            {!showAddForm && (
              <button 
                onClick={() => setShowAddForm(true)} 
                className="cinema-brutal-button cinema-brutal-button--primary"
              >
                🎬 ADD FIRST MOVIE
              </button>
            )}
          </div>
        ) : (
          <div className="cinema-brutal-movie-carousel" ref={moviesContainerRef}>
            {filteredAndSortedMovies.map(movie => (
              <div 
                key={movie._id} 
                className={`cinema-brutal-movie-card ${movie.watched ? "watched" : ""}`}
                onClick={() => handleMovieCardClick(movie)}
                title={`Click to ${isMobile ? 'see details' : 'watch trailer for'} "${movie.title}"`}
              >
                <img 
                  src={movie.poster} 
                  alt={movie.title} 
                  className="cinema-brutal-poster" 
                  loading="lazy" 
                  draggable="false" 
                />
                
                <div className="cinema-brutal-movie-info">
                  <h4 className="cinema-brutal-movie-title">{movie.title}</h4>
                  
                  <div className="cinema-brutal-movie-controls">
                    <button 
                      className={`cinema-brutal-control-btn ${movie.watched ? 'cinema-brutal-control-btn--unwatch' : 'cinema-brutal-control-btn--watch'}`}
                      onClick={(e) => toggleWatchedStatus(e, movie)} 
                      title={movie.watched ? "Mark as Unwatched" : "Mark as Watched"}
                    >
                      {movie.watched ? "↶" : "✓"}
                    </button>
                    
                    <button 
                      className="cinema-brutal-control-btn cinema-brutal-control-btn--trailer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isMobile) {
                          setSelectedMovieForSheet(movie);
                        } else {
                          playTrailer(movie.title);
                        }
                      }}
                      title="Watch Trailer"
                    >
                      {isMobile ? "DETAILS" : "TRAILER"}
                    </button>
                    
                    <button 
                      className="cinema-brutal-control-btn cinema-brutal-control-btn--delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRequest(movie);
                      }}
                      title="Delete Movie"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MOVIE COUNT */}
      <div className="cinema-brutal-count">
        📊 DISPLAYING {filteredAndSortedMovies.length} OF {movies.length} EPIC FEATURES! 📊
      </div>

      {/* TRAILER MODAL */}
      {showTrailerModal && (
        <div className="cinema-brutal-modal-overlay" onClick={closeTrailerModal}>
          <div className="cinema-brutal-modal cinema-brutal-trailer-modal" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeTrailerModal} className="cinema-brutal-close-btn">
              ✕
            </button>
            <iframe
              src={currentTrailerUrl}
              title="Movie Trailer"
              className="cinema-brutal-trailer-frame"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && movieToDelete && (
        <div className="cinema-brutal-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="cinema-brutal-modal" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowDeleteModal(false)} className="cinema-brutal-close-btn">
              ✕
            </button>
            <h3 className="cinema-brutal-modal-title">
              🗑️ REMOVE "{movieToDelete.title}"? 🗑️
            </h3>
            <p className="cinema-brutal-modal-text">
              Are you absolutely sure you want to eject this film from your collection? This action cannot be undone!
            </p>
            <div className="cinema-brutal-modal-actions">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="cinema-brutal-button"
              >
                🛡️ KEEP IT
              </button>
              <button 
                onClick={confirmDeleteMovie} 
                className="cinema-brutal-button cinema-brutal-button--primary"
              >
                💥 YES, REMOVE!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM SHEET */}
      {isMobile && selectedMovieForSheet && (
        <MovieBottomSheet
          movie={selectedMovieForSheet}
          onClose={() => setSelectedMovieForSheet(null)}
          onMarkWatched={(e) => { 
            toggleWatchedStatus(e, selectedMovieForSheet); 
            setSelectedMovieForSheet(null);
          }}
          onMarkUnwatched={(e) => { 
            toggleWatchedStatus(e, selectedMovieForSheet); 
            setSelectedMovieForSheet(null);
          }}
          onDelete={() => { 
            handleDeleteRequest(selectedMovieForSheet); 
            setSelectedMovieForSheet(null);
          }}
          onOpenTrailer={() => { 
            playTrailer(selectedMovieForSheet.title); 
            setSelectedMovieForSheet(null);
          }}
        />
      )}

      {/* MOBILE CONTROL PANEL */}
      {isMobile && (
        <MobileControlPanel
          onAddClick={() => setShowAddForm(prev => !prev)}
          onFilterChange={setFilter}
          currentFilter={filter}
          onSortChange={setSortBy}
          currentSort={sortBy}
          onSearchToggle={() => setShowSearchBar(prev => !prev)}
          isSearchVisible={showSearchBar}
        />
      )}
    </div>
  );
}