import colors from "@/theme/colors";
import Panel from "@/components/ui/Panel";
import Table, { cellStyle } from "@/components/ui/Table";
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
        <span
          className="font-body"
          style={{ color: colors.textDim, fontSize: "12px" }}
        >
          {documentsMeta.storageNote}
        </span>
      }
    >
      <Table columns={COLUMNS} emptyMessage="No documents match your search.">
        {documents.map((doc) => (
          <tr key={doc.id}>
            <td
              className="px-4 py-3 font-heading font-semibold"
              style={cellStyle({ color: colors.ink })}
            >
              {doc.name}
            </td>
            <td className="px-4 py-3" style={cellStyle()}>
              {doc.category}
            </td>
            <td className="px-4 py-3" style={cellStyle()}>
              {doc.reference}
            </td>
            <td
              className="px-4 py-3"
              style={cellStyle({ color: colors.textDim })}
            >
              {doc.updated}
            </td>
            <td
              className="px-4 py-3"
              style={cellStyle({ color: colors.textDim })}
            >
              {doc.expires}
            </td>
            <td className="px-4 py-3" style={cellStyle()}>
              <StatusPill status={doc.status} />
            </td>
            <td className="px-4 py-3" style={cellStyle()}>
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
