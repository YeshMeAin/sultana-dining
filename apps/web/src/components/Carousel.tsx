"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";

interface Slide {
  src?: string;
  alt: string;
  label?: string;
}

interface CarouselProps {
  slides: Slide[];
}

// Warm gradient placeholders — replaced with real images when uploaded
const PLACEHOLDER_GRADIENTS = [
  "from-terracotta/40 via-cream-dark to-olive/30",
  "from-olive/40 via-cream-dark to-warm-brown/30",
  "from-aubergine/30 via-cream-dark to-terracotta/20",
  "from-warm-brown/40 via-cream-dark to-olive/20",
];

export function Carousel({ slides }: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden rounded-2xl">
        <div className="flex">
          {slides.map((slide, i) => (
            <div
              key={i}
              className="relative flex-[0_0_100%] min-w-0 aspect-[16/9]"
            >
              {slide.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br ${
                    PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]
                  } flex items-center justify-center`}
                >
                  <span className="font-display text-2xl text-aubergine/50 italic">
                    {slide.label ?? slide.alt}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === selectedIndex
                ? "bg-terracotta w-5"
                : "bg-warm-brown/30 hover:bg-warm-brown/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
