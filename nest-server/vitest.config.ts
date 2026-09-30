import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    // class-transformer's @Type()/@ValidateNested() decorators (see
    // submit-product.dto.ts) read metadata via Reflect.getMetadata, which
    // reflect-metadata's polyfill provides. Nest's own bootstrap imports
    // it implicitly (main.ts's NestFactory chain), but a standalone unit
    // test never boots Nest, so it must be loaded explicitly here.
    setupFiles: ['reflect-metadata'],
  },
});
