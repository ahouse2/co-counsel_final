import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge class names with Tailwind CSS
 * Combines clsx and tailwind-merge for better class handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts design token values to Tailwind classes
 */
export const tokenToTailwind = {
  // Background colors
  background: {
    canvas: 'bg-background-canvas',
    surface: 'bg-background-surface',
    panel: 'bg-background-panel',
    elevated: 'bg-background-elevated',
    overlay: 'bg-background-overlay',
    modal: 'bg-background-modal',
  },
  
  // Text colors
  text: {
    primary: 'text-text-primary',
    secondary: 'text-text-secondary',
    tertiary: 'text-text-tertiary',
    disabled: 'text-text-disabled',
    inverse: 'text-text-inverse',
    'accent-cyan': 'text-accent-cyan-500',
    'accent-violet': 'text-accent-violet-500',
    'accent-gold': 'text-accent-gold',
    'accent-red': 'text-accent-red',
    'accent-green': 'text-accent-green',
  },
  
  // Border colors
  border: {
    default: 'border-border',
    subtle: 'border-border-subtle',
    strong: 'border-border-strong',
  },
  
  // Radius
  radius: {
    xs: 'rounded-xs',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  },
  
  // Shadows
  shadow: {
    xs: 'shadow-xs',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    'cyan-xs': 'shadow-cyan-xs',
    'cyan-sm': 'shadow-cyan-sm',
    'cyan-md': 'shadow-cyan-md',
    'cyan-lg': 'shadow-cyan-lg',
    'violet-xs': 'shadow-violet-xs',
    'violet-sm': 'shadow-violet-sm',
    'violet-md': 'shadow-violet-md',
    'violet-lg': 'shadow-violet-lg',
  },
  
  // Animations
  animation: {
    'fade-in': 'animate-fade-in',
    'fade-out': 'animate-fade-out',
    'scale-in': 'animate-scale-in',
    'scale-out': 'animate-scale-out',
    'slide-in-right': 'animate-slide-in-right',
    'slide-out-right': 'animate-slide-out-right',
    'pulse': 'animate-pulse',
    'glow': 'animate-glow',
    'node-pulse': 'animate-node-pulse',
    'node-glow': 'animate-node-glow',
  },
  
  // Spacing (padding and margin)
  p: {
    1: 'p-1',
    2: 'p-2',
    3: 'p-3',
    4: 'p-4',
    5: 'p-5',
    6: 'p-6',
    8: 'p-8',
  },
  
  px: {
    1: 'px-1',
    2: 'px-2',
    3: 'px-3',
    4: 'px-4',
    5: 'px-5',
    6: 'px-6',
  },
  
  py: {
    1: 'py-1',
    2: 'py-2',
    3: 'py-3',
    4: 'py-4',
    5: 'py-5',
    6: 'py-6',
  },
  
  m: {
    1: 'm-1',
    2: 'm-2',
    3: 'm-3',
    4: 'm-4',
    5: 'm-5',
    6: 'm-6',
  },
  
  mx: {
    1: 'mx-1',
    2: 'mx-2',
    3: 'mx-3',
    4: 'mx-4',
    5: 'mx-5',
    6: 'mx-6',
  },
  
  my: {
    1: 'my-1',
    2: 'my-2',
    3: 'my-3',
    4: 'my-4',
    5: 'my-5',
    6: 'my-6',
  },
  
  // Typography
  font: {
    ui: 'font-ui',
    display: 'font-display',
    mono: 'font-mono',
  },
  
  text: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl',
  },
  
  font: {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
  },
  
  // Transitions
  transition: {
    fast: 'transition-fast',
    medium: 'transition-medium',
    slow: 'transition-slow',
  },
}