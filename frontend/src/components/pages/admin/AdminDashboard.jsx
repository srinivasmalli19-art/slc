import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Building2, Activity, Shield, AlertTriangle, Bell,
  ChevronRight, Loader2, CheckCircle2, Clock, FileText,
  BookOpen, Settings, ClipboardList, Lock, Database
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/alerts')
      ]);
      setStats(statsRes.data);
      setAlerts(alertsRes.data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const summaryCards = [
    {
      title: 'Total Farmers',
      value: stats?.users?.total_farmers || 0,
      icon: Users,
      color: 'text-green-600 bg-green-100',
      path: '/admin/users/farmers'
    },
    {
      title: 'Total Paravets',
      value: stats?.users?.total_paravets || 0,
      icon: Users,
      color: 'text-blue-600 bg-blue-100',
      path: '/admin/users/paravets'
    },
    {
      title: 'Total Veterinarians',
      value: stats?.users?.total_vets || 0,
      icon: Users,
      color: 'text-purple-600 bg-purple-100',
      path: '/admin/users/vets'
    },
    {
      title: 'Total Animals',
      value: stats?.animals?.total || 0,
      icon: Activity,
      color: 'text-amber-600 bg-amber-100',
      path: '/admin/reports/user-activity'
    },
    {
      title: 'Active Institutions',
      value: stats?.institutions?.active || 0,
      icon: Building2,
      color: 'text-teal-600 bg-teal-100',
      path: '/admin/institutions'
    },
  ];

  const quickActions = [
    { label: 'User Management', icon: Users, path: '/admin/users', color: 'bg-blue-600' },
    { label: 'Knowledge Center', icon: BookOpen, path: '/admin/knowledge', color: 'bg-green-600' },
    { label: 'Safety Rules', icon: Shield, path: '/admin/safety/zoonotic', color: 'bg-red-600' },
    { label: 'Audit Logs', icon: ClipboardList, path: '/admin/audit-logs', color: 'bg-purple-600' },
    { label: 'System Settings', icon: Settings, path: '/admin/settings/general', color: 'bg-slate-600' },
    { label: 'Reports', icon: FileText, path: '/admin/reports/user-activity', color: 'bg-amber-600' },
  ];

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-300 text-red-800';
      case 'warning': return 'bg-amber-100 border-amber-300 text-amber-800';
      case 'info': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-slate-100 border-slate-300 text-slate-800';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'zoonotic': return AlertTriangle;
      case 'user_approval': return Users;
      case 'institution_verification': return Building2;
      case 'knowledge_review': return BookOpen;
      default: return Bell;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Admin Dashboard
          </h1>
          <p className="text-slate-500">System Overview & Governance Control</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-red-100 text-red-700 gap-1">
            <Shield className="h-3 w-3" />
            System Administrator
          </Badge>
        </div>
      </div>

      {/* Warning Banner */}
      <Card className="border-slate-300 bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
              <Lock className="h-5 w-5 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-700">
                <strong>Governance Mode:</strong> Admin cannot perform clinical work. 
                All actions are logged for audit compliance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards.map((card, index) => (
          <Card 
            key={index} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(card.path)}
            data-testid={`admin-summary-card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                <p className="text-xs text-slate-500">{card.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Approvals & Status */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-amber-800">{stats?.users?.pending_approvals || 0}</p>
                <p className="text-sm text-amber-600">Pending User Approvals</p>
              </div>
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-3 w-full border-amber-300 text-amber-700"
              onClick={() => navigate('/admin/users')}
            >
              Review Users
            </Button>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-800">{stats?.institutions?.pending_verification || 0}</p>
                <p className="text-sm text-blue-600">Pending Institution Verifications</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-400" />
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-3 w-full border-blue-300 text-blue-700"
              onClick={() => navigate('/admin/institutions')}
            >
              Verify Institutions
            </Button>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-800">{stats?.knowledge_center?.pending_drafts || 0}</p>
                <p className="text-sm text-purple-600">Knowledge Entries Pending</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-400" />
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-3 w-full border-purple-300 text-purple-700"
              onClick={() => navigate('/admin/knowledge')}
            >
              Review Entries
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Administrative tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 hover:shadow-md transition-all"
                  onClick={() => navigate(action.path)}
                  data-testid={`admin-quick-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color} text-white`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-500" />
              Alerts & Status
              {alerts.length > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {alerts.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-72 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No pending alerts</p>
              </div>
            ) : (
              alerts.slice(0, 5).map((alert, index) => {
                const AlertIcon = getAlertIcon(alert.type);
                return (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${getAlertColor(alert.severity)} cursor-pointer hover:shadow-sm transition-shadow`}
                    onClick={() => {
                      if (alert.type === 'user_approval') navigate('/admin/users');
                      else if (alert.type === 'institution_verification') navigate('/admin/institutions');
                      else if (alert.type === 'zoonotic') navigate('/admin/safety/zoonotic');
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <AlertIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs mt-0.5 truncate">{alert.message}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-slate-800">{stats?.activity?.opd_cases_today || 0}</p>
              <p className="text-sm text-slate-500">OPD Cases Today</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-slate-800">{stats?.activity?.vaccinations_today || 0}</p>
              <p className="text-sm text-slate-500">Vaccinations Today</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-slate-800">{stats?.safety?.active_rules || 0}</p>
              <p className="text-sm text-slate-500">Active Safety Rules</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-800">{stats?.safety?.zoonotic_alerts || 0}</p>
              <p className="text-sm text-red-500">Zoonotic Alerts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zoonotic Alert Banner */}
      {stats?.safety?.zoonotic_alerts > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">Active Zoonotic Disease Alerts</h3>
                <p className="text-sm text-red-700 mt-1">
                  There are {stats.safety.zoonotic_alerts} active zoonotic disease cases requiring attention. 
                  Ensure safety protocols are being followed and government reporting is up to date.
                </p>
                <Button 
                  size="sm" 
                  className="mt-2 bg-red-600 hover:bg-red-700"
                  onClick={() => navigate('/admin/safety/zoonotic')}
                >
                  Review Safety Alerts
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Governance Disclaimer */}
      <div className="p-4 bg-slate-800 rounded-lg">
        <p className="text-xs text-slate-300 text-center">
          <strong>Admin Governance:</strong> Admin actions govern and control all Paravet, Veterinarian, 
          and Farmer system operations. All actions are logged for compliance.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
