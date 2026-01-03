/**
 * App Router.
 * 
 * Simple client-side router for the auth app.
 * Uses hash-based routing for simplicity.
 */

import { useState, useEffect, type ReactNode } from "react";

/**
 * Route definition.
 */
export interface Route {
  path: string;
  component: ReactNode;
}

/**
 * Router props.
 */
export interface RouterProps {
  routes: Route[];
  notFound?: ReactNode;
}

/**
 * Simple hash-based router component.
 */
export function Router({ routes, notFound }: RouterProps) {
  const [currentPath, setCurrentPath] = useState(getHashPath());

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(getHashPath());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Find matching route
  const route = routes.find((r) => r.path === currentPath);

  return <>{route ? route.component : notFound || <div>404 - Not Found</div>}</>;
}

/**
 * Get current hash path (without #).
 */
function getHashPath(): string {
  const hash = window.location.hash.slice(1);
  return hash || "/";
}

/**
 * Navigate to a path.
 */
export function navigate(path: string): void {
  window.location.hash = path;
}

/**
 * Link component for navigation.
 */
export interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Link({ to, children, className, style }: LinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={`#${to}`} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  );
}
