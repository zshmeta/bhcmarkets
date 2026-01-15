// Container (smart component with store connection)
export { RecentPositions } from './RecentPositions';

// View (dumb component, pure props - for UI library)
export { RecentPositionsView } from './RecentPositions.view';
export type { RecentPositionsViewProps } from './RecentPositions.view';

// Hook (business logic)
export { useRecentPositions } from './useRecentPositions';
export type { UseRecentPositionsReturn } from './useRecentPositions';
