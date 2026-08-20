"use client";

import { useEffect } from "react";
import { useLang } from "../providers";
import type { Product } from "../lib/types";
import { FaX } from "react-icons/fa6";

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductDetailsModal({
  product,
  onClose,
}: ProductDetailsModalProps) {
  const { t, lang } = useLang();

  useEffect(() => {
    if (!product) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, product]);

  if (!product) return null;

  // Prefer the visitor's language, fall back to English, then to the card description.
  const cardDesc = (lang === "nl" && product.descriptionNl) || product.description || "";
  const detailedDesc =
    product.detailedDescription?.[lang] || product.detailedDescription?.en || cardDesc;
  const ingredients =
    (lang === "nl" && product.ingredientsNl?.length ? product.ingredientsNl : product.ingredients) || [];
  const allergens =
    (lang === "nl" && product.allergensNl?.length ? product.allergensNl : product.allergens) || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-white sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 id="product-details-title" className="text-3xl font-black text-slate-900 dark:text-white">
              {product.name}
            </h2>
            <p className="mt-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              €{product.price.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-red-500 hover:text-white dark:bg-slate-800 dark:text-slate-300"
            aria-label="Close"
          >
            <FaX size={20} />
          </button>
        </div>

        {/* Detailed Description */}
        <div className="mb-6 prose prose-sm dark:prose-invert max-w-none">
          <div 
            dangerouslySetInnerHTML={{ __html: detailedDesc }}
            className="text-base leading-relaxed text-slate-700 dark:text-slate-300 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-4 [&_blockquote]:italic"
          />
        </div>

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <div className="mb-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
            <h3 className="mb-3 font-bold text-slate-900 dark:text-white">
              {t.order.ingredients}
            </h3>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ingredient, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Allergens */}
        {allergens.length > 0 && (
          <div className="mb-6 rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
            <h3 className="mb-2 font-bold text-amber-900 dark:text-amber-200">
              ⚠️ {t.order.allergens}
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {t.order.contains} {allergens.join(", ")}
            </p>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white transition hover:bg-emerald-700 active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-600"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
