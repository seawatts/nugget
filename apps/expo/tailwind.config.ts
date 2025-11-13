// @ts-expect-error - nativewind/preset doesn't have types
import nativewindPreset from 'nativewind/preset';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  plugins: [],
  presets: [nativewindPreset],
  theme: {
    extend: {},
  },
};

export default config;
