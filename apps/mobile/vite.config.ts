import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    server: {
        port: 5176,
        strictPort: true,
    },
    resolve: {
        alias: {
            // Stub react-native just in case some imports slip through
            'react-native': 'react-native-web',
        }
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    }
});
