import type { SVGAttributes } from "react";
import type { IconBaseProps, IconType } from "react-icons";

type GlyphAttributes = SVGAttributes<SVGElement>;
type SpriteProps = IconBaseProps & { attr?: GlyphAttributes };

/** Matches the installed IconBase props; glyph paths live in a same-origin SVG fragment. */
export function createSpriteIcon(href: string, glyphAttributes: GlyphAttributes): IconType {
  return function SpriteGlyph(props: SpriteProps) {
    const { size, title, attr, ...svgProps } = props;
    const attributes = Object.prototype.hasOwnProperty.call(props, "attr") ? attr : glyphAttributes;
    const computedSize = size || "1em";
    return <svg stroke="currentColor" fill="currentColor" strokeWidth="0"
      {...attributes} {...svgProps} className={svgProps.className || undefined}
      style={{ color: svgProps.color || undefined, ...svgProps.style }}
      height={computedSize} width={computedSize} xmlns="http://www.w3.org/2000/svg">
      {title && <title>{title}</title>}
      <use href={href} />
    </svg>;
  };
}
