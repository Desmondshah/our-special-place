import { useState, useEffect } from "react";
import BucketListSectionMobile from "./BucketListSectionMobile";
import BucketListSectionDesktop from "./BucketListSectionDesktop";

export default function BucketListSection() {
  // State to track screen size
  const [isMobile, setIsMobile] = useState(false);
  
  // Effect to detect screen size and update on resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // Breakpoint for mobile/desktop switch
    };
    
    // Initial check
    checkScreenSize();
    
    // Listen for window resize events
    window.addEventListener("resize", checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);
  
  // Render appropriate version based on screen size
  return isMobile ? <BucketListSectionMobile /> : <BucketListSectionDesktop />;
}