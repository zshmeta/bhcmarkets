import React, { type ReactNode } from 'react';

export const PullToRefresh: React.FC<{ children: ReactNode; onRefresh: () => Promise<void> }> = ({ children }) => {
    return <>{children}</>;
};
