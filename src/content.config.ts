import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const events = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*.md'], base: './src/content/events' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    date: z.coerce.date(),
    time: z.string().optional(),
    subtitle: z.string().optional(),
    lumaUrl: z.string().url().optional(),
    registrationClosed: z.boolean().optional().default(false),
    coverImage: image().optional(),
    coverImageAlt: z.string().optional(),
    coverImageCredit: z.string().optional(),
    instagramPosts: z.array(z.string().url()).optional().default([]),
  }),
});

const team = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*.md'], base: './src/content/team' }),
  schema: ({ image }) => z.object({
    name: z.string(),
    role: z.string(),
    email: z.string().email().optional(),
    // Required, sole sort key. z.coerce.number() so it parses whether Pages
    // CMS writes `order: 1` or `order: "1"` (mirrors z.coerce.date() above).
    order: z.coerce.number(),
    photo: image().optional(),
    photoAlt: z.string().optional(),
  }),
});

const site = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/site' }),
  schema: z.object({
    title: z.string().optional(),
    heroTitle: z.string().optional(),
    heroSubtitle: z.string().optional(),
    teamHeading: z.string().optional(),
    teamBlurb: z.string().optional(),
  }),
});

export const collections = { events, site, team };
