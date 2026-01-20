import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ReactNode, useRef } from 'react';
import { Card } from '@/components/ui/card';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: 'lift' | 'glow' | 'tilt' | 'none';
  onClick?: () => void;
  ariaLabel?: string;
}

export function AnimatedCard({
  children,
  className = '',
  hoverEffect = 'lift',
  onClick,
  ariaLabel,
}: AnimatedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Tilt effect calculations
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverEffect !== 'tilt' || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const hoverVariants = {
    lift: {
      rest: { scale: 1, y: 0, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
      hover: {
        scale: 1.02,
        y: -8,
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        transition: { type: 'spring', stiffness: 400, damping: 17 },
      },
    },
    glow: {
      rest: { scale: 1, boxShadow: '0 0 0 0 rgba(var(--primary), 0)' },
      hover: {
        scale: 1.01,
        boxShadow: '0 0 30px 5px rgba(var(--primary), 0.2)',
        transition: { duration: 0.3 },
      },
    },
    tilt: {
      rest: { scale: 1 },
      hover: { scale: 1.03, transition: { duration: 0.2 } },
    },
    none: {
      rest: {},
      hover: {},
    },
  };

  const variants = hoverVariants[hoverEffect];

  const MotionCard = motion(Card);

  return (
    <MotionCard
      ref={cardRef}
      className={className}
      style={
        hoverEffect === 'tilt'
          ? {
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
            }
          : undefined
      }
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      variants={variants}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <motion.div
        style={
          hoverEffect === 'tilt'
            ? {
                transform: 'translateZ(50px)',
                transformStyle: 'preserve-3d',
              }
            : undefined
        }
      >
        {children}
      </motion.div>
    </MotionCard>
  );
}
