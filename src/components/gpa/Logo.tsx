import logoUrl from "@/assets/termly-logo.png";

// Termly wordmark. The art is a transparent cyan→purple gradient that reads on
// any theme, so it renders plainly — no background chip, no shadow.
const RATIO = 1341 / 305; // intrinsic aspect ratio of the trimmed art

export function Logo({
  height = 40,
  style,
}: {
  height?: number;
  /** kept for backwards-compat; the logo is always plain now */
  plain?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <img
      src={logoUrl}
      alt="Termly"
      width={Math.round(height * RATIO)}
      height={height}
      style={{ height, width: "auto", display: "block", ...style }}
    />
  );
}
