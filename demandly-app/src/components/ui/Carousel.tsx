'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './Carousel.module.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
  images: string[];
  autoplay?: boolean;
  autoplayInterval?: number;
  aspectRatio?: string;
  showArrows?: boolean;
  showDots?: boolean;
}

export default function Carousel({
  images,
  autoplay = true,
  autoplayInterval = 4000,
  aspectRatio = '16/9',
  showArrows = true,
  showDots = true,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length, isTransitioning]);

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length, isTransitioning]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
  }, [currentIndex, isTransitioning]);

  const resetAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
    }
    if (autoplay && images.length > 1) {
      autoplayTimerRef.current = setInterval(nextSlide, autoplayInterval);
    }
  }, [autoplay, autoplayInterval, images.length, nextSlide]);

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [resetAutoplay]);

  const handleTransitionEnd = () => {
    setIsTransitioning(false);
  };

  if (!images || images.length === 0) return null;

  return (
    <div 
      className={styles.carouselContainer} 
      style={{ aspectRatio }}
      onMouseEnter={() => {
        if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
      }}
      onMouseLeave={resetAutoplay}
    >
      <div 
        className={styles.carouselSlider} 
        style={{ 
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {images.map((image, index) => (
          <div key={index} className={styles.carouselSlide}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={`Slide ${index + 1}`} className={styles.carouselImage} />
          </div>
        ))}
      </div>

      {showArrows && images.length > 1 && (
        <>
          <button className={`${styles.navButton} ${styles.left}`} onClick={prevSlide} aria-label="Previous slide">
            <ChevronLeft size={20} />
          </button>
          <button className={`${styles.navButton} ${styles.right}`} onClick={nextSlide} aria-label="Next slide">
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {showDots && images.length > 1 && (
        <div className={styles.dotsContainer}>
          {images.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
