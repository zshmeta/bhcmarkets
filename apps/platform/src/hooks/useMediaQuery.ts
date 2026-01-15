import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile viewport
 */
export const useIsMobile = (breakpoint = 768): boolean => {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [breakpoint]);

    return isMobile;
};

export default useIsMobile;
