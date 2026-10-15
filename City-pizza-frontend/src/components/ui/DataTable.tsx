import { type ReactNode } from "react";
import { Inbox, Loader2 } from "lucide-react";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  className?: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
}

/** Tabla genérica (equivale a components/ui/DataTable.tsx de CCA, con card-soft). */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  loadingText = "Cargando...",
  emptyText = "Sin resultados",
}: DataTableProps<T>) {
  return (
    <div className="card-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-10 w-10 animate-spin opacity-60" />
                    <p>{loadingText}</p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Inbox className="h-10 w-10 opacity-40" />
                    <p>{emptyText}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-border transition-colors last:border-0 hover:bg-muted/30"
                >
                  {columns.map((column) => (
                    <td key={column.key} className={`px-4 py-3.5 align-middle ${column.className ?? ""}`}>
                      {column.render
                        ? column.render(row)
                        : String((row as Record<string, unknown>)[column.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
