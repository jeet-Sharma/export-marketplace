type DecorativeBloomProps = { className?: string };

export function DecorativeBloom({ className }: DecorativeBloomProps) {
  return (
    <svg className={className} viewBox="0 0 220 220" fill="none" aria-hidden>
      <g opacity="0.5">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <ellipse
            key={deg}
            cx="110"
            cy="60"
            rx="26"
            ry="52"
            fill="#f4a340"
            opacity="0.18"
            transform={`rotate(${deg} 110 110)`}
          />
        ))}
        <circle cx="110" cy="110" r="26" fill="#d94272" opacity="0.25" />
      </g>
    </svg>
  );
}
