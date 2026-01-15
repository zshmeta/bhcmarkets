// Stub pull-to-refresh hook

interface UsePullToRefreshOptions {
    onRefresh?: () => Promise<void>;
    disabled?: boolean;
}

export function usePullToRefresh(options: UsePullToRefreshOptions = {}) {
    return {
        refreshing: false,
        pulling: false,
        pullDistance: 0,
        containerRef: { current: null },
    };
}
