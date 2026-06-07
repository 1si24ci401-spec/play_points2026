import { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@figma/astraui';
import { Plus, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { ProductRevealAnimation } from './ProductRevealAnimation';
import { formatCurrency } from '../../utils/currency';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category?: string;
  image?: string;
}

interface ProductCarouselProps {
  products: Product[];
  onAddToCart: (product: Product, event: React.MouseEvent) => void;
}

export function ProductCarousel({ products, onAddToCart }: ProductCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 },
    }
  });
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative">
      {/* Desktop Navigation Buttons */}
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-0 right-0 justify-between pointer-events-none z-10 px-2">
        <button
          onClick={scrollPrev}
          disabled={!prevBtnEnabled}
          className="pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all disabled:opacity-30 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-card-foreground)',
          }}
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={scrollNext}
          disabled={!nextBtnEnabled}
          className="pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all disabled:opacity-30 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-card-foreground)',
          }}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 touch-pan-y py-4">
          {products.map((product, index) => {
            const isActiveOnMobile = selectedIndex === index;

            return (
              <div
                key={product.id}
                className={`flex-none w-[85%] sm:w-[45%] md:w-[calc(33.333%-0.67rem)] lg:w-[calc(33.333%-0.67rem)] transition-all duration-500 ease-out origin-center ${
                  isActiveOnMobile 
                    ? 'scale-100 opacity-100 shadow-[0_4px_20px_rgba(0,0,0,0.15)] md:shadow-none' 
                    : 'scale-[0.96] opacity-80'
                }`}
              >
                <ProductRevealAnimation delay={index * 0.05}>
                  <div
                    className="rounded-[var(--radius-lg)] border overflow-hidden h-full flex flex-col transition-colors duration-300"
                    style={{
                      backgroundColor: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                        style={{ borderBottom: '1px solid var(--color-border)' }}
                      />
                    ) : (
                      <div
                        className="w-full h-48 flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                        }}
                      >
                        <Sparkles className="w-16 h-16" style={{ color: 'var(--color-primary-foreground)' }} />
                      </div>
                    )}

                    <div className="p-4 flex flex-col gap-3 flex-1">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-lg font-medium line-clamp-1" style={{ color: 'var(--color-card-foreground)' }}>
                          {product.name}
                        </h3>
                        {product.category && (
                          <span
                            className="text-xs px-2 py-1 rounded-[var(--radius-sm)] inline-flex w-fit"
                            style={{
                              backgroundColor: 'var(--color-muted)',
                              color: 'var(--color-muted-foreground)',
                            }}
                          >
                            {product.category}
                          </span>
                        )}
                      </div>

                      <p className="text-sm line-clamp-2 flex-1" style={{ color: 'var(--color-muted-foreground)' }}>
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between gap-3 mt-auto pt-2">
                        <span className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                          {formatCurrency(product.price)}
                        </span>
                        <Button
                          variant="primary"
                          size="small"
                          iconStart={<Plus size={16} />}
                          onClick={(e) => onAddToCart(product, e as any)}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </ProductRevealAnimation>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Dots Indicator */}
      <div className="flex md:hidden justify-center gap-2.5 mt-2">
        {products.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              selectedIndex === index ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
