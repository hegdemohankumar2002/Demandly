'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './products.module.css';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import {
  Search, SlidersHorizontal, Package, TrendingDown,
  Heart, ArrowUpDown, Grid3X3, List,
} from 'lucide-react';

const categories = ['All', 'Groceries', 'Personal Care', 'Home & Living', 'Lifestyle', 'Health'];

export default function ProductsPage() {
  const { token } = useAuthStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/consumer/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setProducts(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [token]);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase())));
    const matchCategory = category === 'All' || p.category === category;
    return matchSearch && matchCategory;
  });

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading catalog...</div>;

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
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className="input"
            placeholder="Search products, categories, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '42px' }}
          />
        </div>
        <div className={styles.categoryTabs}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.categoryTab} ${category === cat ? styles.categoryActive : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
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

      {/* Results count */}
      <p className={styles.resultCount}>{filtered.length} products found</p>

      {/* Product Grid */}
      <div className={viewMode === 'grid' ? styles.grid : styles.listView}>
        {filtered.map((product) => {
          const demandPercent = Math.round((product.demandCount / product.demandThreshold) * 100);
          return (
            <Link href={`/consumer/products/${product.id}`} key={product.id} className={styles.cardLink}>
              <Card variant="glass" padding="none" className={styles.productCard}>
                <div className={styles.productImage}>
                  <div className={styles.imagePlaceholder}>
                    <Package size={36} />
                  </div>
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
                    {product.tags.map((tag) => (
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

      {filtered.length === 0 && (
        <div className={styles.empty}>
          <Package size={48} />
          <h3>No products found</h3>
          <p>Try adjusting your search or category filter</p>
        </div>
      )}
    </div>
  );
}
