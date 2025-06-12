import { useState, useEffect } from "react";
import MoodBoardSectionDesktop from "./MoodBoardSectionDesktop";
import MoodBoardSectionMobile from "./MoodBoardSectionMobile";

/**
 * Main MoodBoardSection component that renders either mobile or desktop version
 * based on screen size.
 */
export default function MoodBoardSection() {
  const [isMobile, setIsMobile] = useState(false);
  
  // Check for mobile device on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Render the appropriate component based on screen size
  return isMobile ? <MoodBoardSectionMobile /> : <MoodBoardSectionDesktop />;
}