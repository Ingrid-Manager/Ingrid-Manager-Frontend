import http from '@/api/http';

export interface AuditLogChange {
  old: unknown;
  new: unknown;
}

export interface AuditLogEntry {
  id: number;
  userId: number | null;
  userLabel: string | null;
  action: string;
  service: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  changes: Record<string, AuditLogChange> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogListResponse {
  data: AuditLogEntry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuditLogFilter {
  page?: number;
  limit?: number;
  userId?: number;
  service?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  from?: string;
  to?: string;
}

export async function getAuditLog(
  filter: AuditLogFilter = {},
): Promise<AuditLogListResponse> {
  const response = await http.get<AuditLogListResponse>('/audit-log', {
    params: filter,
  });
  return response.data;
}

export async function getAuditLogForEntity(
  entityType: string,
  entityId: string,
): Promise<AuditLogEntry[]> {
  const response = await http.get<AuditLogEntry[]>(
    `/audit-log/${entityType}/${entityId}`,
  );
  return response.data;
}
