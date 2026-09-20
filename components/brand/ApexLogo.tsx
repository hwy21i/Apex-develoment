type ApexLogoProps = {
  size?: number;
  className?: string;
};

/** Intrinsic SVG dimensions prevent the brand mark from being cropped in flex layouts. */
export function ApexLogo({ size = 36, className = "" }: ApexLogoProps) {
  return (
    <img
      src="/apex-logo.svg"
      alt="Apex Build"
      width={size}
      height={size}
      className={`block shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
