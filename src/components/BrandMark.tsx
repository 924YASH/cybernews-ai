interface BrandMarkProps {
  size?: number;
  className?: string;
}

export function BrandMark({ size = 28, className = '' }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cnShieldGrad" x1="4" y1="3" x2="32" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="55%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="cnShieldFill" x1="6" y1="5" x2="30" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <path
        d="M18 3L5.5 8.2V16.8C5.5 24.4 10.8 30.8 18 33C25.2 30.8 30.5 24.4 30.5 16.8V8.2L18 3Z"
        fill="url(#cnShieldFill)"
        stroke="url(#cnShieldGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M18 7.5L9.5 11.1V16.8C9.5 22.1 13.1 26.6 18 28.4C22.9 26.6 26.5 22.1 26.5 16.8V11.1L18 7.5Z"
        stroke="#38BDF8"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      <path
        d="M13.2 18.2L16.5 21.5L23.2 14.5"
        stroke="#38BDF8"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
