import colors from "@/theme/colors";

// Generic table shell. `columns` is an array of header labels; rows are passed
// as children so each screen keeps control of its own cell rendering.
// Shared by the Products, Orders, Inventory, RFQ and Documents screens.
export default function Table({ columns = [], children, emptyMessage }) {
  const hasRows = Boolean(children) && countsAsRows(children);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="px-4 py-2 font-body font-medium"
                style={{
                  color: colors.textDim,
                  backgroundColor: colors.paper,
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasRows ? (
            children
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 font-body text-center"
                style={{
                  color: colors.textDim,
                  fontSize: "13px",
                  borderTop: `1px solid ${colors.line}`,
                }}
              >
                {emptyMessage ?? "Nothing to show yet."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// An empty array of rows still counts as "no rows".
function countsAsRows(children) {
  if (Array.isArray(children)) return children.length > 0;
  return true;
}

// Shared cell style so every screen's rows line up identically.
export function cellStyle(overrides = {}) {
  return {
    borderTop: `1px solid ${colors.line}`,
    fontSize: "13px",
    color: colors.text,
    verticalAlign: "middle",
    ...overrides,
  };
}
