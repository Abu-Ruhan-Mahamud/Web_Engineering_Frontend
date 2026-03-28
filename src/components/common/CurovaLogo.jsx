/**
 * CUROVA Logo SVG component — matches the demo exactly.
 */
export default function CurovaLogo({ size = 140 }) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
      <path
        d="M100 30 L100 90 L60 90 L60 110 L100 110 L100 170 L120 170 L120 110 L160 110 L160 90 L120 90 L120 30 Z"
        fill="#4A90E2"
        stroke="#2563EB"
        strokeWidth="2"
      />
      <circle cx="100" cy="120" r="12" fill="#10B981" />
      <path d="M100 135 Q85 145, 75 165 L125 165 Q115 145, 100 135 Z" fill="#10B981" />
      <path d="M85 145 Q70 150, 65 165" stroke="#34D399" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M115 145 Q130 150, 135 165" stroke="#34D399" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M75 155 Q68 160, 70 170" stroke="#34D399" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M125 155 Q132 160, 130 170" stroke="#34D399" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
