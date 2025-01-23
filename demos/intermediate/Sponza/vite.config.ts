import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

export default defineConfig({
    plugins: [tsConfigPaths()],
    root: __dirname,
    build: {
        outDir: resolve(__dirname, '../../../dist'),
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, '../../../src')
        }
    }
});