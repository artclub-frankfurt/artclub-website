import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const events = defineCollection({
  // Pattern excludes files starting with `_` so `_TEMPLATE.md` (the editor's
  // copy-paste reference) doesn't get treated as a real event.
  loader: glob({ pattern: ['**/*.md', '!**/_*.md'], base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    time: z.string().optional(),
    subtitle: z.string().optional(),
    lumaUrl: z.string().url(),
    coverImage: z.string().optional(),
    instagramPosts: z.array(z.string().url()).optional().default([]),
  }),
});

const site = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/site' }),
  schema: z.object({
    title: z.string().optional(),
    heroTitle: z.string().optional(),
    heroSubtitle: z.string().optional(),
  }),
});

export const collections = { events, site };
