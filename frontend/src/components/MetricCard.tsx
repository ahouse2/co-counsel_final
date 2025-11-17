import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  value?: string;
  subtitle?: string;
  chart?: boolean;
  timeline?: boolean;
  glow?: 'cyan' | 'violet' | 'gold' | 'red' | 'green'; // Updated glow options
};

export function MetricCard({ title, value, subtitle, chart, timeline, glow }: Props) {
  const glowMap = {
    cyan: 'shadow-cyan-md', // Using CDS shadow utility
    violet: 'shadow-violet-md', // Using CDS shadow utility
    gold: 'shadow-neon-gold', // Using CDS shadow utility
    red: 'shadow-[0_0_20px_var(--cds-color-accent-red)]', // Direct reference for specific glow
    green: 'shadow-[0_0_20px_var(--cds-color-accent-green)]', // Direct reference for specific glow
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'cds-card-cinematic', // Use the predefined cinematic card style
        glowMap[glow || 'cyan'] // Default to cyan glow
      )}
    >
      <h2 className="text-lg font-medium text-text-primary">{title}</h2>
      {value && <div className="text-4xl font-bold mt-2 text-text-primary">{value}</div>}
      {subtitle && <p className="text-sm text-text-tertiary">{subtitle}</p>}
      {chart && (
        <div className="mt-4 h-24 bg-gradient-to-r from-accent-violet-500 to-accent-cyan-500 rounded" />
      )}
      {timeline && (
        <div className="mt-4 h-2 bg-gradient-to-r from-accent-blue to-accent-violet-500 rounded-full" />
      )}
    </motion.div>
  );
}
