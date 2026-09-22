'use client';

import { useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';
import DataState from '@/components/buyer/DataState';
import EmptyState from '@/components/buyer/EmptyState';
import PageHeader from '@/components/buyer/PageHeader';
import TableToolbar from '@/components/buyer/TableToolbar';
import { moqRanges } from '@/data/products';
import { actionLabels, pageHeaders } from '@/data/seedData';
import api from '@/lib/api';
import filterProducts, {
  productCategories,
  productDestinations,
} from '@/lib/filterProducts';
import useCart from '@/lib/useCart';
import useResource from '@/lib/useResource';
import ProductFilters from './ProductFilters';
import ProductsTable from './ProductsTable';

/**
 * Product catalogue with live search and filtering.
 * @returns {import('react').ReactElement}
 */
export default function ProductsScreen() {
  const { data, loading, error, reload } = useResource(api.getProducts);
  const { currencyCode } = useCart();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [moqRangeId, setMoqRangeId] = useState(moqRanges[0].id);
  const [country, setCountry] = useState('');

  const products = useMemo(() => data ?? [], [data]);
  const categories = useMemo(() => productCategories(products), [products]);
  const destinations = useMemo(() => productDestinations(products), [products]);

  const visibleProducts = useMemo(() => {
    const range = moqRanges.find((option) => option.id === moqRangeId) ?? moqRanges[0];
    return filterProducts(products, { query, category, moqMax: range.max, country });
  }, [products, query, category, moqRangeId, country]);

  return (
    <>
      <PageHeader
        title={pageHeaders.products.title}
        breadcrumb={pageHeaders.products.breadcrumb}
        actions={
          <Button href="/rfq" variant="accent" size="md">
            {actionLabels.newRfq}
          </Button>
        }
      />

      <Panel title="Product Catalog" padded={false}>
        <TableToolbar
          searchId="product-search"
          searchLabel="Search products"
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search products, suppliers, HS code..."
          summary={`${visibleProducts.length} of ${products.length} products`}
          filters={
            <ProductFilters
              categories={categories}
              destinations={destinations}
              category={category}
              onCategoryChange={setCategory}
              moqRangeId={moqRangeId}
              onMoqRangeChange={setMoqRangeId}
              country={country}
              onCountryChange={setCountry}
            />
          }
        />

        <DataState
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={visibleProducts.length === 0}
          skeletonRows={6}
          empty={
            <EmptyState
              icon="search"
              title="No products match your filters"
              description="Try a different category, destination or MOQ range."
            />
          }
        >
          <ProductsTable products={visibleProducts} currencyCode={currencyCode} />
        </DataState>
      </Panel>
    </>
  );
}
