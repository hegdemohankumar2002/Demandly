'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import styles from './Carousel.module.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CarouselItem {
  image: string;
  title: string;
  description: string;
  badge?: string;
  link: string;
}

interface CarouselProps {
  images?: string[];
  items?: CarouselItem[];
  autoplay?: boolean;
  autoplayInterval?: number;
  aspectRatio?: string;
  showArrows?: boolean;
  showDots?: boolean;
}

export default function Carousel({
  images = [],
  items,
  autoplay = true,
  autoplayInterval = 4000,
  aspectRatio = '16/9',
  showArrows = true,
  showDots = true,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const slideCount = items ? items.length : images.length;

  const nextSlide = useCallback(() => {
    if (isTransitioning || slideCount <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slideCount);
  }, [slideCount, isTransitioning]);

  const prevSlide = useCallback(() => {
    if (isTransitioning || slideCount <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slideCount) % slideCount);
  }, [slideCount, isTransitioning]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex || slideCount <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
  }, [currentIndex, isTransitioning, slideCount]);

  const resetAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
    }
    if (autoplay && slideCount > 1) {
      autoplayTimerRef.current = setInterval(nextSlide, autoplayInterval);
    }
  }, [autoplay, autoplayInterval, slideCount, nextSlide]);

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

  if (slideCount === 0) return null;

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
        {items && items.length > 0 ? (
          items.map((item, index) => (
            <div 
              key={index} 
              className={styles.carouselSlide}
              style={{ 
                backgroundImage: `url(${item.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <div className={styles.slideOverlay} />
              <div className={styles.slideContent}>
                {item.badge && <span className={styles.slideBadge}>{item.badge}</span>}
                <h3 className={styles.slideTitle}>{item.title}</h3>
                <p className={styles.slideDesc}>{item.description}</p>
                <Link href={item.link}>
                  <button className={styles.shopNowBtn}>Shop Now</button>
                </Link>
              </div>
            </div>
          ))
        ) : (
          images.map((image, index) => (
            <div key={index} className={styles.carouselSlide}>
              <Link href="/consumer/products" className={styles.slideLink}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt={`Slide ${index + 1}`} className={styles.carouselImage} />
                <button className={styles.shopNowBtn}>Shop Now</button>
              </Link>
            </div>
          ))
        )}
      </div>

      {showArrows && slideCount > 1 && (
        <>
          <button className={`${styles.navButton} ${styles.left}`} onClick={prevSlide} aria-label="Previous slide">
            <ChevronLeft size={20} />
          </button>
          <button className={`${styles.navButton} ${styles.right}`} onClick={nextSlide} aria-label="Next slide">
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {showDots && slideCount > 1 && (
        <div className={styles.dotsContainer}>
          {Array.from({ length: slideCount }).map((_, index) => (
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
