export default function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-label="CareLadder logo"
    >
      <rect width="512" height="512" rx="115" fill="#ffffff" />
      <g transform="rotate(12 256 256)">
        <g stroke="#0d9488" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <line x1="382" y1="164" x2="382" y2="420" />
          <line x1="130" y1="276" x2="382" y2="276" />
          <path d="M 382 164 L 242 164 A 112 112 0 0 0 130 276 A 112 112 0 0 0 242 388 L 382 388" />
        </g>
        <circle cx="382" cy="100" r="24" fill="#0d9488" />
      </g>
    </svg>
  );
}
