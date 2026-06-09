import logo from "@/assets/termly-logo.png.asset.json";

// Termly wordmark. The logo art is dark navy, so on dark surfaces it sits on a
// soft light chip for contrast. Pass plain to drop the chip (light surfaces).
export function Logo({
  height = 40,
  plain = false,
  style,
}: {
  height?: number;
  plain?: boolean;
  style?: React.CSSProperties;
}) {
  const img = (
    <img
      src={logo.url}
      alt="Termly"
      style={{ height, width: "auto", display: "block", ...(plain ? style : {}) }}
    />
  );
  if (plain) return img;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        borderRadius: height * 0.32,
        padding: `${Math.round(height * 0.28)}px ${Math.round(height * 0.45)}px`,
        boxShadow: "0 8px 28px rgba(0,0,0,.28)",
        ...style,
      }}
    >
      {img}
    </div>
  );
}
