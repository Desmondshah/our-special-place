import { useState, useRef, useEffect, FormEvent, MouseEvent, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence, useMotionValue, useTransform, useDragControls, useAnimation } from "framer-motion";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = "dzpyafpzu";
const CLOUDINARY_UPLOAD_PRESET = "unsigned_uploads";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// TypeScript interfaces
interface Memory {
  photos: string[];
  rating: number;
  notes: string[];
  createdAt: string;
}

interface Plan {
  _id: Id<"plans">;
  title: string;
  date: string;
  type: string;
  website?: string;
  mapsLink?: string;
  isCompleted: boolean;
  memory?: Memory;
}

// Enhanced Image component with lazy loading and error handling
const EnhancedImage = ({ 
  src, 
  alt, 
  onClick 
}: { 
  src: string; 
  alt: string; 
  onClick?: () => void; 
}) => {
  const { loaded, error } = useOptimizedImage(src);
  
  if (error) {
    return (
      <div className="image-error">
        <span>📷</span>
        <span>Failed to load</span>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="enhanced-image-container"
      whileHover={{ scale: 1.02 }}
    >
      {!loaded && (
        <div className="image-placeholder">
          <LoadingSpinner size="small" />
        </div>
      )}
      <motion.img
        src={src}
        alt={alt}
        onClick={onClick}
        className={`enhanced-image ${loaded ? 'loaded' : 'loading'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.05 }}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      />
    </motion.div>
  );
};

// Utility functions
const useHapticFeedback = () => {
  const playHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
    if (!navigator.vibrate) return;
    
    const patterns = {
      light: [50],
      medium: [100],
      heavy: [200],
      success: [50, 50, 50],
      error: [100, 50, 100, 50, 100]
    };
    
    navigator.vibrate(patterns[type]);
  };
  
  return { playHaptic };
};

const useOptimizedImage = (src: string) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);
    img.src = src;
  }, [src]);
  
  return { loaded, error };
};

// Enhanced loading component
const LoadingSpinner = ({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8', 
    large: 'w-12 h-12'
  };
  
  return (
    <motion.div
      className={`loading-spinner ${sizeClasses[size]}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <div className="spinner-inner" />
    </motion.div>
  );
};

// Animation variants for Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95,
    rotateX: -10
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
      mass: 1
    }
  },
  hover: {
    y: -12,
    scale: 1.02,
    rotateX: 5,
    rotateY: 2,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      type: "spring",
      stiffness: 600,
      damping: 30
    }
  }
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    backdropFilter: "blur(0px)"
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    backdropFilter: "blur(20px)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    backdropFilter: "blur(0px)",
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
};

const fabVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
      delay: 0.5
    }
  },
  hover: {
    scale: 1.1,
    boxShadow: "0 8px 30px rgba(255, 107, 107, 0.4)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: {
    scale: 0.9
  }
};

const staggerChildVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

export default function PlansSection() {
  const plans = useQuery(api.plans.list) || [] as Plan[];
  const addPlan = useMutation(api.plans.add);
  const updatePlan = useMutation(api.plans.update);
  const togglePlan = useMutation(api.plans.toggle);
  const removePlan = useMutation(api.plans.remove);
  const addMemory = useMutation(api.plans.addMemory);

  // Hooks
  const { playHaptic } = useHapticFeedback();

  // State for new plan
  const [title, setTitle] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [type, setType] = useState<string>("date");
  const [website, setWebsite] = useState<string>("");
  const [mapsLink, setMapsLink] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // State for editing
  const [editingPlan, setEditingPlan] = useState<Id<"plans"> | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");
  const [editType, setEditType] = useState<string>("");
  const [editWebsite, setEditWebsite] = useState<string>("");
  const [editMapsLink, setEditMapsLink] = useState<string>("");

  // Memory states
  const [showMemoryModal, setShowMemoryModal] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [memoryRating, setMemoryRating] = useState<number>(5);
  const [memoryPhotos, setMemoryPhotos] = useState<string[]>([]);
  const [memoryNotes, setMemoryNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState<string>("");
  const [editingNoteIndex, setEditingNoteIndex] = useState<number>(-1);
  
  // View states
  const [viewFilter, setViewFilter] = useState<string>("all");
  const [imageViewerOpen, setImageViewerOpen] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  
  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Layout state
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Animation controls
  const headerControls = useAnimation();
  const dragControls = useDragControls();

  // Detect device and browser for optimizations
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [supportsWebP, setSupportsWebP] = useState(false);

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);

  // Enhanced search with debouncing
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  // Scroll section into view when navigating here
  const sectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // Device detection
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
      setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
    };
    
    // WebP support detection
    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const dataURL = canvas.toDataURL('image/webp');
      setSupportsWebP(dataURL.indexOf('data:image/webp') === 0);
    };
    
    checkDevice();
    checkWebPSupport();
    
    const debouncedResize = debounce(checkDevice, 300);
    window.addEventListener("resize", debouncedResize);
    
    return () => window.removeEventListener("resize", debouncedResize);
  }, []);

  // Debounce utility
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Enhanced error handling
  const handleError = (error: Error, context: string) => {
    console.error(`Error in ${context}:`, error);
    setErrors(prev => ({ ...prev, [context]: error.message }));
    playHaptic('error');
    
    // Auto-clear errors after 5 seconds
    setTimeout(() => {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[context];
        return newErrors;
      });
    }, 5000);
  };

  // Clear specific error
  const clearError = (context: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[context];
      return newErrors;
    });
  };

  // Safari-specific optimizations
  useEffect(() => {
    if (isSafari) {
      // Prevent bounce scrolling on Safari
      document.addEventListener('touchmove', (e) => {
        if (e.target instanceof Element && e.target.closest('.prevent-bounce')) {
          e.preventDefault();
        }
      }, { passive: false });
    }
  }, [isSafari]);

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize with current date if empty
  useEffect(() => {
    if (!date) setDate(getCurrentDate());
  }, [date]);

  // Header animation on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      headerControls.start({
        y: Math.min(scrollY * 0.1, 10),
        opacity: Math.max(1 - scrollY * 0.001, 0.8),
        scale: Math.max(1 - scrollY * 0.0001, 0.98)
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headerControls]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + N to add new plan
      if ((event.metaKey || event.ctrlKey) && event.key === 'n' && !showAddForm && !showMemoryModal) {
        event.preventDefault();
        setShowAddForm(true);
        playHaptic('light');
      }
      
      // Escape to close modals
      if (event.key === 'Escape') {
        if (showAddForm) {
          setShowAddForm(false);
        } else if (showMemoryModal) {
          setShowMemoryModal(false);
          resetMemoryModal();
        } else if (imageViewerOpen) {
          closeImageViewer();
        }
      }
      
      // Cmd/Ctrl + F to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
        event.preventDefault();
        const searchInput = document.querySelector('.search-input-macos') as HTMLInputElement;
        searchInput?.focus();
      }
      
      // Image viewer navigation
      if (imageViewerOpen) {
        switch (event.key) {
          case 'ArrowLeft':
            navigateImage('prev');
            break;
          case 'ArrowRight':
            navigateImage('next');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddForm, showMemoryModal, imageViewerOpen, currentImageIndex, viewerImages]);

  const handleAddPlan = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearError('addPlan');
    
    // Validation
    if (!title.trim()) {
      handleError(new Error('Adventure title is required'), 'addPlan');
      setIsLoading(false);
      return;
    }
    
    if (!date) {
      handleError(new Error('Date is required'), 'addPlan');
      setIsLoading(false);
      return;
    }
    
    // Check if date is in the past (optional warning)
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      const confirm = window.confirm('This date is in the past. Are you sure you want to continue?');
      if (!confirm) {
        setIsLoading(false);
        return;
      }
    }
    
    try {
      await addPlan({
        title: title.trim(),
        date,
        type,
        website: website.trim() || undefined,
        mapsLink: mapsLink.trim() || undefined,
        isCompleted: false
      });
      
      // Reset form with success feedback
      setTitle("");
      setDate(getCurrentDate());
      setType("date");
      setWebsite("");
      setMapsLink("");
      setShowAddForm(false);
      
      playHaptic('success');
      
      // Show success toast (you could implement a toast system here)
      console.log('Adventure added successfully!');
      
    } catch (error) {
      handleError(error as Error, 'addPlan');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (plan: Plan) => {
    setEditingPlan(plan._id);
    setEditTitle(plan.title);
    setEditDate(plan.date);
    setEditType(plan.type);
    setEditWebsite(plan.website || "");
    setEditMapsLink(plan.mapsLink || "");
    clearError('editPlan');
  };

  const handleSaveEdit = async (planId: Id<"plans">) => {
    setIsLoading(true);
    clearError('editPlan');
    
    if (!editTitle.trim() || !editDate) {
      handleError(new Error('Title and Date are required'), 'editPlan');
      setIsLoading(false);
      return;
    }
    
    try {
      await updatePlan({
        id: planId,
        title: editTitle.trim(),
        date: editDate,
        type: editType,
        website: editWebsite.trim() || undefined,
        mapsLink: editMapsLink.trim() || undefined,
      });
      
      setEditingPlan(null);
      playHaptic('success');
      
    } catch (error) {
      handleError(error as Error, 'editPlan');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced image optimization
  const optimizeImageForUpload = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate optimal dimensions (max 1920px width, maintain aspect ratio)
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: supportsWebP ? 'image/webp' : 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(optimizedFile);
            } else {
              resolve(file);
            }
          },
          supportsWebP ? 'image/webp' : 'image/jpeg',
          0.8 // Quality
        );
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  // Enhanced Cloudinary upload with retry logic and progress
  const uploadToCloudinary = async (file: File, retries: number = 3): Promise<string> => {
    setUploadError("");
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const optimizedFile = await optimizeImageForUpload(file);
        
        return await new Promise((resolve, reject) => {
          const formData = new FormData();
          formData.append('file', optimizedFile);
          formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
          formData.append('folder', 'memories');
          
          if (supportsWebP) {
            formData.append('format', 'webp');
          }
          
          const xhr = new XMLHttpRequest();
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percentComplete);
            }
          };
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText);
              resolve(response.secure_url);
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText || xhr.status}`));
            }
          };
          
          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.ontimeout = () => reject(new Error('Upload timeout'));
          
          xhr.timeout = 30000; // 30 second timeout
          xhr.open('POST', CLOUDINARY_UPLOAD_URL, true);
          xhr.send(formData);
        });
        
      } catch (error) {
        console.warn(`Upload attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new Error('All upload attempts failed');
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select a valid image file';
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return 'Image size must be less than 5MB';
    }
    
    // Check file format
    const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedFormats.includes(file.type)) {
      return 'Please use JPEG, PNG, WebP, or HEIC format';
    }
    
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      setUploadError(validationError);
      playHaptic('error');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");
    
    try {
      const cloudinaryUrl = await uploadToCloudinary(file);
      setMemoryPhotos(prevPhotos => [...prevPhotos, cloudinaryUrl]);
      playHaptic('success');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setUploadError(`Failed to upload image: ${errorMessage}`);
      playHaptic('error');
      
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Drag and drop functionality
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setUploadError('Please drop image files only');
      playHaptic('error');
      return;
    }
    
    // Process multiple files
    for (const file of imageFiles.slice(0, 5)) { // Limit to 5 files at once
      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        continue;
      }
      
      setIsUploading(true);
      setUploadProgress(0);
      
      try {
        const cloudinaryUrl = await uploadToCloudinary(file);
        setMemoryPhotos(prevPhotos => [...prevPhotos, cloudinaryUrl]);
      } catch (error) {
        console.error('Failed to upload file:', error);
      }
    }
    
    setIsUploading(false);
    setUploadProgress(0);
  };

  const openImageViewer = (photos: string[], startIndex: number) => {
    setViewerImages(photos);
    setCurrentImageIndex(startIndex);
    setCurrentImage(photos[startIndex]);
    setImageViewerOpen(true);
    document.body.classList.add('overflow-hidden-cute');
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setViewerImages([]);
    setCurrentImageIndex(0);
    setCurrentImage("");
    document.body.classList.remove('overflow-hidden-cute');
  };

  const navigateImage = (direction: 'next' | 'prev') => {
    if (viewerImages.length === 0) return;
    
    let newIndex = currentImageIndex;
    if (direction === 'next') {
      newIndex = (currentImageIndex + 1) % viewerImages.length;
    } else {
      newIndex = currentImageIndex === 0 ? viewerImages.length - 1 : currentImageIndex - 1;
    }
    
    setCurrentImageIndex(newIndex);
    setCurrentImage(viewerImages[newIndex]);
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      if (editingNoteIndex >= 0) {
        const updatedNotes = [...memoryNotes];
        updatedNotes[editingNoteIndex] = newNote.trim();
        setMemoryNotes(updatedNotes);
        setEditingNoteIndex(-1);
      } else {
        setMemoryNotes(prevNotes => [...prevNotes, newNote.trim()]);
      }
      setNewNote("");
    }
  };

  const handleSaveMemory = async () => {
    if (!selectedPlan) return;

    try {
      await addMemory({
        planId: selectedPlan._id,
        memory: {
          photos: memoryPhotos,
          rating: memoryRating,
          notes: memoryNotes,
          createdAt: new Date().toISOString()
        }
      });
      
      // Reset and close
      setShowMemoryModal(false);
      setMemoryPhotos([]);
      setMemoryRating(5);
      setMemoryNotes([]);
      setNewNote("");
      setSelectedPlan(null);
      setEditingNoteIndex(-1);
      
      // Success feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
    } catch (error) {
      console.error("Failed to save memory:", error);
    }
  };

  const editExistingMemory = (plan: Plan) => {
    if (!plan.memory) return;
    setSelectedPlan(plan);
    setMemoryRating(plan.memory.rating);
    setMemoryPhotos([...plan.memory.photos]);
    setMemoryNotes([...plan.memory.notes]);
    setShowMemoryModal(true);
  };

  // Memory modal reset function
  const resetMemoryModal = () => {
    setSelectedPlan(null);
    setMemoryPhotos([]);
    setMemoryRating(5);
    setMemoryNotes([]);
    setNewNote("");
    setEditingNoteIndex(-1);
    setUploadError("");
    clearError('memory');
  };

  // Enhanced filtering with performance optimization
  const filteredPlans = useMemo(() => {
    return plans.filter((plan: Plan) => {
      // Search filter
      if (debouncedSearchQuery) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        const titleMatch = plan.title.toLowerCase().includes(searchLower);
        const typeMatch = plan.type.toLowerCase().includes(searchLower);
        const dateMatch = plan.date.includes(searchLower);
        
        if (!titleMatch && !typeMatch && !dateMatch) {
          return false;
        }
      }
      
      // Status filter
      switch (viewFilter) {
        case "upcoming":
          return !plan.isCompleted;
        case "completed":
          return plan.isCompleted;
        case "withMemories":
          return Boolean(plan.memory);
        case "all":
        default:
          return true;
      }
    });
  }, [plans, debouncedSearchQuery, viewFilter]);

  // Enhanced sorting with multiple criteria
  const sortedPlans = useMemo(() => {
    return [...filteredPlans].sort((a: Plan, b: Plan) => {
      // Primary sort: completion status
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      
      // Secondary sort for completed items: memory status
      if (a.isCompleted && b.isCompleted) {
        if ((a.memory && b.memory) || (!a.memory && !b.memory)) {
          // Tertiary sort: date (newest first for completed)
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return a.memory ? -1 : 1;
      }
      
      // For upcoming items: date (soonest first)
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [filteredPlans]);

  // Plans grouped by month for better organization
  const plansByMonth = useMemo(() => {
    const groups: Record<string, Plan[]> = {};
    
    sortedPlans.forEach((plan: Plan) => {
      const date = new Date(plan.date + 'T00:00:00');
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      if (!groups[monthName]) {
        groups[monthName] = [];
      }
      groups[monthName].push(plan);
    });
    
    return groups;
  }, [sortedPlans]);

  // Statistics for the dashboard
  const stats = useMemo(() => {
    const total = plans.length;
    const completed = plans.filter((p: Plan) => p.isCompleted).length;
    const withMemories = plans.filter((p: Plan) => p.memory).length;
    const upcoming = plans.filter((p: Plan) => !p.isCompleted).length;
    
    return {
      total,
      completed,
      withMemories,
      upcoming,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      memoryRate: completed > 0 ? Math.round((withMemories / completed) * 100) : 0
    };
  }, [plans]);

  const getTypeEmoji = (type: string): string => {
    const emojis: { [key: string]: string } = {
      'date': '💖',
      'trip': '✈️',
      'activity': '🎉',
      'celebration': '🥳',
      'other': '🌟'
    };
    return emojis[type] || '✨';
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }),
      weekday: date.toLocaleString('default', { weekday: 'short' }),
      full: date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  };

  return (
    <div ref={sectionRef} className="plans-section-macos">
      {/* Enhanced Header with Statistics */}
      <motion.header 
        className="plans-header-macos"
        initial={{ opacity: 0, y: -30 }}
        animate={headerControls}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          backdropFilter: isSafari ? "blur(20px)" : "blur(10px)",
          WebkitBackdropFilter: "blur(20px)"
        }}
      >
        <div className="header-content">
          <motion.div 
            className="header-title-section"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          >
            <h1 className="section-title-macos">
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Our Adventures & Memories
              </motion.span>
              <motion.span 
                className="title-emoji"
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.2, 1.1, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "easeInOut"
                }}
              >
                💖
              </motion.span>
            </h1>
            <motion.div 
              className="section-stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="stat-item">
                <span className="stat-number">{stats.total}</span>
                <span className="stat-label">Adventures</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.completed}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.withMemories}</span>
                <span className="stat-label">With Memories</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.completionRate}%</span>
                <span className="stat-label">Success Rate</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            className="header-controls"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          >
            {/* Enhanced Search Bar */}
            <motion.div 
              className="search-container-macos"
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
            >
              <motion.input
                type="text"
                placeholder="Search adventures... (⌘F)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-macos"
                whileFocus={{ 
                  boxShadow: "0 0 0 3px rgba(255, 107, 107, 0.15)",
                  borderColor: "var(--accent-primary)"
                }}
                transition={{ duration: 0.2 }}
              />
              <motion.div 
                className="search-icon"
                animate={searchQuery ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                🔍
              </motion.div>
              {searchQuery && (
                <motion.button
                  className="search-clear"
                  onClick={() => setSearchQuery("")}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✕
                </motion.button>
              )}
            </motion.div>

            {/* Enhanced Filter Pills */}
            <motion.div 
              className="filter-pills-container"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {(['all', 'upcoming', 'completed', 'withMemories'] as const).map((filter, index) => {
                const counts = {
                  all: stats.total,
                  upcoming: stats.upcoming,
                  completed: stats.completed,
                  withMemories: stats.withMemories
                };
                
                return (
                  <motion.button
                    key={filter}
                    onClick={() => setViewFilter(filter)}
                    className={`filter-pill ${viewFilter === filter ? 'active' : ''}`}
                    variants={staggerChildVariants}
                    whileHover={{ 
                      scale: 1.05,
                      y: -2,
                      boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    layout
                    layoutId={`filter-${filter}`}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <motion.span
                      animate={viewFilter === filter ? { 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {filter === 'all' && '🌟 All'}
                      {filter === 'upcoming' && '⏰ Upcoming'}
                      {filter === 'completed' && '✅ Completed'}
                      {filter === 'withMemories' && '📸 With Memories'}
                    </motion.span>
                    <span className="filter-count">({counts[filter]})</span>
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              className="quick-actions"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <motion.button
                onClick={() => setViewMode(viewMode === 'grid' ? 'timeline' : 'grid')}
                className="view-toggle-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={`Switch to ${viewMode === 'grid' ? 'timeline' : 'grid'} view`}
              >
                {viewMode === 'grid' ? '📋' : '⊞'}
              </motion.button>
              
              <motion.button
                onClick={() => setShowAddForm(true)}
                className="add-quick-button"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 4px 15px rgba(255, 107, 107, 0.3)"
                }}
                whileTap={{ scale: 0.95 }}
                title="Add new adventure (⌘N)"
              >
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  +
                </motion.span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Error Banner */}
        <AnimatePresence>
          {Object.keys(errors).length > 0 && (
            <motion.div
              className="error-banner"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {Object.entries(errors).map(([context, message]) => (
                <motion.div 
                  key={context}
                  className="error-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <span>⚠️ {message}</span>
                  <button onClick={() => clearError(context)}>✕</button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Enhanced Add Form with Validation */}
      <AnimatePresence mode="wait">
        {showAddForm && (
          <motion.div
            className="add-form-container-macos"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              backdropFilter: isSafari ? "blur(20px)" : "blur(10px)",
              WebkitBackdropFilter: "blur(20px)"
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAddForm(false);
            }}
          >
            <motion.form 
              onSubmit={handleAddPlan} 
              className="add-form-macos"
              layoutId="add-form"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="form-header">
                <motion.h3
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Create New Adventure
                </motion.h3>
                <motion.button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="close-button-macos"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  ✕
                </motion.button>
              </div>

              {/* Form Error Display */}
              {errors.addPlan && (
                <motion.div 
                  className="form-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  ⚠️ {errors.addPlan}
                </motion.div>
              )}

              <motion.div 
                className="form-grid-macos"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="form-group" variants={staggerChildVariants}>
                  <label>Adventure Title *</label>
                  <motion.input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.addPlan) clearError('addPlan');
                    }}
                    placeholder="What's the adventure?"
                    className="form-input-macos"
                    required
                    maxLength={100}
                    whileFocus={{ 
                      scale: 1.02,
                      boxShadow: "0 0 0 3px rgba(255, 107, 107, 0.1)"
                    }}
                  />
                  <div className="input-hint">
                    {title.length}/100 characters
                  </div>
                </motion.div>

                <motion.div className="form-group" variants={staggerChildVariants}>
                  <label>Date *</label>
                  <motion.input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (errors.addPlan) clearError('addPlan');
                    }}
                    className="form-input-macos"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    whileFocus={{ 
                      scale: 1.02,
                      boxShadow: "0 0 0 3px rgba(255, 107, 107, 0.1)"
                    }}
                  />
                </motion.div>

                <motion.div className="form-group" variants={staggerChildVariants}>
                  <label>Type</label>
                  <motion.select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="form-select-macos"
                    whileFocus={{ 
                      scale: 1.02,
                      boxShadow: "0 0 0 3px rgba(255, 107, 107, 0.1)"
                    }}
                  >
                    <option value="date">💖 Date Night</option>
                    <option value="trip">✈️ Awesome Trip</option>
                    <option value="activity">🎉 Fun Activity</option>
                    <option value="celebration">🥳 Big Celebration</option>
                    <option value="other">🌟 Something Else</option>
                  </motion.select>
                </motion.div>

                <motion.div className="form-group span-2" variants={staggerChildVariants}>
                  <label>Website Link</label>
                  <motion.input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="form-input-macos"
                    whileFocus={{ 
                      scale: 1.02,
                      boxShadow: "0 0 0 3px rgba(255, 107, 107, 0.1)"
                    }}
                  />
                </motion.div>

                <motion.div className="form-group span-2" variants={staggerChildVariants}>
                  <label>Google Maps Link</label>
                  <motion.input
                    type="url"
                    value={mapsLink}
                    onChange={(e) => setMapsLink(e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="form-input-macos"
                    whileFocus={{ 
                      scale: 1.02,
                      boxShadow: "0 0 0 3px rgba(255, 107, 107, 0.1)"
                    }}
                  />
                </motion.div>
              </motion.div>

              <motion.div 
                className="form-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="button-secondary-macos"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className="button-primary-macos"
                  whileHover={{ 
                    scale: 1.02, 
                    y: -1,
                    boxShadow: "0 8px 25px rgba(255, 107, 107, 0.3)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading || !title.trim() || !date}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="small" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Adventure
                      <motion.span
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        style={{ display: "inline-block", marginLeft: "5px" }}
                      >
                        💫
                      </motion.span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content with Enhanced Grid */}
      <motion.main 
        className="plans-main-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {sortedPlans.length === 0 ? (
          <motion.div 
            className="empty-state-macos"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "backOut" }}
          >
            <motion.div 
              className="empty-icon"
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            >
              🗺️
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              No Adventures Yet!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Start planning your next amazing experience
            </motion.p>
            <motion.button
              onClick={() => setShowAddForm(true)}
              className="button-primary-macos"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 8px 25px rgba(255, 107, 107, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              Plan First Adventure ✨
            </motion.button>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div 
            className="plans-grid-macos"
            layout
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {sortedPlans.map((plan: Plan, index: number) => (
                <motion.div
                  key={plan._id}
                  className={`plan-card-macos ${plan.isCompleted ? 'completed' : ''} ${plan.memory ? 'has-memory' : ''}`}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  whileHover="hover"
                  whileTap="tap"
                  layout
                  layoutId={`plan-${plan._id}`}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    perspective: "1000px",
                    transformStyle: "preserve-3d"
                  }}
                >
                  {editingPlan === plan._id ? (
                    <motion.div 
                      className="edit-form-inline"
                      initial={{ opacity: 0, rotateX: -10 }}
                      animate={{ opacity: 1, rotateX: 0 }}
                      exit={{ opacity: 0, rotateX: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="form-grid-inline">
                        <motion.input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="form-input-inline"
                          placeholder="Adventure title"
                          whileFocus={{ scale: 1.02 }}
                        />
                        <motion.input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="form-input-inline"
                          whileFocus={{ scale: 1.02 }}
                        />
                        <motion.select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value)}
                          className="form-select-inline"
                          whileFocus={{ scale: 1.02 }}
                        >
                          <option value="date">💖 Date Night</option>
                          <option value="trip">✈️ Trip</option>
                          <option value="activity">🎉 Activity</option>
                          <option value="celebration">🥳 Celebration</option>
                          <option value="other">🌟 Other</option>
                        </motion.select>
                      </div>
                      <div className="edit-actions">
                        <motion.button
                          onClick={() => setEditingPlan(null)}
                          className="button-text-macos"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          onClick={() => handleSaveEdit(plan._id)}
                          className="button-primary-small-macos"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Save
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {/* Enhanced Card Header */}
                      <motion.div 
                        className="card-header-macos"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <motion.div 
                          className="date-badge-macos"
                          whileHover={{ 
                            scale: 1.05,
                            rotateY: 10,
                            boxShadow: "0 8px 20px rgba(0,0,0,0.15)"
                          }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <motion.div 
                            className="date-day"
                            animate={{ 
                              scale: [1, 1.05, 1],
                              color: ["var(--text-primary)", "var(--accent-primary)", "var(--text-primary)"]
                            }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                          >
                            {formatDateDisplay(plan.date).day}
                          </motion.div>
                          <div className="date-month">{formatDateDisplay(plan.date).month}</div>
                          <div className="date-weekday">{formatDateDisplay(plan.date).weekday}</div>
                        </motion.div>

                        <div className="card-title-section">
                          <motion.h3 
                            className="card-title"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 + 0.1 }}
                          >
                            <motion.span 
                              className="type-emoji"
                              animate={{ 
                                rotate: [0, 10, -10, 0],
                                scale: [1, 1.2, 1.1, 1]
                              }}
                              transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 4 + index * 0.5,
                                ease: "easeInOut"
                              }}
                            >
                              {getTypeEmoji(plan.type)}
                            </motion.span>
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.05 + 0.2 }}
                            >
                              {plan.title}
                            </motion.span>
                          </motion.h3>
                          <motion.p 
                            className="card-date-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 + 0.3 }}
                          >
                            {formatDateDisplay(plan.date).full}
                          </motion.p>
                        </div>

                        <motion.button
                          onClick={() => togglePlan({ id: plan._id, isCompleted: !plan.isCompleted })}
                          className={`completion-toggle ${plan.isCompleted ? 'completed' : ''}`}
                          whileHover={{ 
                            scale: 1.1,
                            rotate: plan.isCompleted ? -10 : 10
                          }}
                          whileTap={{ scale: 0.9 }}
                          title={plan.isCompleted ? "Mark as not done" : "Mark as complete"}
                        >
                          <motion.div
                            animate={plan.isCompleted ? { 
                              scale: [1, 1.3, 1],
                              rotate: [0, 360, 0]
                            } : { 
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                              duration: plan.isCompleted ? 0.6 : 2,
                              repeat: plan.isCompleted ? 0 : Infinity,
                              repeatDelay: 3
                            }}
                          >
                            {plan.isCompleted ? '✓' : '○'}
                          </motion.div>
                        </motion.button>
                      </motion.div>

                      {/* Enhanced Card Actions */}
                      <motion.div 
                        className="card-actions-macos"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 + 0.4 }}
                      >
                        {plan.website && (
                          <motion.a
                            href={plan.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="action-button-macos"
                            whileHover={{ 
                              scale: 1.05, 
                              y: -3,
                              boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
                            }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <motion.span
                              animate={{ rotate: [0, 360] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            >
                              🌐
                            </motion.span>
                            Website
                          </motion.a>
                        )}
                        {plan.mapsLink && (
                          <motion.a
                            href={plan.mapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="action-button-macos"
                            whileHover={{ 
                              scale: 1.05, 
                              y: -3,
                              boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
                            }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <motion.span
                              animate={{ 
                                y: [0, -2, 0],
                                scale: [1, 1.1, 1]
                              }}
                              transition={{ 
                                duration: 2, 
                                repeat: Infinity, 
                                repeatDelay: 2
                              }}
                            >
                              📍
                            </motion.span>
                            Maps
                          </motion.a>
                        )}
                        <motion.button
                          onClick={() => startEditing(plan)}
                          className="action-button-macos"
                          whileHover={{ 
                            scale: 1.05, 
                            y: -3,
                            boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          ✏️ Edit
                        </motion.button>
                        <motion.button
                          onClick={() => removePlan({ id: plan._id })}
                          className="action-button-macos danger"
                          whileHover={{ 
                            scale: 1.05, 
                            y: -3,
                            boxShadow: "0 5px 15px rgba(255,0,0,0.2)"
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          🗑️ Delete
                        </motion.button>
                      </motion.div>

                      {/* Enhanced Memory Section */}
                      {plan.isCompleted && (
                        <motion.div 
                          className="memory-section-macos"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ delay: index * 0.05 + 0.5, duration: 0.4 }}
                        >
                          {plan.memory ? (
                            <motion.div 
                              className="memory-preview"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              <div className="memory-header">
                                <motion.h4
                                  animate={{ 
                                    color: ["var(--text-primary)", "var(--accent-primary)", "var(--text-primary)"]
                                  }}
                                  transition={{ duration: 3, repeat: Infinity }}
                                >
                                  Memory Captured
                                </motion.h4>
                                <div className="memory-rating">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <motion.span
                                      key={i}
                                      className={i < plan.memory!.rating ? 'star filled' : 'star'}
                                      animate={i < plan.memory!.rating ? { 
                                        scale: [1, 1.3, 1],
                                        rotate: [0, 15, -15, 0]
                                      } : {}}
                                      transition={{ 
                                        delay: i * 0.1,
                                        duration: 0.8,
                                        repeat: Infinity,
                                        repeatDelay: 4
                                      }}
                                    >
                                      {i < plan.memory!.rating ? '⭐' : '☆'}
                                    </motion.span>
                                  ))}
                                </div>
                              </div>
                              
                              {plan.memory.photos.length > 0 && (
                                <motion.div 
                                  className="memory-photos-preview"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.3 }}
                                >
                                  {plan.memory.photos.slice(0, 3).map((photo: string, photoIndex: number) => (
                                    <motion.img
                                      key={photoIndex}
                                      src={photo}
                                      alt={`Memory ${photoIndex + 1}`}
                                      className="memory-photo-thumb"
                                      onClick={() => openImageViewer(plan.memory!.photos, photoIndex)}
                                      whileHover={{ 
                                        scale: 1.1, 
                                        zIndex: 10,
                                        rotateY: 5,
                                        boxShadow: "0 8px 25px rgba(0,0,0,0.2)"
                                      }}
                                      whileTap={{ scale: 0.95 }}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: photoIndex * 0.1 }}
                                    />
                                  ))}
                                  {plan.memory.photos.length > 3 && (
                                    <motion.div 
                                      className="more-photos"
                                      animate={{ 
                                        scale: [1, 1.05, 1],
                                        opacity: [0.7, 1, 0.7]
                                      }}
                                      transition={{ 
                                        duration: 2, 
                                        repeat: Infinity 
                                      }}
                                    >
                                      +{plan.memory.photos.length - 3}
                                    </motion.div>
                                  )}
                                </motion.div>
                              )}

                              <motion.button
                                onClick={() => editExistingMemory(plan)}
                                className="button-secondary-small-macos"
                                whileHover={{ 
                                  scale: 1.02,
                                  y: -2,
                                  boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
                                }}
                                whileTap={{ scale: 0.98 }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                              >
                                Edit Memory 📝
                              </motion.button>
                            </motion.div>
                          ) : (
                            <motion.button
                              onClick={() => { setSelectedPlan(plan); setShowMemoryModal(true); }}
                              className="add-memory-button"
                              whileHover={{ 
                                scale: 1.02, 
                                y: -3,
                                boxShadow: "0 8px 25px rgba(255, 107, 107, 0.3)"
                              }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 }}
                            >
                              <motion.span 
                                className="plus-icon"
                                animate={{ rotate: [0, 360] }}
                                transition={{ 
                                  duration: 3, 
                                  repeat: Infinity, 
                                  ease: "linear" 
                                }}
                              >
                                +
                              </motion.span>
                              <motion.span
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                Add Memory
                              </motion.span>
                            </motion.button>
                          )}
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          // Enhanced Timeline View
          <motion.div className="timeline-view-macos">
            {sortedPlans.map((plan: Plan, index: number) => (
              <motion.div
                key={plan._id}
                className="timeline-item-macos"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="timeline-marker" />
                <div className="timeline-content">
                  <h3>{plan.title}</h3>
                  <p>{formatDateDisplay(plan.date).full}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.main>

      {/* Floating Action Button removed as duplicate */}

      {/* Enhanced Memory Modal */}
      <AnimatePresence>
        {showMemoryModal && selectedPlan && (
          <motion.div
            className="modal-overlay-macos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              backdropFilter: isSafari ? "blur(20px)" : "blur(10px)",
              WebkitBackdropFilter: "blur(20px)"
            }}
          >
            <motion.div
              className="memory-modal-macos"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              drag={isMobile}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.1}
            >
              <motion.div 
                className="modal-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2>
                  {selectedPlan.memory ? 'Edit Memory' : 'Capture Memory'} 
                  <motion.span 
                    className="header-emoji"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    📸
                  </motion.span>
                </h2>
                <motion.button
                  onClick={() => {
                    setShowMemoryModal(false);
                    setSelectedPlan(null);
                    setMemoryPhotos([]);
                    setMemoryRating(5);
                    setMemoryNotes([]);
                    setNewNote("");
                    setEditingNoteIndex(-1);
                  }}
                  className="close-button-macos"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✕
                </motion.button>
              </motion.div>

              <motion.div 
                className="modal-content"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Enhanced Rating Section */}
                <motion.div className="rating-section" variants={staggerChildVariants}>
                  <label>How amazing was it?</label>
                  <div className="star-rating-macos">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        type="button"
                        onClick={() => setMemoryRating(star)}
                        className={`star-button ${star <= memoryRating ? "selected" : ""}`}
                        whileHover={{ 
                          scale: 1.3,
                          rotate: 15
                        }}
                        whileTap={{ scale: 0.8 }}
                        animate={star <= memoryRating ? { 
                          scale: [1, 1.3, 1],
                          rotate: [0, 360, 0]
                        } : {}}
                        transition={{ 
                          delay: star * 0.1,
                          duration: 0.6
                        }}
                      >
                        <motion.span
                          animate={star <= memoryRating ? {
                            filter: [
                              "drop-shadow(0 0 0px gold)",
                              "drop-shadow(0 0 8px gold)",
                              "drop-shadow(0 0 0px gold)"
                            ]
                          } : {}}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          ⭐
                        </motion.span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Enhanced Photo Upload Section with Drag & Drop */}
                <motion.div className="photo-section" variants={staggerChildVariants}>
                  <label>Share the moments</label>
                  <div 
                    className={`photo-upload-area ${isDragOver ? 'drag-over' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                    />
                    <motion.button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="upload-button-macos"
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isUploading ? (
                        <motion.div 
                          className="upload-progress"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="progress-wrapper">
                            <LoadingSpinner size="medium" />
                            <div className="progress-info">
                              <span className="progress-text">Uploading...</span>
                              <span className="progress-percent">{uploadProgress}%</span>
                            </div>
                          </div>
                          <div className="progress-bar">
                            <motion.div 
                              className="progress-fill"
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </motion.div>
                      ) : (
                        <div className="upload-content">
                          <motion.span 
                            className="upload-icon"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            📷
                          </motion.span>
                          <div className="upload-text">
                            <div className="upload-primary">Add Photos</div>
                            <div className="upload-secondary">
                              Drag & drop or click to browse
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.button>
                    
                    {/* Upload Guidelines */}
                    <div className="upload-guidelines">
                      <span>Supports JPEG, PNG, WebP, HEIC • Max 5MB each</span>
                    </div>
                  </div>

                  {/* Upload Error Display */}
                  {uploadError && (
                    <motion.div 
                      className="upload-error"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      ⚠️ {uploadError}
                      <button onClick={() => setUploadError("")}>✕</button>
                    </motion.div>
                  )}

                  {memoryPhotos.length > 0 && (
                    <motion.div 
                      className="photo-grid"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      layout
                    >
                      <AnimatePresence>
                        {memoryPhotos.map((photo, index) => (
                          <motion.div
                            key={photo}
                            className="photo-item"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ 
                              scale: 1.05,
                              rotateY: 5,
                              zIndex: 10
                            }}
                            layout
                          >
                            <EnhancedImage
                              src={photo}
                              alt={`Memory ${index + 1}`}
                              onClick={() => openImageViewer(memoryPhotos, index)}
                            />
                            <motion.button
                              onClick={() => setMemoryPhotos(prev => prev.filter((_, i) => i !== index))}
                              className="remove-photo-button"
                              whileHover={{ 
                                scale: 1.1,
                                backgroundColor: "#ff4444"
                              }}
                              whileTap={{ scale: 0.9 }}
                            >
                              ✕
                            </motion.button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </motion.div>

                {/* Enhanced Notes Section */}
                <motion.div className="notes-section" variants={staggerChildVariants}>
                  <label>What made it special?</label>
                  <div className="note-input-area">
                    <motion.textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Share your thoughts about this experience..."
                      className="note-textarea-macos"
                      rows={3}
                      whileFocus={{ 
                        scale: 1.02,
                        boxShadow: "0 0 0 3px rgba(255, 107, 107, 0.1)"
                      }}
                    />
                    <motion.button
                      type="button"
                      onClick={handleAddNote}
                      className="add-note-button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={!newNote.trim()}
                    >
                      {editingNoteIndex >= 0 ? 'Update Note' : 'Add Note'} ✍️
                    </motion.button>
                  </div>

                  {memoryNotes.length > 0 && (
                    <motion.div 
                      className="notes-list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                    >
                      <AnimatePresence>
                        {memoryNotes.map((note, index) => (
                          <motion.div
                            key={index}
                            className="note-item"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            whileHover={{ scale: 1.02 }}
                            layout
                          >
                            <p>"{note}"</p>
                            <div className="note-actions">
                              <motion.button
                                onClick={() => {
                                  setNewNote(note);
                                  setEditingNoteIndex(index);
                                }}
                                className="edit-note-button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                ✏️
                              </motion.button>
                              <motion.button
                                onClick={() => {
                                  setMemoryNotes(prev => prev.filter((_, i) => i !== index));
                                  if (editingNoteIndex === index) {
                                    setNewNote("");
                                    setEditingNoteIndex(-1);
                                  }
                                }}
                                className="delete-note-button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                🗑️
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>

              <motion.div 
                className="modal-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowMemoryModal(false);
                    setSelectedPlan(null);
                    setMemoryPhotos([]);
                    setMemoryRating(5);
                    setMemoryNotes([]);
                    setNewNote("");
                    setEditingNoteIndex(-1);
                  }}
                  className="button-secondary-macos"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleSaveMemory}
                  className="button-primary-macos"
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 8px 25px rgba(255, 107, 107, 0.3)"
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Save Memory 
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    style={{ display: "inline-block", marginLeft: "5px" }}
                  >
                    💫
                  </motion.span>
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Image Viewer */}
      <AnimatePresence>
        {imageViewerOpen && (
          <motion.div
            className="image-viewer-macos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeImageViewer}
            style={{
              backdropFilter: isSafari ? "blur(20px)" : "blur(10px)",
              WebkitBackdropFilter: "blur(20px)"
            }}
          >
            <motion.div
              className="image-container-macos"
              initial={{ scale: 0.8, opacity: 0, rotateY: -10 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateY: 10 }}
              onClick={(e) => e.stopPropagation()}
              drag={isMobile}
              dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
              dragElastic={0.1}
            >
              <motion.img
                key={currentImage}
                src={currentImage}
                alt="Memory"
                className="viewer-image"
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "backOut" }}
                whileHover={{ scale: 1.02 }}
              />
              
              {/* Enhanced Navigation */}
              {viewerImages.length > 1 && (
                <>
                  <motion.button
                    onClick={() => navigateImage('prev')}
                    className="nav-button prev"
                    whileHover={{ 
                      scale: 1.1, 
                      x: -8,
                      backgroundColor: "rgba(255,255,255,0.9)"
                    }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.span
                      animate={{ x: [-2, 2, -2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ←
                    </motion.span>
                  </motion.button>
                  <motion.button
                    onClick={() => navigateImage('next')}
                    className="nav-button next"
                    whileHover={{ 
                      scale: 1.1, 
                      x: 8,
                      backgroundColor: "rgba(255,255,255,0.9)"
                    }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.span
                      animate={{ x: [-2, 2, -2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </motion.button>
                </>
              )}

              <motion.button
                onClick={closeImageViewer}
                className="close-viewer-button"
                whileHover={{ 
                  scale: 1.1, 
                  rotate: 90,
                  backgroundColor: "rgba(255,255,255,0.9)"
                }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                ✕
              </motion.button>

              {/* Enhanced Image Counter */}
              {viewerImages.length > 1 && (
                <motion.div 
                  className="image-counter"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.span
                    key={currentImageIndex}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentImageIndex + 1}
                  </motion.span>
                  {" / "}
                  {viewerImages.length}
                </motion.div>
              )}

              {/* Image loading indicator */}
              <motion.div
                className="image-loader"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 0.5 }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}