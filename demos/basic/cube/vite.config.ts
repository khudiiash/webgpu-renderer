import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

export default defineConfig({
    plugins: [tsConfigPaths()],
    root: __dirname,
    base: './',
    assetsInclude: ['**/*.wgsl', '**/*.glb', '**/*.gltf'],
    build: {
        outDir: resolve(__dirname, 'dist'),
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, '../../../src')
        }
    }
});