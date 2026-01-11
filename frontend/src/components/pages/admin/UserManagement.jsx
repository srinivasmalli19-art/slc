import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Users, Search, Filter, Loader2, UserCheck, UserX, Lock, Unlock,
  Eye, MoreVertical, ChevronRight, Shield, Building2, Phone, MapPin
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

const UserManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState(searchParams.get('role') || 'all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Dialog states
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', user: null });
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filterRole, filterStatus]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = '/admin/users';
      const params = [];
      if (filterRole !== 'all') params.push(`role=${filterRole}`);
      if (filterStatus !== 'all') params.push(`status=${filterStatus}`);
      if (params.length > 0) url += '?' + params.join('&');
      
      const response = await api.get(url);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    setActionLoading(true);
    try {
      const { type, user } = actionDialog;
      
      if (type === 'activate' || type === 'deactivate') {
        await api.put(`/admin/users/${user.id}/status`, null, {
          params: { is_active: type === 'activate', reason: actionReason }
        });
        toast.success(`User ${type === 'activate' ? 'activated' : 'deactivated'} successfully`);
      } else if (type === 'lock' || type === 'unlock') {
        await api.put(`/admin/users/${user.id}/lock`, null, {
          params: { locked: type === 'lock', reason: actionReason }
        });
        toast.success(`User ${type === 'lock' ? 'locked' : 'unlocked'} successfully`);
      }
      
      setActionDialog({ open: false, type: '', user: null });
      setActionReason('');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      farmer: 'bg-green-100 text-green-800',
      paravet: 'bg-blue-100 text-blue-800',
      veterinarian: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
    };
    return <Badge className={colors[role] || 'bg-slate-100'}>{role}</Badge>;
  };

  const getStatusBadge = (user) => {
    if (user.is_locked) {
      return <Badge variant="destructive" className="gap-1"><Lock className="h-3 w-3" />Locked</Badge>;
    }
    if (!user.is_active) {
      return <Badge variant="outline" className="text-amber-600 border-amber-300">Inactive</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700">Active</Badge>;
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm) ||
      u.village?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active && !u.is_locked).length,
    inactive: users.filter(u => !u.is_active).length,
    locked: users.filter(u => u.is_locked).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            User Management
          </h1>
          <p className="text-slate-500 text-sm">Manage all system users and permissions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            <p className="text-sm text-slate-500">Total Users</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.active}</p>
            <p className="text-sm text-green-600">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.inactive}</p>
            <p className="text-sm text-amber-600">Inactive</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.locked}</p>
            <p className="text-sm text-red-600">Locked</p>
          </CardContent>
        </Card>
      </div>

      {/* Role Tabs */}
      <Tabs value={filterRole} onValueChange={(val) => { setFilterRole(val); setSearchParams(val !== 'all' ? { role: val } : {}); }}>
        <TabsList className="grid grid-cols-5 w-full max-w-xl">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="farmer">Farmers</TabsTrigger>
          <TabsTrigger value="paravet">Paravets</TabsTrigger>
          <TabsTrigger value="veterinarian">Vets</TabsTrigger>
          <TabsTrigger value="admin">Admins</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, phone, or village..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <Users className="h-5 w-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{user.name}</p>
                            <p className="text-xs text-slate-500">ID: {user.id?.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {user.phone}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {user.village || user.district || '-'}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.is_active ? (
                              <DropdownMenuItem 
                                onClick={() => setActionDialog({ open: true, type: 'deactivate', user })}
                                className="text-amber-600"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => setActionDialog({ open: true, type: 'activate', user })}
                                className="text-green-600"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {user.is_locked ? (
                              <DropdownMenuItem 
                                onClick={() => setActionDialog({ open: true, type: 'unlock', user })}
                                className="text-blue-600"
                              >
                                <Unlock className="h-4 w-4 mr-2" />
                                Unlock Account
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => setActionDialog({ open: true, type: 'lock', user })}
                                className="text-red-600"
                              >
                                <Lock className="h-4 w-4 mr-2" />
                                Lock Account
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Count */}
      <p className="text-sm text-slate-500 text-center">
        Showing {filteredUsers.length} of {users.length} users
      </p>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, type: '', user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'activate' && 'Activate User'}
              {actionDialog.type === 'deactivate' && 'Deactivate User'}
              {actionDialog.type === 'lock' && 'Lock User Account'}
              {actionDialog.type === 'unlock' && 'Unlock User Account'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'activate' && `Are you sure you want to activate ${actionDialog.user?.name}?`}
              {actionDialog.type === 'deactivate' && `Are you sure you want to deactivate ${actionDialog.user?.name}? They will not be able to login.`}
              {actionDialog.type === 'lock' && `Are you sure you want to lock ${actionDialog.user?.name}'s account? This is for security purposes.`}
              {actionDialog.type === 'unlock' && `Are you sure you want to unlock ${actionDialog.user?.name}'s account?`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason (for audit log)</Label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason for this action..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, type: '', user: null })}>
              Cancel
            </Button>
            <Button 
              onClick={handleAction} 
              disabled={actionLoading}
              className={
                actionDialog.type === 'deactivate' || actionDialog.type === 'lock' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Info */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4">
          <p className="text-xs text-slate-600 text-center">
            <strong>Audit Notice:</strong> All user management actions are logged for compliance. 
            Admin cannot edit user health data - only account status.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
