export function SvgFilters() {
  return (
    <svg width="0" height="0">
      <filter id="watercolorFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="50" />
      </filter>

      <filter id="noiseFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </svg>
  );
}
