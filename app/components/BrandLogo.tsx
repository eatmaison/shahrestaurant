import styles from "./BrandLogo.module.css";

const variants = {
  landscape: { width: 2451, height: 1000 },
  wordmark: { width: 1000, height: 357 },
  mark: { width: 847, height: 1000 },
} as const;

type Props = {
  variant?: keyof typeof variants;
  tone?: "teal" | "gold" | "adaptive";
  className?: string;
  alt?: string;
  eager?: boolean;
};

/** Original vector artwork; theme changes never redraw or distort the logo. */
export function BrandLogo({ variant = "landscape", tone = "adaptive", className = "", alt = "Shah Restaurant", eager = false }: Props) {
  const { width, height } = variants[variant];
  return (
    <span className={`${styles.logo} ${className}`} data-variant={variant} data-tone={tone} aria-hidden={alt === "" ? true : undefined} style={{ aspectRatio: `${width} / ${height}` }}>
      {/* Original SVGs need no raster optimizer or image runtime. */}
      {/* eslint-disable @next/next/no-img-element */}
      {(tone === "teal" || tone === "adaptive") && <img className={`${styles.art} ${styles.teal}`} src={`/brand/shah-${variant}-teal-v1.svg`} alt={alt} width={width} height={height} loading={eager ? "eager" : "lazy"} decoding="async" />}
      {(tone === "gold" || tone === "adaptive") && <img className={`${styles.art} ${styles.gold}`} src={`/brand/shah-${variant}-gold-v1.svg`} alt={alt} width={width} height={height} loading={eager ? "eager" : "lazy"} decoding="async" />}
      {/* eslint-enable @next/next/no-img-element */}
    </span>
  );
}
