import Table from '@/components/ui/Table';
import ProductRow, { productColumns } from './ProductRow';

/**
 * @param {object} props
 * @param {import('@/lib/filterProducts').CatalogProduct[]} props.products
 * @param {string} props.currencyCode
 * @returns {import('react').ReactElement}
 */
export default function ProductsTable({ products, currencyCode }) {
  return (
    <Table columns={productColumns} caption="Export-ready product catalogue">
      {products.map((product, index) => (
        <ProductRow
          key={product.id}
          product={product}
          currencyCode={currencyCode}
          last={index === products.length - 1}
        />
      ))}
    </Table>
  );
}
