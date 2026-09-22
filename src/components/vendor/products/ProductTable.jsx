import colors from "@/theme/colors";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import ProductRow from "@/components/vendor/products/ProductRow";
import { productsMeta } from "@/data/products";

const COLUMNS = [
  "Product",
  "Price",
  "MOQ",
  "HS Code",
  "Stage",
  "Status",
  "Action",
];

export default function ProductTable({ products = [] }) {
  return (
    <Panel
      title={productsMeta.panelTitle}
      action={
        <span
          className="font-body"
          style={{ color: colors.textDim, fontSize: "12px" }}
        >
          {productsMeta.workflowNote}
        </span>
      }
    >
      <Table columns={COLUMNS} emptyMessage="No products match your search.">
        {products.map((product) => (
          <ProductRow key={product.id} product={product} />
        ))}
      </Table>
    </Panel>
  );
}
