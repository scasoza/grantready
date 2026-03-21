export default function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-label="CareLadder logo"
    >
      <rect width="512" height="512" rx="112" fill="#0d9488" />
      <path d="M 310 140 L 220 140 A 116 116 0 0 0 220 372 L 310 372"
            stroke="white" strokeWidth="52" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="220" y1="200" x2="370" y2="200" stroke="white" strokeWidth="40" strokeLinecap="round" />
      <line x1="220" y1="256" x2="370" y2="256" stroke="white" strokeWidth="40" strokeLinecap="round" />
      <line x1="220" y1="312" x2="370" y2="312" stroke="white" strokeWidth="40" strokeLinecap="round" />
    </svg>
  );
}
