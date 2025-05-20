import { useState, useRef, useEffect, FormEvent, MouseEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel"; // Assuming this path is correct
import { MovieBottomSheet } from "./MovieBottomSheet";
import { CinemaFilterType, CinemaSortByType, MobileControlPanel } from "./MobileControlPanel";


interface Movie {
  _id: Id<"cinema">; // Make sure Id<"cinema"> is the correct type from your dataModel
  title: string;
  poster: string;
  link: string;
  addedAt: number;
  watched?: boolean;
  watchedAt?: number;
}

// API Keys - It's better to move these to environment variables
const OMDB_API_KEY = '5f2c66a6'; // User's existing key
const YOUTUBE_API_KEY = 'AIzaSyC1hx_06tH-F2btecw0emxRoLZzpgD_UsM'; // User's existing key

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

  // Drag scroll for desktop (simplified, ensure it works with new layout)
  useEffect(() => {
    const el = moviesContainerRef.current;
    if (!el || isMobile) return; // Only apply on desktop

    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    const onMouseDown = (e: globalThis.MouseEvent) => {
      isDown = true;
      el.classList.add('active-drag');
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const onMouseLeaveOrUp = () => {
      isDown = false;
      el.classList.remove('active-drag');
    };
    const onMouseMove = (e: globalThis.MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5; // Faster scroll
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeaveOrUp);
    el.addEventListener('mouseup', onMouseLeaveOrUp);
    el.addEventListener('mousemove', onMouseMove);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeaveOrUp);
      el.removeEventListener('mouseup', onMouseLeaveOrUp);
      el.removeEventListener('mousemove', onMouseMove);
    };
  }, [isMobile]);


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
      return b.addedAt - a.addedAt; // recent
    });

  const handleAddMovie = async (e: FormEvent) => {
    e.preventDefault();
    if (!link.trim() || !movieName.trim()) {
      alert('Gotta enter a link and movie name, pal!'); return;
    }
    setIsLoadingAdd(true);
    try {
      const response = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${OMDB_API_KEY}`);
      const data = await response.json();
      
      if (data.Response === "True" && data.Poster && data.Poster !== "N/A") {
        await addMovieMutation({ title: movieName, poster: data.Poster, link });
        setLink(""); setMovieName(""); setShowAddForm(false);
      } else {
        alert(`Couldn't find a poster for "${movieName}". Try checking the name! (OMDb: ${data.Error || 'Unknown error'})`);
      }
    } catch (error) {
      console.error('Error fetching poster:', error);
      alert('Arcade machine jammed! Error adding movie.');
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
        document.body.classList.add('overflow-hidden-cute'); // Prevent body scroll
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
    document.body.classList.remove('overflow-hidden-cute');
  };

  const handleMovieCardClick = (movie: Movie) => {
    if (isMobile) {
      setSelectedMovieForSheet(movie);
    } else {
      playTrailer(movie.title);
    }
  };

  return (
    <div className="cinema-section-arcade">
      <header className="cinema-header-arcade">
        <h1>Our Cinema 🍿</h1>
        <div className="cinema-controls-arcade">
          <button onClick={() => setShowAddForm(p => !p)} className="cinema-button-arcade add">
            {showAddForm ? "Close Form 🔼" : "New Feature! ➕"}
          </button>
          <div className="control-group-arcade">
            <button onClick={() => setShowSearchBar(p => !p)} className={`cinema-button-arcade search ${showSearchBar ? 'active' : ''}`} aria-label="Search">
              🔍
            </button>
            <select value={filter} onChange={e => setFilter(e.target.value as any)} className="cinema-select-arcade">
              <option value="all">All Movies</option>
              <option value="unwatched">To Watch 🎞️</option>
              <option value="watched">Watched ✔️</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="cinema-select-arcade">
              <option value="recent">Newest ✨</option>
              <option value="alpha">A-Z 🔤</option>
              <option value="watched_date">Last Watched 📅</option>
            </select>
          </div>
        </div>
        {showSearchBar && (
          <input
            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search for a movie title..." className="cinema-search-input-arcade" autoFocus
          />
        )}
      </header>

      {showAddForm && (
        <form onSubmit={handleAddMovie} className="cinema-add-form-arcade">
          <h3>Got a New Flick for Us? 🎟️</h3>
          <input
            type="text" value={movieName} onChange={e => setMovieName(e.target.value)}
            placeholder="Movie Title (be exact for poster!)" className="cinema-input-arcade" required
          />
          <input
            type="url" value={link} onChange={e => setLink(e.target.value)}
            placeholder="Link to Watch (Netflix, etc.)" className="cinema-input-arcade" required
          />
          <button type="submit" className="cinema-button-arcade submit-add" disabled={isLoadingAdd}>
            {isLoadingAdd ? "Finding Poster..." : "Add to Lineup!"}
          </button>
        </form>
      )}

      <div className="cinema-movie-gallery-container-arcade">
        {filteredAndSortedMovies.length === 0 && (
          <div className="cinema-empty-state-arcade">
            <span className="icon">🕹️</span>
            <h2>No Movies Found!</h2>
            <p>{searchQuery ? "Try a different search term or clear filters!" : "Time to add some blockbusters to our collection!"}</p>
            {!showAddForm && <button onClick={() => setShowAddForm(true)} className="cinema-button-arcade add">Add First Movie!</button>}
          </div>
        )}
        <div 
          ref={moviesContainerRef} 
          className={`cinema-movie-reel-arcade ${isMobile ? 'mobile-scroll' : 'desktop-drag-scroll'}`}
        >
          {filteredAndSortedMovies.map(movie => (
            <div 
              key={movie._id} 
              className={`movie-card-arcade ${movie.watched ? "watched" : ""}`}
              onClick={() => handleMovieCardClick(movie)}
              title={`Click to ${isMobile ? 'see details' : 'watch trailer for'} "${movie.title}"`}
            >
              <img src={movie.poster} alt={movie.title} className="movie-poster-arcade" loading="lazy" draggable="false" />
              <div className="movie-info-overlay-arcade">
                <h4>{movie.title}</h4>
              </div>
              <button 
                className="movie-watched-toggle-arcade" 
                onClick={(e) => toggleWatchedStatus(e as any, movie)} // Cast e to any if type issues persist
                title={movie.watched ? "Mark as Unwatched" : "Mark as Watched"}
              >
                {movie.watched ? "✔️" : "◻️"}
              </button>
              <button 
                className="movie-delete-button-arcade"
                onClick={(e) => {e.stopPropagation(); handleDeleteRequest(movie);}}
                title="Delete Movie"
              >
                🗑️
              </button>
              {movie.watched && <div className="movie-watched-banner-arcade">VIEWED!</div>}
            </div>
          ))}
        </div>
      </div>
      <p className="cinema-movie-count-arcade">
        Displaying {filteredAndSortedMovies.length} of {movies.length} epic features!
      </p>


      {showTrailerModal && (
        <div className="cinema-trailer-modal-overlay-arcade" onClick={closeTrailerModal}>
          <div className="cinema-trailer-modal-content-arcade" onClick={e => e.stopPropagation()}>
            <button onClick={closeTrailerModal} className="close-trailer-button-arcade">X</button>
            <iframe
              src={currentTrailerUrl}
              title="Movie Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {showDeleteModal && movieToDelete && (
        <div className="cinema-delete-modal-overlay-arcade" onClick={() => setShowDeleteModal(false)}>
          <div className="cinema-delete-modal-content-arcade" onClick={e => e.stopPropagation()}>
            <h3>Remove "{movieToDelete.title}"?</h3>
            <p>Are you sure you want to eject this film from our collection?</p>
            <div className="cinema-delete-actions-arcade">
              <button onClick={() => setShowDeleteModal(false)} className="cinema-button-arcade cancel">Keep It!</button>
              <button onClick={confirmDeleteMovie} className="cinema-button-arcade delete">Yes, Remove!</button>
            </div>
          </div>
        </div>
      )}

      {isMobile && selectedMovieForSheet && (
        <MovieBottomSheet
          movie={selectedMovieForSheet}
          onClose={() => setSelectedMovieForSheet(null)}
          onMarkWatched={(e) => { toggleWatchedStatus(e, selectedMovieForSheet); setSelectedMovieForSheet(null);}}
          onMarkUnwatched={(e) => { toggleWatchedStatus(e, selectedMovieForSheet); setSelectedMovieForSheet(null);}}
          onDelete={() => { handleDeleteRequest(selectedMovieForSheet); setSelectedMovieForSheet(null);}}
          onOpenTrailer={() => { playTrailer(selectedMovieForSheet.title); setSelectedMovieForSheet(null);}}
        />
      )}

       {/* Mobile Control Panel - Re-using existing component but ensuring it fits the theme */}
       {isMobile && (
            <MobileControlPanel
                onAddClick={() => setShowAddForm(p => !p)}
                onFilterChange={setFilter} // Now compatible
                currentFilter={filter}
                onSortChange={setSortBy}  // Now compatible
                currentSort={sortBy}
                onSearchToggle={() => setShowSearchBar(p => !p)}
                isSearchVisible={showSearchBar}
            />
        )}
    </div>
  );
}