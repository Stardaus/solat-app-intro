import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  site: 'https://nina.github.io', // Placeholder, will be adjusted for GitHub Pages
  base: '/solat-app-intro', // Repository name for GitHub Pages
});
