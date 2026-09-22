import Panel from "@/components/ui/Panel";
import Table, { cellClassName } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/vendor/StatusPill";
import { documentsMeta } from "@/data/documents";

const COLUMNS = [
  "Document",
  "Category",
  "Reference",
  "Updated",
  "Expires",
  "Status",
  "Action",
];

export default function DocumentTable({ documents = [] }) {
  return (
    <Panel
      title={documentsMeta.panelTitle}
      action={
        <span className="font-body text-text-dim text-[12px]">
          {documentsMeta.storageNote}
        </span>
      }
    >
      <Table
        columns={COLUMNS}
        caption={documentsMeta.panelTitle}
        emptyMessage="No documents match your search."
      >
        {documents.map((doc) => (
          <tr key={doc.id}>
            <td
              className={`px-4 py-3 font-heading font-semibold ${cellClassName({ emphasis: true })}`}
            >
              {doc.name}
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>{doc.category}</td>
            <td className={`px-4 py-3 ${cellClassName()}`}>{doc.reference}</td>
            <td className={`px-4 py-3 ${cellClassName({ dim: true })}`}>
              {doc.updated}
            </td>
            <td className={`px-4 py-3 ${cellClassName({ dim: true })}`}>
              {doc.expires}
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>
              <StatusPill status={doc.status} />
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>
              {doc.status === "missing" ? (
                <Button variant="accent" size="sm">
                  Upload
                </Button>
              ) : (
                <Button variant="ghost" size="sm">
                  View
                </Button>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}
