/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      /* ── iOS System Colors ── */
      colors: {
        ios: {
          blue:    { DEFAULT: '#007AFF', dark: '#0A84FF' },
          green:   { DEFAULT: '#34C759', dark: '#30D158' },
          red:     { DEFAULT: '#FF3B30', dark: '#FF453A' },
          orange:  { DEFAULT: '#FF9500', dark: '#FF9F0A' },
          indigo:  { DEFAULT: '#5856D6', dark: '#5E5CE6' },
          purple:  { DEFAULT: '#AF52DE', dark: '#BF5AF2' },
          pink:    { DEFAULT: '#FF2D55', dark: '#FF375F' },
          teal:    { DEFAULT: '#30B0C7', dark: '#40C8E0' },
          yellow:  { DEFAULT: '#FFCC00', dark: '#FFD60A' },
          gray:    {
            '6': '#F2F2F7',
            '5': '#E5E5EA',
            '4': '#D1D1D6',
            '3': '#C7C7CC',
            '2': '#AEAEB2',
            '1': '#8E8E93',
          },
        },
        /* Semantic aliases */
        'bg-grouped':    'var(--bg-grouped)',
        'bg-elevated':   'var(--bg-elevated)',
        'bg-elevated-2': 'var(--bg-elevated-2)',
        'ios-label':     'var(--label)',
        'ios-secondary': 'var(--label-secondary)',
        'ios-tertiary':  'var(--label-tertiary)',
        'ios-sep':       'var(--separator)',
        'ios-fill':      'var(--fill-quaternary)',
        'ios-accent':    'var(--blue)',
      },

      /* ── 4pt grid spacing ── */
      spacing: {
        '0.5': '2px',
        '1':   '4px',
        '2':   '8px',
        '3':   '12px',
        '4':   '16px',
        '5':   '20px',
        '6':   '24px',
        '8':   '32px',
        '11':  '44px',
      },

      /* ── Border radius ── */
      borderRadius: {
        'ios-xs':  '8px',
        'ios-sm':  '12px',
        'ios-md':  '16px',
        'ios-lg':  '20px',
        'ios-xl':  '24px',
        'ios-2xl': '28px',
        'ios-sheet': '38px',
        'full': '9999px',
      },

      /* ── Spring easing ── */
      transitionTimingFunction: {
        'spring-smooth': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'spring-snappy': 'cubic-bezier(0.25, 1.5, 0.5, 1)',
        'ease-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'spring-long':  '400ms',
        'spring-short': '280ms',
        'std':          '200ms',
      },

      /* ── iOS-style box shadows ── */
      boxShadow: {
        'ios-card': '0 1px 2px rgba(0,0,0,0.04)',
        'ios-sheet': '0 -4px 32px rgba(0,0,0,0.12), 0 -1px 0 rgba(0,0,0,0.06)',
        'glass-regular': [
          '0 12px 32px -8px rgba(0,0,0,0.16)',
          '0 2px 8px -2px rgba(0,0,0,0.08)',
          'inset 0 1px 0 0 rgba(255,255,255,0.80)',
          'inset 0 -1px 0 0 rgba(255,255,255,0.20)',
        ].join(', '),
        'glass-thin': [
          '0 4px 16px -4px rgba(0,0,0,0.10)',
          '0 1px 4px -1px rgba(0,0,0,0.06)',
          'inset 0 1px 0 0 rgba(255,255,255,0.70)',
        ].join(', '),
        'glass-thick': [
          '0 24px 64px -16px rgba(0,0,0,0.22)',
          '0 8px 24px -8px rgba(0,0,0,0.12)',
          'inset 0 1px 0 0 rgba(255,255,255,0.85)',
        ].join(', '),
        'thumb': '0 3px 8px rgba(0,0,0,0.12), 0 1px 1px rgba(0,0,0,0.04)',
      },

      /* ── Typography ── */
      fontSize: {
        'ios-caption':      ['12px', { lineHeight: '16px', letterSpacing: '0px',   fontWeight: '500' }],
        'ios-footnote':     ['13px', { lineHeight: '18px', letterSpacing: '-0.08px', fontWeight: '400' }],
        'ios-subhead':      ['15px', { lineHeight: '20px', letterSpacing: '-0.23px', fontWeight: '400' }],
        'ios-body':         ['17px', { lineHeight: '22px', letterSpacing: '-0.43px', fontWeight: '400' }],
        'ios-headline':     ['17px', { lineHeight: '22px', letterSpacing: '-0.43px', fontWeight: '600' }],
        'ios-title3':       ['20px', { lineHeight: '25px', letterSpacing: '-0.20px', fontWeight: '600' }],
        'ios-title2':       ['22px', { lineHeight: '28px', letterSpacing: '-0.26px', fontWeight: '700' }],
        'ios-large-title':  ['34px', { lineHeight: '41px', letterSpacing: '-0.40px', fontWeight: '700' }],
      },

      /* ── Keyframe animations ── */
      keyframes: {
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0'  },
        },
        'pulse-dot': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':      { transform: 'scale(1.6)', opacity: '0' },
        },
        'slide-up': {
          'from': { opacity: '0', transform: 'translateY(8px)' },
          'to':   { opacity: '1', transform: 'translateY(0)'   },
        },
        'slide-down-in': {
          'from': { opacity: '0', transform: 'translateY(-12px)' },
          'to':   { opacity: '1', transform: 'translateY(0)'     },
        },
        'sheet-up': {
          'from': { transform: 'translateY(100%)' },
          'to':   { transform: 'translateY(0)'    },
        },
        'ripple': {
          '0%':   { transform: 'scale(1)',   opacity: '0.6' },
          '100%': { transform: 'scale(2.5)', opacity: '0'   },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to':   { opacity: '1' },
        },
      },
      animation: {
        'shimmer':      'shimmer 1.4s linear infinite',
        'pulse-dot':    'pulse-dot 2s cubic-bezier(0.32,0.72,0,1) infinite',
        'slide-up':     'slide-up 280ms cubic-bezier(0.25,1.5,0.5,1) both',
        'slide-down-in':'slide-down-in 280ms cubic-bezier(0.25,1.5,0.5,1) both',
        'sheet-up':     'sheet-up 400ms cubic-bezier(0.32,0.72,0,1) both',
        'ripple':       'ripple 1.2s cubic-bezier(0.32,0.72,0,1) infinite',
        'fade-in':      'fade-in 200ms cubic-bezier(0.4,0,0.2,1) both',
      },
    },
  },
  plugins: [],
};
