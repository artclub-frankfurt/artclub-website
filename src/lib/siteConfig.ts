import { z } from 'astro:content';
import siteData from '../data/site.json';

const InstagramSchema = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('behold'),
    beholdWidgetId: z
      .string()
      .min(1, 'instagram.beholdWidgetId must be set when source is "behold"')
      .refine(v => v !== 'REPLACE_ME', 'instagram.beholdWidgetId is still "REPLACE_ME" — paste the real ID from the behold dashboard'),
    curatedPosts: z.array(z.string().url()).default([]),
  }),
  z.object({
    source: z.literal('curated'),
    beholdWidgetId: z.string().default(''),
    curatedPosts: z
      .array(z.string().url())
      .min(1, 'instagram.curatedPosts must contain at least one URL when source is "curated"'),
  }),
]);

const SiteConfigSchema = z.object({
  siteName: z.string(),
  tagline: z.string(),
  contactEmail: z.string().email(),
  googleFormUrl: z.string().url(),
  instagram: InstagramSchema,
  socialLinks: z.object({
    instagram: z.string().url(),
    email: z.string().email(),
  }),
});

export type SiteConfig = z.infer<typeof SiteConfigSchema>;

export const siteConfig: SiteConfig = SiteConfigSchema.parse(siteData);

const handleMatch = siteConfig.socialLinks.instagram.match(/instagram\.com\/([^\/?#]+)/);
export const instagramHandle = handleMatch ? `@${handleMatch[1]}` : '@artclub_frankfurt';
