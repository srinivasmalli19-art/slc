import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Phone, MapPin, Calendar, Activity, Shield,
  Loader2, UserCheck, UserX, Lock, Unlock, CheckCircle2, XCircle,
  ClipboardList, Building2, FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '' });
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const [userRes, activityRes] = await Promise.all([
        api.get(`/admin/users/${userId}`),
        api.get(`/admin/users/${userId}/activity`)
      ]);
      setUser(userRes.data);
      setActivity(activityRes.data.activity || []);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    setActionLoading(true);
    try {
      const { type } = actionDialog;
      
      if (type === 'activate' || type === 'deactivate') {
        await api.put(`/admin/users/${userId}/status`, null, {
          params: { is_active: type === 'activate', reason: actionReason }
        });
        toast.success(`User ${type === 'activate' ? 'activated' : 'deactivated'} successfully`);
      } else if (type === 'lock' || type === 'unlock') {
        await api.put(`/admin/users/${userId}/lock`, null, {
          params: { locked: type === 'lock', reason: actionReason }
        });
        toast.success(`User ${type === 'lock' ? 'locked' : 'unlocked'} successfully`);
      } else if (type === 'verify_registration') {
        await api.put(`/admin/vets/${userId}/verify-registration`, null, {
          params: { verified: true, remarks: actionReason }
        });
        toast.success('Registration verified successfully');
      } else if (type === 'enable_certificates' || type === 'disable_certificates') {
        await api.put(`/admin/vets/${userId}/certificate-privileges`, null, {
          params: { enabled: type === 'enable_certificates' }
        });
        toast.success(`Certificate privileges ${type === 'enable_certificates' ? 'enabled' : 'disabled'}`);
      }
      
      setActionDialog({ open: false, type: '' });
      setActionReason('');
      fetchUserData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const config = {
      farmer: { color: 'bg-green-100 text-green-800', icon: User },
      paravet: { color: 'bg-blue-100 text-blue-800', icon: Shield },
      veterinarian: { color: 'bg-purple-100 text-purple-800', icon: Activity },
      admin: { color: 'bg-red-100 text-red-800', icon: Shield },
    };
    const cfg = config[role] || { color: 'bg-slate-100 text-slate-800', icon: User };
    return (
      <Badge className={`${cfg.color} gap-1`}>
        <cfg.icon className="h-3 w-3" />
        {role}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-slate-500">User not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/users')}>
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">{user.name}</h1>
          <p className="text-slate-500 text-sm">User Details & Management</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                  <User className="h-8 w-8 text-slate-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(user.role)}
                    {user.is_locked ? (
                      <Badge variant="destructive" className="gap-1">
                        <Lock className="h-3 w-3" />Locked
                      </Badge>
                    ) : user.is_active ? (
                      <Badge className="bg-green-100 text-green-700 gap-1">
                        <CheckCircle2 className="h-3 w-3" />Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600">Inactive</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-500">Phone Number</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500">User ID</p>
                <p className="font-mono text-sm">{user.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500">Village</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <p>{user.village || '-'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500">District / State</p>
                <p>{user.district || '-'} {user.state && `/ ${user.state}`}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500">Joined</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <p>{formatDate(user.created_at)}</p>
                </div>
              </div>
              {user.stats && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Activity</p>
                  <p className="font-medium">
                    {user.stats.animals && `${user.stats.animals} animals`}
                    {user.stats.opd_cases && `${user.stats.opd_cases} OPD cases`}
                  </p>
                </div>
              )}
            </div>

            {/* Vet Profile */}
            {user.role === 'veterinarian' && user.vet_profile && (
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-slate-800 mb-3">Veterinarian Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Vet ID</p>
                    <p className="font-mono">{user.vet_profile.vet_id || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Registration Number</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.vet_profile.registration_number || '-'}</p>
                      {user.vet_profile.registration_verified ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 text-xs">Pending</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Qualification</p>
                    <p>{user.vet_profile.qualification || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Institution</p>
                    <p>{user.vet_profile.institution_name || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Certificate Privileges</p>
                    <Badge className={user.vet_profile.certificate_privileges ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>
                      {user.vet_profile.certificate_privileges ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Admin Actions</CardTitle>
            <CardDescription>Manage this user's access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Status Actions */}
            {user.is_active ? (
              <Button 
                variant="outline" 
                className="w-full justify-start text-amber-600 border-amber-300"
                onClick={() => setActionDialog({ open: true, type: 'deactivate' })}
              >
                <UserX className="h-4 w-4 mr-2" />
                Deactivate Account
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="w-full justify-start text-green-600 border-green-300"
                onClick={() => setActionDialog({ open: true, type: 'activate' })}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Activate Account
              </Button>
            )}

            {/* Lock Actions */}
            {user.is_locked ? (
              <Button 
                variant="outline" 
                className="w-full justify-start text-blue-600 border-blue-300"
                onClick={() => setActionDialog({ open: true, type: 'unlock' })}
              >
                <Unlock className="h-4 w-4 mr-2" />
                Unlock Account
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 border-red-300"
                onClick={() => setActionDialog({ open: true, type: 'lock' })}
              >
                <Lock className="h-4 w-4 mr-2" />
                Lock Account
              </Button>
            )}

            {/* Vet-specific Actions */}
            {user.role === 'veterinarian' && user.vet_profile && (
              <>
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs text-slate-500 mb-2">Veterinarian Actions</p>
                </div>
                
                {!user.vet_profile.registration_verified && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-purple-600 border-purple-300"
                    onClick={() => setActionDialog({ open: true, type: 'verify_registration' })}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Verify Registration
                  </Button>
                )}

                {user.vet_profile.certificate_privileges ? (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-amber-600 border-amber-300"
                    onClick={() => setActionDialog({ open: true, type: 'disable_certificates' })}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Disable Certificates
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-green-600 border-green-300"
                    onClick={() => setActionDialog({ open: true, type: 'enable_certificates' })}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Enable Certificates
                  </Button>
                )}
              </>
            )}

            <div className="border-t pt-3 mt-3">
              <p className="text-xs text-slate-500">
                All actions are logged for audit compliance
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No activity recorded</p>
          ) : (
            <div className="space-y-3">
              {activity.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{item.description}</p>
                    <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, type: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'activate' && 'Activate User'}
              {actionDialog.type === 'deactivate' && 'Deactivate User'}
              {actionDialog.type === 'lock' && 'Lock User Account'}
              {actionDialog.type === 'unlock' && 'Unlock User Account'}
              {actionDialog.type === 'verify_registration' && 'Verify Vet Registration'}
              {actionDialog.type === 'enable_certificates' && 'Enable Certificate Privileges'}
              {actionDialog.type === 'disable_certificates' && 'Disable Certificate Privileges'}
            </DialogTitle>
            <DialogDescription>
              This action will be logged for audit compliance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason / Remarks</Label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason for this action..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, type: '' })}>
              Cancel
            </Button>
            <Button onClick={handleAction} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDetail;
