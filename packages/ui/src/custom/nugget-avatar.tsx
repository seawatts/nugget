import { cn } from '@nugget/ui/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const nuggetAvatarVariants = cva(
  'relative inline-flex items-center justify-center shrink-0',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        lg: 'size-16',
        md: 'size-12',
        sm: 'size-8',
        xl: 'size-24',
      },
    },
  },
);

const contentVariants = cva(
  'absolute inset-0 flex items-center justify-center rounded-full font-semibold select-none',
  {
    defaultVariants: {
      size: 'md',
    },
    variants: {
      size: {
        lg: 'text-2xl',
        md: 'text-base',
        sm: 'text-xs',
        xl: 'text-4xl',
      },
    },
  },
);

interface NuggetAvatarProps extends VariantProps<typeof nuggetAvatarVariants> {
  name?: string;
  letter?: string;
  image?: string;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
}

function NuggetAvatar({
  name,
  letter,
  image,
  backgroundColor = '#FBBF24',
  textColor = '#78350F',
  size = 'md',
  className,
}: NuggetAvatarProps) {
  const displayLetter = letter || (name ? name.charAt(0).toUpperCase() : '?');

  return (
    <div className={cn(nuggetAvatarVariants({ size }), className)}>
      {/* Content (letter or image) */}
      <div
        className={cn(contentVariants({ size }))}
        style={{
          backgroundColor: image ? 'transparent' : backgroundColor,
          color: textColor,
        }}
      >
        {image ? (
          <img
            alt={name || 'Avatar'}
            className="size-full rounded-full object-contain"
            src={image || '/placeholder.svg'}
          />
        ) : (
          <span>{displayLetter}</span>
        )}
      </div>

      <svg
        className="pointer-events-none absolute inset-0 size-full"
        fill="none"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>{name || 'Avatar'}</title>
        <defs>
          <clipPath id="circle-clip">
            <circle cx="50" cy="50" r="50" />
          </clipPath>

          <radialGradient cx="50%" cy="90%" id="shell-gradient" r="60%">
            <stop offset="0%" stopColor="#F8F3EB" stopOpacity="1" />
            <stop offset="40%" stopColor="#F2EBE0" stopOpacity="1" />
            <stop offset="100%" stopColor="#E8DFD0" stopOpacity="1" />
          </radialGradient>

          <radialGradient cx="50%" cy="30%" id="inner-shadow" r="70%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="70%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </radialGradient>

          <filter id="shell-drop-shadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
            <feOffset dx="0" dy="1" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA slope="0.3" type="linear" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g clipPath="url(#circle-clip)">
          <path
            d="M 0 70 L 12 75 L 20 66 L 32 78 L 38 69 L 52 76 L 65 68 L 78 77 L 88 70 L 100 73 Q 100 85 85 95 Q 70 105 50 105 Q 30 105 15 95 Q 0 85 0 70 Z"
            fill="#000000"
            opacity="0.08"
            transform="translate(0, 2)"
          />

          <path
            d="M 0 70 L 12 75 L 20 66 L 32 78 L 38 69 L 52 76 L 65 68 L 78 77 L 88 70 L 100 73 Q 100 85 85 95 Q 70 105 50 105 Q 30 105 15 95 Q 0 85 0 70 Z"
            fill="url(#shell-gradient)"
            filter="url(#shell-drop-shadow)"
          />

          <path
            d="M 0 70 L 12 75 L 20 66 L 32 78 L 38 69 L 52 76 L 65 68 L 78 77 L 88 70 L 100 73"
            fill="none"
            opacity="0.6"
            stroke="white"
            strokeWidth="1.5"
          />

          <path
            d="M 0 70 Q 0 85 15 95 Q 30 105 50 105 Q 70 105 85 95 Q 100 85 100 70"
            fill="none"
            opacity="0.7"
            stroke="#B8A089"
            strokeWidth="0.8"
          />
        </g>
      </svg>
    </div>
  );
}

export { NuggetAvatar, type NuggetAvatarProps };
