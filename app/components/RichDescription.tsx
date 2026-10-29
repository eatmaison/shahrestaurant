"use client";
import DOMPurify from "dompurify";
export default function RichDescription({ html }: { html: string }) {
  return <div className="product-description" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, { ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "blockquote", "h2", "h3", "a", "code", "pre"], ALLOWED_ATTR: ["href", "title"], ALLOW_DATA_ATTR: false }) }} />;
}
