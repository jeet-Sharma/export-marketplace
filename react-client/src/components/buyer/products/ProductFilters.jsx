import Select from '@/components/ui/Select';
import { moqRanges } from '@/data/products';

/**
 * Category, MOQ and destination selects for the catalogue toolbar.
 *
 * @param {object} props
 * @param {string[]} props.categories
 * @param {string[]} props.destinations
 * @param {string} props.category
 * @param {(value: string) => void} props.onCategoryChange
 * @param {string} props.moqRangeId
 * @param {(value: string) => void} props.onMoqRangeChange
 * @param {string} props.country
 * @param {(value: string) => void} props.onCountryChange
 * @returns {import('react').ReactElement}
 */
export default function ProductFilters({
  categories,
  destinations,
  category,
  onCategoryChange,
  moqRangeId,
  onMoqRangeChange,
  country,
  onCountryChange,
}) {
  return (
    <>
      <Select
        id="product-category"
        label="Category"
        labelHidden
        value={category}
        onChange={onCategoryChange}
        options={[
          { value: '', label: 'All Categories' },
          ...categories.map((item) => ({ value: item, label: item })),
        ]}
      />

      <Select
        id="product-moq"
        label="Minimum order quantity"
        labelHidden
        value={moqRangeId}
        onChange={onMoqRangeChange}
        options={moqRanges.map((range) => ({ value: range.id, label: range.label }))}
      />

      <Select
        id="product-country"
        label="Ships to"
        labelHidden
        value={country}
        onChange={onCountryChange}
        options={[
          { value: '', label: 'All Destinations' },
          ...destinations.map((item) => ({ value: item, label: item })),
        ]}
      />
    </>
  );
}
