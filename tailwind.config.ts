import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#131313',
        foreground: '#e5e2e1',
        primary: '#ffffff',
        'primary-foreground': '#2f3131',
        'on-primary': '#2f3131',
        secondary: '#adc6ff',
        'secondary-container': '#0566d9',
        'on-secondary-container': '#e6ecff',
        'surface-container-lowest': '#0e0e0e',
        'surface-container-low': '#1c1b1b',
        'surface-container-high': '#2a2a2a',
        'surface-container-highest': '#353534',
        'on-surface': '#e5e2e1',
        'on-surface-variant': '#c4c7c8',
        'outline-variant': '#444748',
        outline: '#8e9192',
        error: '#ffb4ab',
        input: '#1c1b1b',
        ring: '#adc6ff',
        muted: '#2a2a2a',
        'muted-foreground': '#c4c7c8',
        'verdict-accepted': '#22c55e',
        'verdict-wrong': '#ef4444',
        'verdict-tle': '#eab308',
        'verdict-runtime': '#f97316',
        'verdict-compile': '#6b7280',
        'severity-critical': '#ef4444',
        'severity-warning': '#eab308',
        'severity-suggestion': '#3b82f6',
      },
      spacing: {
        'section-margin': '24px',
        'stack-gap': '4px',
        'element-gap': '8px',
        'container-padding': '12px',
      },
      fontFamily: {
        'headline-sm': ['var(--font-geist)', 'system-ui', 'sans-serif'],
        'body-sm': ['var(--font-geist)', 'system-ui', 'sans-serif'],
        display: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        'mono-sm': ['var(--font-jetbrains)', 'monospace'],
        'body-md': ['var(--font-geist)', 'system-ui', 'sans-serif'],
        'label-caps': ['var(--font-geist)', 'system-ui', 'sans-serif'],
        'headline-lg': ['var(--font-geist)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'headline-sm': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        display: ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'mono-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-caps': [
          '11px',
          { lineHeight: '16px', fontWeight: '600', letterSpacing: '0.05em' },
        ],
        'headline-lg': ['18px', { lineHeight: '24px', fontWeight: '600' }],
      },
      borderRadius: {
        DEFAULT: '0.125rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
