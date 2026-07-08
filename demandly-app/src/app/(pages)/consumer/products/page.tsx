'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './products.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, getProductImage } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import {
  Search, SlidersHorizontal, Package, TrendingDown,
  Heart, ArrowUpDown, Grid3X3, List, ChevronLeft, ChevronRight
} from 'lucide-react';

const categories = ['All', 'Groceries', 'Personal Care', 'Home & Living', 'Lifestyle', 'Health'];

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  retailPrice: number;
  amazonPrice?: number;
  flipkartPrice?: number;
  demandCount: number;
  demandThreshold: number;
  unit: string;
  tags: string[];
}

function CategoryCarousel({ products }: { products: Product[] }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.carouselWrapper}>
      <button className={`${styles.scrollBtn} ${styles.scrollLeft}`} onClick={() => scroll('left')} aria-label="Scroll left">
        <ChevronLeft size={20} />
      </button>
      <div className={styles.carouselScrollContainer} ref={scrollRef}>
        {products.map((product) => {
          const demandPercent = Math.round((product.demandCount / product.demandThreshold) * 100);
          const imageUrl = getProductImage(product.image, product.name, product.id);
          return (
            <div key={product.id} className={styles.carouselCardWrapper}>
              <Link href={`/consumer/products/${product.id}`} className={styles.cardLink}>
                <Card variant="glass" padding="none" className={styles.productCard}>
                  <div className={styles.productImage}>
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className={styles.productImg}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const query = encodeURIComponent(product.name.split(' ').slice(0, 2).join(',') || 'product');
                        target.src = `https://loremflickr.com/600/600/${query}?lock=1`;
                      }}
                    />
                    <Badge variant="accent" size="sm" className={styles.catBadge}>
                      {product.category}
                    </Badge>
                    {demandPercent >= 80 && (
                      <Badge variant="danger" size="sm" className={styles.hotBadge} dot pulse>
                        Almost There!
                      </Badge>
                    )}
                  </div>
                  <div className={styles.productBody}>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <p className={styles.productDesc}>{product.description.substring(0, 80)}...</p>
                    <div className={styles.productPricing}>
                      <span className={styles.retailPrice}>{formatCurrency(product.retailPrice)}</span>
                      <Badge variant="secondary" size="sm">
                        <TrendingDown size={10} />
                        Save up to 35%
                      </Badge>
                    </div>

                    {/* Demand bar */}
                    <div className={styles.demandSection}>
                      <div className={styles.demandHeader}>
                        <span className={styles.demandLabel}>Demand Progress</span>
                        <span className={styles.demandCount}>
                          {product.demandCount}/{product.demandThreshold}
                        </span>
                      </div>
                      <div className={styles.demandTrack}>
                        <div
                          className={styles.demandFill}
                          style={{ width: `${Math.min(demandPercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className={styles.productTags}>
                      {product.tags && product.tags.map((tag: string) => (
                        <span key={tag} className={styles.tag}>#{tag}</span>
                      ))}
                    </div>

                    <Button fullWidth icon={<Heart size={16} />} size="sm">
                      I Want This
                    </Button>
                  </div>
                </Card>
              </Link>
            </div>
          );
        })}
      </div>
      <button className={`${styles.scrollBtn} ${styles.scrollRight}`} onClick={() => scroll('right')} aria-label="Scroll right">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

export default function ProductsPage() {
  const { token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name_asc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Group products by category
  const productsByCategory = React.useMemo(() => {
    return products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [products]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchQuery);
      setPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        if (!cancelled) setLoading(true);
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);
        if (category && category !== 'All') queryParams.append('category', category);
        if (sortBy) queryParams.append('sortBy', sortBy);
        if (minPrice) queryParams.append('minPrice', minPrice);
        if (maxPrice) queryParams.append('maxPrice', maxPrice);
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());

        const res = await fetch(`${API_URL}/consumer/products?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok && !cancelled) {
          const result = await res.json();
          if (result && result.data) {
            setProducts(result.data);
            setTotalPages(result.totalPages || 1);
            setTotalProducts(result.total || 0);
          } else {
            // Fallback for non-paginated arrays
            setProducts(Array.isArray(result) ? result : []);
            setTotalPages(1);
            setTotalProducts(Array.isArray(result) ? result.length : 0);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProducts();
    return () => { cancelled = true; };
  }, [search, category, sortBy, minPrice, maxPrice, page, token]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Product Catalog</h1>
          <p className={styles.subtitle}>Browse products and register your demand</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className={styles.searchWrapper} style={{ flex: '1', minWidth: '280px' }}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              className="input"
              placeholder="Search products, categories, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '42px' }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowUpDown size={16} style={{ color: 'var(--text-tertiary)' }} />
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="input"
                style={{ width: '160px', padding: 'var(--space-2) var(--space-3)' }}
              >
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="demand_desc">Popularity</option>
              </select>
            </div>

            {/* Price Inputs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                placeholder="Min ₹"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                className="input"
                style={{ width: '80px', padding: 'var(--space-2) var(--space-3)' }}
              />
              <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>to</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                className="input"
                style={{ width: '80px', padding: 'var(--space-2) var(--space-3)' }}
              />
            </div>

            {/* View Mode */}
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewActive : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewActive : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className={styles.categoryTabs}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.categoryTab} ${category === cat ? styles.categoryActive : ''}`}
              onClick={() => { setCategory(cat); setPage(1); }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className={styles.resultCount}>
        {loading ? 'Searching catalog...' : `${totalProducts} products found`}
      </p>

      {/* Loading state / Product Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(3, 1fr)' : '1fr', gap: '1.5rem', animation: 'pulse 1.5s infinite' }}>
          {[1, 2, 3].map((n) => (
            <Card key={n} variant="glass" style={{ height: '320px', backgroundColor: 'var(--bg-elevated)', opacity: 0.5 }} />
          ))}
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className={styles.carouselsContainer}>
              {Object.entries(productsByCategory).map(([catName, catProducts]) => (
                <div key={catName} className={styles.categorySection} style={{ marginBottom: '3.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                      <span style={{ width: '4px', height: '18px', background: 'var(--primary)', borderRadius: '2px' }} />
                      {catName}
                    </h2>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{catProducts.length} items</span>
                  </div>
                  <CategoryCarousel products={catProducts} />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.listView}>
              {products.map((product) => {
                const demandPercent = Math.round((product.demandCount / product.demandThreshold) * 100);
                const imageUrl = getProductImage(product.image, product.name, product.id);
                return (
                  <Link href={`/consumer/products/${product.id}`} key={product.id} className={styles.cardLink}>
                    <Card variant="glass" padding="none" className={styles.productCard}>
                      <div className={styles.productImage}>
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className={styles.productImg}
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const query = encodeURIComponent(product.name.split(' ').slice(0, 2).join(',') || 'product');
                            target.src = `https://loremflickr.com/600/600/${query}?lock=1`;
                          }}
                        />
                        <Badge variant="accent" size="sm" className={styles.catBadge}>
                          {product.category}
                        </Badge>
                        {demandPercent >= 80 && (
                          <Badge variant="danger" size="sm" className={styles.hotBadge} dot pulse>
                            Almost There!
                          </Badge>
                        )}
                      </div>
                      <div className={styles.productBody}>
                        <h3 className={styles.productName}>{product.name}</h3>
                        <p className={styles.productDesc}>{product.description.substring(0, 80)}...</p>
                        <div className={styles.productPricing}>
                          <span className={styles.retailPrice}>{formatCurrency(product.retailPrice)}</span>
                          <Badge variant="secondary" size="sm">
                            <TrendingDown size={10} />
                            Save up to 35%
                          </Badge>
                        </div>

                        {/* Demand bar */}
                        <div className={styles.demandSection}>
                          <div className={styles.demandHeader}>
                            <span className={styles.demandLabel}>Demand Progress</span>
                            <span className={styles.demandCount}>
                              {product.demandCount}/{product.demandThreshold}
                            </span>
                          </div>
                          <div className={styles.demandTrack}>
                            <div
                              className={styles.demandFill}
                              style={{ width: `${Math.min(demandPercent, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className={styles.productTags}>
                          {product.tags && product.tags.map((tag: string) => (
                            <span key={tag} className={styles.tag}>#{tag}</span>
                          ))}
                        </div>

                        <Button fullWidth icon={<Heart size={16} />} size="sm">
                          I Want This
                        </Button>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {products.length === 0 && (
            <div className={styles.empty}>
              <Package size={48} />
              <h3>No products found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '2.5rem',
            }}>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </Button>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
