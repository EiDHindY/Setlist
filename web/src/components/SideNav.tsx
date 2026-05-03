"use client";

import React from 'react';
import { SideNavProps } from './navigation/nav-config';
import { DesktopSideNav } from './navigation/DesktopSideNav';
import { MobileBottomNav } from './navigation/MobileBottomNav';

/**
 * Main Navigation Orchestrator
 * Automatically switches between Desktop Side Sidebar and Mobile Bottom Bar
 */
export default function SideNav(props: SideNavProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      // Use 768px (md breakpoint) to match Tailwind responsive classes
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return <MobileBottomNav {...props} />;
  }

  return <DesktopSideNav {...props} />;
}
