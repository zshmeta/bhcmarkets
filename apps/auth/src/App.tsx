import { Providers } from "./utils/providers";
import { ErrorBoundary } from "./utils/ErrorBoundary";
import { AppRouter } from "./utils/router";

export default function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <AppRouter />
      </Providers>
    </ErrorBoundary>
  );
}
