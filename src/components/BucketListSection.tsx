import { useState, useEffect } from "react";
import BucketListSectionMobile from "./BucketListSectionMobile";
import BucketListSectionDesktop from "./BucketListSectionDesktop";
import { useTheme } from "./ThemeContext"; // Import useTheme

export default function BucketListSection() {
  const [isMobile, setIsMobile] = useState(false);
  const { theme } = useTheme(); // Get the current theme

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); 
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Apply the base starry theme class if the theme is starry
  const sectionClassName = theme === 'starry' ? 'bucket-list-section-starry starry-section' : '';

  return (
    <div className={sectionClassName}>
      {isMobile ? <BucketListSectionMobile /> : <BucketListSectionDesktop />}
    </div>
  );
}
