import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Colors from the design system
      colors: {
        background: {
          canvas: 'var(--cds-color-bg-canvas)',
          surface: 'var(--cds-color-bg-surface)',
          panel: 'var(--cds-color-bg-panel)',
          elevated: 'var(--cds-color-bg-elevated)',
          overlay: 'var(--cds-color-bg-overlay)',
          modal: 'var(--cds-color-bg-modal)',
        },
        text: {
          primary: 'var(--cds-color-text-primary)',
          secondary: 'var(--cds-color-text-secondary)',
          tertiary: 'var(--cds-color-text-tertiary)',
          disabled: 'var(--cds-color-text-disabled)',
          inverse: 'var(--cds-color-text-inverse)',
        },
        accent: {
          cyan: {
            100: 'var(--cds-color-accent-cyan-100)',
            200: 'var(--cds-color-accent-cyan-200)',
            300: 'var(--cds-color-accent-cyan-300)',
            400: 'var(--cds-color-accent-cyan-400)',
            500: 'var(--cds-color-accent-cyan-500)',
            600: 'var(--cds-color-accent-cyan-600)',
            700: 'var(--cds-color-accent-cyan-700)',
            800: 'var(--cds-color-accent-cyan-800)',
            900: 'var(--cds-color-accent-cyan-900)',
          },
          violet: {
            100: 'var(--cds-color-accent-violet-100)',
            200: 'var(--cds-color-accent-violet-200)',
            300: 'var(--cds-color-accent-violet-300)',
            400: 'var(--cds-color-accent-violet-400)',
            500: 'var(--cds-color-accent-violet-500)',
            600: 'var(--cds-color-accent-violet-600)',
            700: 'var(--cds-color-accent-violet-700)',
            800: 'var(--cds-color-accent-violet-800)',
            900: 'var(--cds-color-accent-violet-900)',
          },
          gold: 'var(--cds-color-accent-gold)',
          red: 'var(--cds-color-accent-red)',
          green: 'var(--cds-color-accent-green)',
          pink: '#ff00ff', // No CDS equivalent, keep as is
          blue: '#3b82f6', // No CDS equivalent, keep as is
        },
        border: {
          DEFAULT: 'var(--cds-color-border-default)',
          subtle: 'var(--cds-color-border-subtle)',
          strong: 'var(--cds-color-border-strong)',
        },
      },
      
      // Typography
      fontFamily: {
        ui: ['var(--cds-font-ui)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['var(--cds-font-display)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--cds-font-mono)', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace'],
      },
      
      // Border radius
      borderRadius: {
        xs: 'var(--cds-radius-xs)',
        sm: 'var(--cds-radius-sm)',
        md: 'var(--cds-radius-md)',
        lg: 'var(--cds-radius-lg)',
        xl: 'var(--cds-radius-xl)',
        '2xl': 'var(--cds-radius-2xl)',
        '3xl': 'var(--cds-radius-3xl)',
        full: 'var(--cds-radius-full)',
      },
      
      // Spacing - Tailwind's default spacing scale is usually sufficient and often preferred
      // If custom spacing is needed, it should be defined using CSS variables and referenced here.
      // For now, I'll leave the existing spacing as is, assuming it's either Tailwind defaults
      // or intentionally defined. If issues arise, this section might need further review.
      spacing: {
        0: '0',
        1: '0.25rem',      // 4px
        2: '0.5rem',       // 8px
        3: '0.75rem',      // 12px
        4: '1rem',         // 16px
        5: '1.25rem',      // 20px
        6: '1.5rem',       // 24px
        7: '1.75rem',      // 28px
        8: '2rem',         // 32px
        9: '2.25rem',      // 36px
        10: '2.5rem',      // 40px
        11: '2.75rem',     // 44px
        12: '3rem',        // 48px
        14: '3.5rem',      // 56px
        16: '4rem',        // 64px
        20: '5rem',        // 80px
        24: '6rem',        // 96px
        28: '7rem',        // 112px
        32: '8rem',        // 128px
        36: '9rem',        // 144px
        40: '10rem',       // 160px
        44: '11rem',       // 176px
        48: '12rem',       // 192px
        52: '13rem',       // 208px
        56: '14rem',       // 224px
        60: '15rem',       // 240px
        64: '16rem',       // 256px
        72: '18rem',       // 288px
        80: '20rem',       // 320px
        96: '24rem',       // 384px
      },
      
      // Shadows and glows
      boxShadow: {
        xs: 'var(--cds-shadow-xs)',
        sm: 'var(--cds-shadow-sm)',
        md: 'var(--cds-shadow-md)',
        lg: 'var(--cds-shadow-lg)',
        xl: 'var(--cds-shadow-xl)',
        'cyan-xs': 'var(--cds-glow-cyan-xs)',
        'cyan-sm': 'var(--cds-glow-cyan-sm)',
        'cyan-md': 'var(--cds-glow-cyan-md)',
        'cyan-lg': 'var(--cds-glow-cyan-lg)',
        'violet-xs': 'var(--cds-glow-violet-xs)',
        'violet-sm': 'var(--cds-glow-violet-sm)',
        'violet-md': 'var(--cds-glow-violet-md)',
        'violet-lg': 'var(--cds-glow-violet-lg)',
        'neon-cyan': '0 0 28px var(--cds-color-accent-cyan-500)', // Reference CDS color
        'neon-violet': '0 0 36px var(--cds-color-accent-violet-500)', // Reference CDS color
        'neon-gold': '0 0 24px var(--cds-color-accent-gold)', // Reference CDS color
      },
      
      // Animation durations
      animation: {
        'fade-in': 'fade-in var(--cds-duration-medium) var(--cds-ease-out)',
        'fade-out': 'fade-out var(--cds-duration-medium) var(--cds-ease-out)',
        'scale-in': 'scale-in var(--cds-duration-medium) var(--cds-ease-elastic)',
        'scale-out': 'scale-out var(--cds-duration-medium) var(--cds-ease-elastic)',
        'slide-in-right': 'slide-in-right var(--cds-duration-medium) var(--cds-ease-elastic)',
        'slide-out-right': 'slide-out-right var(--cds-duration-medium) var(--cds-ease-elastic)',
        'pulse': 'pulse var(--cds-animation-pulse-duration) infinite', // Assuming a CDS variable for pulse duration
        'glow': 'glow var(--cds-animation-glow-duration) infinite',   // Assuming a CDS variable for glow duration
        'node-pulse': 'node-pulse var(--cds-animation-node-pulse-duration) infinite', // Assuming a CDS variable
        'node-glow': 'node-glow var(--cds-animation-node-glow-duration) infinite',   // Assuming a CDS variable
        'fade-up': 'fadeInUp .6s cubic-bezier(.2,.9,.2,1) both',
        'neon-slow': 'neonPulse 2.6s ease-in-out infinite',
        'shimmer': 'shimmer 2.2s linear infinite'
      },
      
      // Keyframes - These are already defined in index.css, so Tailwind should pick them up.
      // No changes needed here, as Tailwind's JIT mode will handle the keyframes.
      keyframes: {
        'fadeInUp': { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)'} },
        'neonPulse': { '0%': { boxShadow: '0 0 6px rgba(0,228,255,0.08)' }, '50%': { boxShadow: '0 0 18px rgba(0,228,255,0.22)' }, '100%': { boxShadow: '0 0 6px rgba(0,228,255,0.08)'}},
        'shimmer': {'0%': { 'background-position': '-200% 0'}, '100%': { 'background-position': '200% 0'}},
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'scale-out': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'glow': {
          '0%, 100%': { 
            boxShadow: 'var(--cds-glow-cyan-xs)', // Reference CDS variable
          },
          '50%': { 
            boxShadow: 'var(--cds-glow-cyan-md)', // Reference CDS variable
          },
        },
        'node-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 0 0 var(--cds-color-accent-cyan-400)', // Reference CDS color
          },
          '70%': { 
            boxShadow: '0 0 0 8px rgba(24, 202, 254, 0)',
          },
        },
        'node-glow': {
          '0%, 100%': { 
            filter: 'brightness(1) drop-shadow(0 0 2px var(--cds-color-accent-cyan-500))', // Reference CDS color
          },
          '50%': { 
            filter: 'brightness(1.2) drop-shadow(0 0 8px var(--cds-color-accent-cyan-800))', // Reference CDS color
          },
        },
      },
      
      // Transition timing functions
      transitionTimingFunction: {
        'ease-in': 'var(--cds-ease-in)',
        'ease-out': 'var(--cds-ease-out)',
        'ease-in-out': 'var(--cds-ease-in-out)',
        'elastic': 'var(--cds-ease-elastic)',
      },
      
      // Transition durations
      transitionDuration: {
        'fast': 'var(--cds-duration-fast)',
        'medium': 'var(--cds-duration-medium)',
        'slow': 'var(--cds-duration-slow)',
        'slower': 'var(--cds-duration-slower)',
      },
      
      // Z-index
      zIndex: {
        'backdrop': 'var(--cds-z-backdrop)',
        'surface': 'var(--cds-z-surface)',
        'panel': 'var(--cds-z-panel)',
        'dropdown': 'var(--cds-z-dropdown)',
        'sticky': 'var(--cds-z-sticky)',
        'fixed': 'var(--cds-z-fixed)',
        'modal': 'var(--cds-z-modal)',
        'popover': 'var(--cds-z-popover)',
        'tooltip': 'var(--cds-z-tooltip)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
  ],
}

export default config