import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../data';

export const PRODUCT_CACHE_VERSION = 'v1.1.0';

export interface CacheMetadata {
  version: string;
  updatedAt: string;
  sizeKb: number;
  productCount: number;
  source: 'local' | 'cache';
}

/**
 * Calculates the size of a string in Kilobytes (KB)
 */
export function calculateSizeKb(data: any): number {
  try {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    return parseFloat((str.length / 1024).toFixed(2));
  } catch (e) {
    return 0;
  }
}

/**
 * Loads products from the cache with advanced versioning and reconciliation.
 * If the developer updates standard products in INITIAL_PRODUCTS, they will be updated,
 * while preserving any custom products added by the administrator.
 */
export function getProductsWithCache(): { products: Product[]; metadata: CacheMetadata } {
  const cachedProductsStr = localStorage.getItem('morbido_products');
  const cachedMetaStr = localStorage.getItem('morbido_cache_metadata');

  const nowString = new Date().toLocaleString('ar-EG');

  if (!cachedProductsStr) {
    // Initial load: populate cache
    const initialMeta: CacheMetadata = {
      version: PRODUCT_CACHE_VERSION,
      updatedAt: nowString,
      sizeKb: calculateSizeKb(INITIAL_PRODUCTS),
      productCount: INITIAL_PRODUCTS.length,
      source: 'local'
    };
    
    localStorage.setItem('morbido_products', JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem('morbido_cache_metadata', JSON.stringify(initialMeta));
    
    return { products: INITIAL_PRODUCTS, metadata: initialMeta };
  }

  let cachedProducts: Product[] = [];
  try {
    cachedProducts = JSON.parse(cachedProductsStr);
  } catch (e) {
    cachedProducts = INITIAL_PRODUCTS;
  }

  let cachedMeta: CacheMetadata | null = null;
  try {
    cachedMeta = cachedMetaStr ? JSON.parse(cachedMetaStr) : null;
  } catch (_) {}

  const isNewVersion = !cachedMeta || cachedMeta.version !== PRODUCT_CACHE_VERSION;

  if (isNewVersion) {
    // RECONCILIATION:
    // Keep custom products added by the admin (ids that are NOT in the default INITIAL_PRODUCTS)
    const initialIds = new Set(INITIAL_PRODUCTS.map(p => p.id));
    const customAdminProducts = cachedProducts.filter(p => !initialIds.has(p.id));

    // Combine updated INITIAL_PRODUCTS with custom admin products
    const reconciledProducts = [...INITIAL_PRODUCTS, ...customAdminProducts];

    const newMeta: CacheMetadata = {
      version: PRODUCT_CACHE_VERSION,
      updatedAt: nowString,
      sizeKb: calculateSizeKb(reconciledProducts),
      productCount: reconciledProducts.length,
      source: 'local' // Set as local on update/reconcile
    };

    localStorage.setItem('morbido_products', JSON.stringify(reconciledProducts));
    localStorage.setItem('morbido_cache_metadata', JSON.stringify(newMeta));

    console.log(`[Cache Engine] Reconciled products cache to version ${PRODUCT_CACHE_VERSION}. Custom products preserved: ${customAdminProducts.length}`);

    return { products: reconciledProducts, metadata: newMeta };
  }

  // Same version: return cache
  const activeMeta: CacheMetadata = {
    version: cachedMeta?.version || PRODUCT_CACHE_VERSION,
    updatedAt: cachedMeta?.updatedAt || nowString,
    sizeKb: calculateSizeKb(cachedProducts),
    productCount: cachedProducts.length,
    source: 'cache'
  };

  return { products: cachedProducts, metadata: activeMeta };
}

/**
 * Saves products to the cache and updates the metadata.
 */
export function saveProductsToCache(products: Product[]): CacheMetadata {
  const nowString = new Date().toLocaleString('ar-EG');
  const size = calculateSizeKb(products);
  
  const meta: CacheMetadata = {
    version: PRODUCT_CACHE_VERSION,
    updatedAt: nowString,
    sizeKb: size,
    productCount: products.length,
    source: 'cache'
  };

  localStorage.setItem('morbido_products', JSON.stringify(products));
  localStorage.setItem('morbido_cache_metadata', JSON.stringify(meta));

  return meta;
}

/**
 * Clears the products cache completely and resets to INITIAL_PRODUCTS,
 * but returns the reset array.
 */
export function forceResetCache(): { products: Product[]; metadata: CacheMetadata } {
  localStorage.removeItem('morbido_products');
  localStorage.removeItem('morbido_cache_metadata');
  return getProductsWithCache();
}
