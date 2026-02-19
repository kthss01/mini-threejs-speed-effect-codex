import { defineConfig } from 'vite';

const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' && repo ? `/${repo}/` : '/'
});
