"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

function getFirstImageSrc(product: Product): string | null {
  const first = product.images?.[0];
  if (!first) return null;
  if (typeof first === "string" && first.trim()) return first;
  if (typeof first === "object" && first?.src) return first.src;
  return null;
}

function isInStock(product: Product): boolean {
  if (product.in_stock === false) return false;
  if (product.stock_status === "outofstock") return false;
  if (product.in_stock === true) return true;
  if (product.stock_status === "instock") return true;
  return true;
}

function getDisplayName(product: Product): string {
  const t = product.title?.trim();
  if (t) return t;
  return product.name;
}

function getProductKey(product: Product, index: number): string {
  return String(
    product.docCanonicalId ??
      product.id ??
      product.sku ??
      product.permalink ??
      `${product.name}-${index}`,
  );
}

function hasMeaningfulPrice(product: Product): boolean {
  if (product.on_sale && product.sale_price?.toString().trim()) return true;
  return product.price != null && String(product.price).trim() !== "";
}

/** Generic shop home when API only supplies a category URL */
function isGenericShopPermalink(url: string | undefined): boolean {
  if (!url?.trim()) return true;
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "");
    return path === "" || path === "/shop";
  } catch {
    return false;
  }
}

interface ProductsCarouselProps {
  products: Product[];
  title?: string;
  subtitle?: string;
}

export default function ProductsCarousel({
  products,
  title = "Recommended Products",
  subtitle = "Based on your preferences",
}: ProductsCarouselProps) {
  const PLANTZ_LOGO_FALLBACK =
    "https://plantz.io/wp-content/uploads/2024/01/U1_Ralewy_Black.png";
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  const updateScrollButtons = () => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    updateScrollButtons();
    container.addEventListener("scroll", updateScrollButtons);
    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(container);
    return () => {
      container.removeEventListener("scroll", updateScrollButtons);
      resizeObserver.disconnect();
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative w-full max-w-full overflow-hidden">
      {(title || subtitle) && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      )}

      <div className="relative w-full max-w-full">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll("left")}
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 shadow-md hover:bg-muted transition-all",
              "flex",
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div
          ref={containerRef}
          data-carousel-container
          className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth pb-3 snap-x snap-mandatory touch-pan-x w-full "
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style>{`
            [data-carousel-container]::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {products.map((product, index) => {
            const displayName = getDisplayName(product);
            const imageSrc = getFirstImageSrc(product);
            const productKey = getProductKey(product, index);
            const displayImageSrc = imageErrors[productKey]
              ? PLANTZ_LOGO_FALLBACK
              : (imageSrc ?? PLANTZ_LOGO_FALLBACK);
            const isPlantzLogoFallback = !imageSrc || imageErrors[productKey];
            const supplierOrBrand = product.supplier?.trim() || product.brand;
            const permalink = product.permalink?.trim();
            const genericLink = isGenericShopPermalink(permalink);
            const showPrice = hasMeaningfulPrice(product);

            return (
              <div
                key={productKey}
                className="shrink-0 snap-start w-[75vw] max-w-[280px] sm:w-72 sm:max-w-none md:w-64 bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div
                  className={cn(
                    "relative bg-muted aspect-square flex items-center justify-center overflow-hidden shrink-0",
                    isPlantzLogoFallback && "p-5 sm:p-6",
                  )}
                >
                  <img
                    src={displayImageSrc}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className={cn(
                      "transition-transform duration-500",
                      isPlantzLogoFallback
                        ? "h-full w-full object-contain object-center hover:scale-[1.02]"
                        : "h-full w-full object-contain object-center p-3 hover:scale-[1.02]",
                    )}
                    onError={(event) => {
                      if (event.currentTarget.src !== PLANTZ_LOGO_FALLBACK) {
                        setImageErrors((prev) => ({
                          ...prev,
                          [productKey]: true,
                        }));
                      }
                    }}
                  />

                  {supplierOrBrand && (
                    <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur max-w-[85%] line-clamp-2">
                      {supplierOrBrand}
                    </span>
                  )}
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1 min-h-0">
                  <div className="space-y-1.5 min-w-0">
                    {permalink && !genericLink ? (
                      <a
                        href={permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <h4 className="font-semibold text-sm text-foreground line-clamp-2 hover:text-primary transition-colors">
                          {displayName}
                        </h4>
                      </a>
                    ) : (
                      <h4 className="font-semibold text-sm text-foreground line-clamp-2">
                        {displayName}
                      </h4>
                    )}

                    {showPrice ? (
                      <div className="pt-1">
                        {product.on_sale && product.sale_price ? (
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-primary">
                              £{product.sale_price}
                            </span>
                            <span className="text-xs text-muted-foreground line-through">
                              £{product.regular_price}
                            </span>
                          </div>
                        ) : (
                          <span className="text-base font-bold text-foreground">
                            £{product.price}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic pt-1">
                        See supplier for pricing
                      </p>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-border pt-3 gap-2">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full shrink-0",
                        isInStock(product)
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                      )}
                    >
                      {isInStock(product) ? "In Stock" : "Out of Stock"}
                    </span>

                    {permalink ? (
                      <a
                        href={permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-primary hover:underline text-right truncate"
                        title={permalink}
                      >
                        {genericLink ? "Supplier shop →" : "View →"}
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll("right")}
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 shadow-md hover:bg-muted transition-all",
              "flex",
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
