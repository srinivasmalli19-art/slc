import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Search, Filter, Loader2, Calendar, User,
  FileText, Shield, Lock, Bell, Settings, ChevronRight, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

const actionTypeLabels = {
  user_create: 'User Created',
  user_update: 'User Updated',
  user_activate: 'User Activated',
  user_deactivate: 'User Deactivated',
  user_lock: 'User Locked',
  user_unlock: 'User Unlocked',
  knowledge_create: 'Knowledge Created',
  knowledge_update: 'Knowledge Updated',
  knowledge_archive: 'Knowledge Archived',
  knowledge_publish: 'Knowledge Published',
  safety_rule_create: 'Safety Rule Created',
  safety_rule_update: 'Safety Rule Updated',
  record_lock: 'Record Locked',
  record_unlock: 'Record Unlocked',
  setting_update: 'Setting Updated',
  notification_send: 'Notification Sent',
};

const actionTypeColors = {
  user_create: 'bg-green-100 text-green-800',
  user_update: 'bg-blue-100 text-blue-800',
  user_activate: 'bg-green-100 text-green-800',
  user_deactivate: 'bg-amber-100 text-amber-800',
  user_lock: 'bg-red-100 text-red-800',
  user_unlock: 'bg-blue-100 text-blue-800',
  knowledge_create: 'bg-purple-100 text-purple-800',
  knowledge_update: 'bg-purple-100 text-purple-800',
  knowledge_archive: 'bg-slate-100 text-slate-800',
  knowledge_publish: 'bg-green-100 text-green-800',
  safety_rule_create: 'bg-red-100 text-red-800',
  safety_rule_update: 'bg-red-100 text-red-800',
  record_lock: 'bg-amber-100 text-amber-800',
  record_unlock: 'bg-blue-100 text-blue-800',
  setting_update: 'bg-slate-100 text-slate-800',
  notification_send: 'bg-blue-100 text-blue-800',
};

const getActionIcon = (type) => {
  if (type.startsWith('user_')) return User;
  if (type.startsWith('knowledge_')) return FileText;
  if (type.startsWith('safety_')) return Shield;
  if (type.startsWith('record_')) return Lock;
  if (type.startsWith('setting_')) return Settings;
  if (type.startsWith('notification_')) return Bell;
  return ClipboardList;
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');
  const [filterTarget, setFilterTarget] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterTarget, dateFrom, dateTo]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = '/admin/audit-logs';
      const params = [];
      if (filterAction !== 'all') params.push(`action_type=${filterAction}`);
      if (filterTarget !== 'all') params.push(`target_type=${filterTarget}`);
      if (dateFrom) params.push(`date_from=${dateFrom}`);
      if (dateTo) params.push(`date_to=${dateTo}`);
      if (params.length > 0) url += '?' + params.join('&');
      
      const response = await api.get(url);
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = () => {
    // Create CSV content
    const headers = ['Timestamp', 'Admin', 'Action', 'Target Type', 'Target ID', 'Reason'];
    const rows = logs.map(log => [
      log.timestamp,
      log.admin_name,
      actionTypeLabels[log.action_type] || log.action_type,
      log.target_type,
      log.target_id,
      log.reason || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Audit logs exported');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Audit Logs
          </h1>
          <p className="text-slate-500 text-sm">Immutable record of all administrative actions</p>
        </div>
        <Button onClick={exportLogs} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Warning Banner */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Immutable Audit Trail</p>
              <p className="text-sm text-amber-700">
                These logs cannot be deleted or modified. Required for legal compliance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Action Type</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {Object.entries(actionTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Target Type</label>
              <Select value={filterTarget} onValueChange={setFilterTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="All Targets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Targets</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="vet_profile">Vet Profile</SelectItem>
                  <SelectItem value="institution">Institution</SelectItem>
                  <SelectItem value="knowledge">Knowledge</SelectItem>
                  <SelectItem value="safety_rule">Safety Rule</SelectItem>
                  <SelectItem value="setting">Setting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const ActionIcon = getActionIcon(log.action_type);
                    return (
                      <TableRow key={log.id} className="hover:bg-slate-50">
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {formatDate(log.timestamp)}
                          </div>
                          <p className="text-xs text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                              <User className="h-4 w-4 text-slate-500" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{log.admin_name}</p>
                              <p className="text-xs text-slate-400">{log.admin_id?.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={actionTypeColors[log.action_type] || 'bg-slate-100'}>
                            <ActionIcon className="h-3 w-3 mr-1" />
                            {actionTypeLabels[log.action_type] || log.action_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm capitalize">{log.target_type}</p>
                          <p className="text-xs text-slate-400 font-mono">{log.target_id?.slice(0, 12)}...</p>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="text-sm text-slate-600 truncate">
                            {log.reason || '-'}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Count */}
      <p className="text-sm text-slate-500 text-center">
        Showing {logs.length} audit log entries
      </p>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Log ID</p>
                  <p className="font-mono text-sm">{selectedLog.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Timestamp</p>
                  <p className="text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Admin Name</p>
                  <p className="font-medium">{selectedLog.admin_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Admin ID</p>
                  <p className="font-mono text-sm">{selectedLog.admin_id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Action Type</p>
                  <Badge className={actionTypeColors[selectedLog.action_type] || 'bg-slate-100'}>
                    {actionTypeLabels[selectedLog.action_type] || selectedLog.action_type}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Target Type</p>
                  <p className="capitalize">{selectedLog.target_type}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-slate-500">Target ID</p>
                <p className="font-mono text-sm bg-slate-100 p-2 rounded">{selectedLog.target_id}</p>
              </div>

              {selectedLog.reason && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Reason</p>
                  <p className="text-sm bg-slate-100 p-2 rounded">{selectedLog.reason}</p>
                </div>
              )}

              {selectedLog.before_value && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Before Value</p>
                  <pre className="text-xs bg-red-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.before_value, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.after_value && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">After Value</p>
                  <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.after_value, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.ip_address && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">IP Address</p>
                  <p className="font-mono text-sm">{selectedLog.ip_address}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogs;
