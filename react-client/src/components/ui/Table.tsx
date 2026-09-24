import type { ReactNode } from "react";

export interface TableProps {
  columns?: string[];
  children?: ReactNode;
  emptyMessage?: string;
  caption?: string;
}

// Generic table shell. `columns` is an array of header labels; rows are passed
// as children so each screen keeps control of its own cell rendering.
// Shared by the Products, Orders, Inventory, RFQ and Documents screens.
export default function Table({ columns = [], children, emptyMessage, caption }: TableProps) {
  const hasRows = countsAsRows(children);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="px-4 py-2 font-body font-medium text-text-dim bg-paper text-[12px] uppercase tracking-wide whitespace-nowrap"
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
                className="px-4 py-6 font-body text-center text-text-dim text-[13px] border-t border-line"
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
function countsAsRows(children: ReactNode): boolean {
  if (Array.isArray(children)) return children.length > 0;
  return Boolean(children);
}

export interface CellClassNameOptions {
  emphasis?: boolean;
  dim?: boolean;
  extra?: string;
}

// Shared cell className so every screen's rows line up identically.
// Pass `{ emphasis: true }` for the ink-colored lead cell of a row, or
// `{ dim: true }` for de-emphasized secondary text (dates, warehouse, etc).
export function cellClassName({ emphasis = false, dim = false, extra = "" }: CellClassNameOptions = {}) {
  const color = emphasis ? "text-ink" : dim ? "text-text-dim" : "text-text";
  return `border-t border-line text-[13px] align-middle ${color} ${extra}`.trim();
}
