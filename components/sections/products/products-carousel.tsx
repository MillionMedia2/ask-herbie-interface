"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: number | string;
  name: string;
  slug?: string;
  permalink?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  stock_quantity?: number | null;
  stock_status?: "instock" | "outofstock" | string;
  on_sale?: boolean;
  images?: Array<{ src: string }>;
  brand?: string;
  category?: string;
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
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
    const scrollAmount = container.clientWidth * 0.8; // scroll by 80% of visible width
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative w-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Carousel Wrapper */}
      <div className="relative">
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 shadow-md hover:bg-muted transition-all",
              "hidden sm:flex"
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Product Container */}
        <div
          ref={containerRef}
          data-carousel-container
          className="flex gap-4 overflow-x-auto scroll-smooth pb-3 snap-x snap-mandatory touch-pan-x"
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

          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 snap-start w-[85%] sm:w-72 md:w-64 bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image */}
              <div className="relative bg-muted aspect-square flex items-center justify-center overflow-hidden">
                {product.images?.[0]?.src ? (
                  <img
                    src={product.images[0].src}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                    <span className="text-muted-foreground text-sm">
                      No image
                    </span>
                  </div>
                )}

                {/* Brand badge */}
                {product.brand && (
                  <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-lg backdrop-blur">
                    {product.brand}
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4 flex flex-col justify-between h-44">
                <div>
                  <a
                    href={product.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <h4 className="font-semibold text-sm text-foreground line-clamp-2 hover:text-primary transition-colors">
                      {product.name}
                    </h4>
                  </a>

                  {/* Category */}
                  {product.category && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {product.category}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mt-2">
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
                </div>

                {/* Stock + CTA */}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full",
                      product.stock_status === "instock"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    )}
                  >
                    {product.stock_status === "instock"
                      ? "In Stock"
                      : "Out of Stock"}
                  </span>

                  <a
                    href={product.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll Right Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 shadow-md hover:bg-muted transition-all",
              "hidden sm:flex"
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
