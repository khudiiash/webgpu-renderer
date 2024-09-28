import { defineConfig } from "vite";
import mkcert from'vite-plugin-mkcert'

export default defineConfig ({
    assetsInclude: ['**/*.glb', '**/*.wgsl', '**/*.gltf'],
    server: {
        https: true,
    },
    plugins: [mkcert()]
});