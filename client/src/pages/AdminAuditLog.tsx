import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { AuditLog } from "@shared/schema";

export default function AdminAuditLog() {
  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit-logs"],
  });

  if (isLoading) return <div className="p-8">Loading audit logs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Audit Log</h2>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action Type</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.timestamp), "MMM d, HH:mm:ss")}
                </TableCell>
                <TableCell className="font-medium">{log.adminEmail}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {log.actionType.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {log.targetType} #{log.targetId}
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">{log.action}</span>
                    {log.previousValue && log.newValue && (
                      <span className="text-xs text-muted-foreground">
                        {log.previousValue} → {log.newValue}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {logs?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No audit logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
