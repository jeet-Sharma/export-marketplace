'use client';

import { useMemo } from 'react';
import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';
import DataState from '@/components/buyer/DataState';
import EmptyState from '@/components/buyer/EmptyState';
import PageHeader from '@/components/buyer/PageHeader';
import { pageHeaders } from '@/data/seedData';
import { wishlistCopy } from '@/data/wishlist';
import api from '@/lib/api';
import useCart from '@/lib/useCart';
import useResource from '@/lib/useResource';
import WishlistCard from './WishlistCard';

/**
 * Saved products, joined against the catalogue so prices stay current.
 * @returns {import('react').ReactElement}
 */
export default function WishlistScreen() {
  const { data, loading, error, reload } = useResource(api.getProducts);
  const { wishlist, currencyCode } = useCart();

  const savedProducts = useMemo(() => {
    const catalogue = data ?? [];

    return wishlist.flatMap((entry) => {
      const product = catalogue.find((candidate) => candidate.id === entry.productId);
      return product ? [{ product, savedOn: entry.savedOn }] : [];
    });
  }, [data, wishlist]);

  return (
    <>
      <PageHeader
        title={pageHeaders.wishlist.title}
        breadcrumb={pageHeaders.wishlist.breadcrumb}
        actions={
          <Button href="/products" variant="ghost" size="md">
            {wishlistCopy.browseLabel}
          </Button>
        }
      />

      <Panel
        title="Saved Products"
        description={`${savedProducts.length} saved`}
        padded={false}
        bodyClassName={savedProducts.length ? 'p-3' : undefined}
      >
        <DataState
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={savedProducts.length === 0}
          skeletonRows={3}
          empty={
            <EmptyState
              icon="wishlist"
              title={wishlistCopy.emptyTitle}
              description={wishlistCopy.emptyDescription}
              action={
                <Button href="/products" variant="accent" size="md">
                  {wishlistCopy.browseLabel}
                </Button>
              }
            />
          }
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {savedProducts.map(({ product, savedOn }) => (
              <WishlistCard
                key={product.id}
                product={product}
                savedOn={savedOn}
                currencyCode={currencyCode}
              />
            ))}
          </div>
        </DataState>
      </Panel>
    </>
  );
}
