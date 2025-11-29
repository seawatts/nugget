import { cn } from '@nugget/ui/lib/utils';

interface MarqueeProps {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children?: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
  [key: string]: unknown;
}

export default function Marquee({
  className,
  reverse,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        'group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]',
        {
          'flex-col': vertical,
          'flex-row': !vertical,
        },
        className,
      )}
    >
      {Array.from({ length: repeat }, (_, i) => (
        <div
          className={cn('flex shrink-0 justify-around [gap:var(--gap)]', {
            '[animation-direction:reverse]': reverse,
            'animate-marquee flex-row': !vertical,
            'animate-marquee-vertical flex-col': vertical,
            'group-hover:[animation-play-state:paused]': pauseOnHover,
          })}
          // biome-ignore lint/suspicious/noArrayIndexKey: Valid use case - repeating identical content for animation
          key={`marquee-item-${i}`}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
