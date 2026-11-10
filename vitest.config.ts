import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.ts'],
      // Los tests con userEvent (formularios, fechas) superan 5 s en máquinas cargadas.
      testTimeout: 15000,
      clearMocks: true,
      restoreMocks: true,
    },
  }),
)
