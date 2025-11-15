import path from 'node:path';
import { fileURLToPath } from 'node:url';
import withPWA from '@ducanh2912/next-pwa';
import withBundleAnalyzer from '@next/bundle-analyzer';
import { withPostHogConfig } from '@posthog/nextjs-config';
import { withBaml } from './baml-config';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // dynamicIO: true,
  // Note: eslint configuration is no longer supported in next.config.ts
  // Use next lint options or .eslintrc instead
  enablePrerenderSourceMaps: true,
  experimental: {
    // Forward browser logs to the terminal for easier debugging
    browserDebugInfoInTerminal: true,

    // cacheLife: true,
    // cacheComponents: true,

    // Enable support for `global-not-found`, which allows you to more easily define a global 404 page.
    globalNotFound: true,
    scrollRestoration: true,
    // turbopackPersistentCaching: true,
    useCache: true,
  },
  images: {
    remotePatterns: [
      { hostname: 'images.unsplash.com' },
      { hostname: 'gravatar.com' },
      { hostname: 'avatars.githubusercontent.com' },
      { hostname: 'cloudflare-ipfs.com' },
      { hostname: 'lh3.googleusercontent.com' },
      { hostname: 'media.licdn.com' },
      { hostname: 'img.clerk.com' },
      { hostname: 'image.tmdb.org' },
      { hostname: 'picsum.photos' },
      { hostname: 'nugget.baby' },
      { hostname: 'randomuser.me' },
      { hostname: 'cdn.brandfetch.io' },
      { hostname: '*.supabase.co' },
    ],
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  poweredByHeader: false,
  // compiler: {
  // removeConsole: true,
  // },
  reactStrictMode: true,
  transpilePackages: [
    '@nugget/analytics',
    '@nugget/api',
    '@nugget/db',
    '@nugget/id',
    '@nugget/ui',
    '@nugget/logger',
    '@nugget/zustand',
  ],
  turbopack: {
    // In monorepo: tooling/next/base.mjs -> workspace root (two levels up)
    root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
  },
  typescript: { ignoreBuildErrors: true },
};

const withPlugins = [
  process.env.WITH_BUNDLE_ANALYZER === 'true'
    ? withBundleAnalyzer({ enabled: true })
    : null,
  withBaml(),
  withPWA({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    fallbacks: {
      document: '/offline',
    },
    register: true,
    skipWaiting: true,
    workboxOptions: {
      runtimeCaching: [
        {
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts',
            expiration: {
              maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              maxEntries: 4,
            },
          },
          urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
        },
        {
          handler: 'CacheFirst',
          options: {
            cacheName: 'image-cache',
            expiration: {
              maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              maxEntries: 64,
            },
          },
          urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
        },
        {
          handler: 'CacheFirst',
          options: {
            cacheName: 'static-font-assets',
            expiration: {
              maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              maxEntries: 4,
            },
          },
          urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        },
        {
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-style-script-assets',
            expiration: {
              maxAgeSeconds: 24 * 60 * 60, // 24 hours
              maxEntries: 32,
            },
          },
          urlPattern: /\.(?:css|js)$/i,
        },
        {
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxAgeSeconds: 5 * 60, // 5 minutes
              maxEntries: 16,
            },
            networkTimeoutSeconds: 10,
          },
          urlPattern: /^\/api\/.*/i,
        },
        {
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages-cache',
            expiration: {
              maxAgeSeconds: 24 * 60 * 60, // 24 hours
              maxEntries: 32,
            },
          },
          urlPattern: /^\/app\/.*/i,
        },
      ],
    },
  }),
].filter((plugin) => plugin !== null);

const configWithPlugins = withPlugins.reduce(
  (acc, plugin) => plugin(acc),
  nextConfig,
);

/** @type {import('next').NextConfig} */
const finalConfig =
  process.env.POSTHOG_PERSONAL_API_KEY && process.env.POSTHOG_ENV_ID
    ? withPostHogConfig(configWithPlugins, {
        envId: process.env.POSTHOG_ENV_ID, // Environment ID
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST, // (optional), defaults to https://us.posthog.com
        personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY, // Personal API Key
      })
    : configWithPlugins;

export default finalConfig;
