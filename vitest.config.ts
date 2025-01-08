import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true, 
    deps: {
        moduleDirectories: ['node_modules', 'src'],
    },
    environment: 'node',
    alias: { '@': '/src' },
  },
}))