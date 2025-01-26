import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import yaml from '@rollup/plugin-yaml'

export default defineConfig({
    plugins: [tsConfigPaths(), yaml()],
});