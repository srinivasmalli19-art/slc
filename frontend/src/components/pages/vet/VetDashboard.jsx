import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Stethoscope, ClipboardList, BookOpen, 
  AlertTriangle, TrendingUp, FileText, Users, Syringe,
  Heart, Skull, BedDouble, Bell, ChevronRight, User,
  Building2, AlertCircle, CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';

const VetDashboard = () => {
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
        api.get('/dashboard/vet-stats-detailed'),
        api.get('/vet/alerts')
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
      title: 'OPD Cases Today',
      value: stats?.opd_today || 0,
      icon: ClipboardList,
      color: 'text-blue-600 bg-blue-100',
      path: '/vet/opd'
    },
    {
      title: 'IPD Admissions',
      value: stats?.ipd_active || 0,
      icon: BedDouble,
      color: 'text-purple-600 bg-purple-100',
      path: '/vet/ipd'
    },
    {
      title: 'Vaccinations Done',
      value: stats?.vaccinations_today || 0,
      icon: Syringe,
      color: 'text-green-600 bg-green-100',
      path: '/vet/vaccination-register'
    },
    {
      title: 'AI Cases',
      value: stats?.ai_today || 0,
      icon: Heart,
      color: 'text-pink-600 bg-pink-100',
      path: '/vet/ai-register'
    },
    {
      title: 'Mortality Cases',
      value: stats?.mortality_today || 0,
      icon: Skull,
      color: 'text-red-600 bg-red-100',
      path: '/vet/mortality'
    },
  ];

  const quickActions = [
    { label: 'New OPD Case', icon: ClipboardList, path: '/vet/opd', color: 'bg-blue-600' },
    { label: 'Diagnostics', icon: Stethoscope, path: '/vet/diagnostics', color: 'bg-green-600' },
    { label: 'Registers', icon: FileText, path: '/vet/opd', color: 'bg-purple-600' },
    { label: 'Certificates', icon: FileText, path: '/vet/cert-health', color: 'bg-amber-600' },
    { label: 'Knowledge Center', icon: BookOpen, path: '/vet/knowledge', color: 'bg-teal-600' },
    { label: 'Reports', icon: FileText, path: '/vet/reports/opd-ipd', color: 'bg-slate-600' },
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
      case 'followup': return Bell;
      case 'profile': return User;
      default: return AlertCircle;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Veterinarian Dashboard
          </h1>
          <p className="text-slate-500">Clinical Overview & Quick Actions</p>
        </div>
        <div className="flex items-center gap-2">
          {stats?.profile_complete ? (
            <Badge className="bg-green-100 text-green-700 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Profile Complete
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-700 gap-1 cursor-pointer" onClick={() => navigate('/vet/profile')}>
              <AlertCircle className="h-3 w-3" />
              Complete Profile
            </Badge>
          )}
          {stats?.vet_id && (
            <Badge variant="outline" className="hidden sm:flex">
              {stats.vet_id}
            </Badge>
          )}
        </div>
      </div>

      {/* Profile Incomplete Warning */}
      {!stats?.profile_complete && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800">Complete Your Profile</h3>
                  <p className="text-sm text-amber-700">
                    Registration number and profile details are required to generate certificates.
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => navigate('/vet/profile')}>
                Complete Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards.map((card, index) => (
          <Card 
            key={index} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(card.path)}
            data-testid={`summary-card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 hover:shadow-md transition-all"
                  onClick={() => navigate(action.path)}
                  data-testid={`quick-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
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
              <Bell className="h-5 w-5 text-amber-500" />
              Alerts & Notifications
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
              alerts.map((alert, index) => {
                const AlertIcon = getAlertIcon(alert.type);
                return (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${getAlertColor(alert.severity)} cursor-pointer hover:shadow-sm transition-shadow`}
                    onClick={() => alert.case_id && navigate(`/vet/opd`)}
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

      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-slate-800">{stats?.total_opd || 0}</p>
              <p className="text-sm text-slate-500">Total OPD Cases</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-slate-800">{stats?.total_ipd || 0}</p>
              <p className="text-sm text-slate-500">Total IPD Cases</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-slate-800">{stats?.total_animals || 0}</p>
              <p className="text-sm text-slate-500">Animals Registered</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-slate-800">{stats?.pending_followups || 0}</p>
              <p className="text-sm text-slate-500">Pending Follow-ups</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zoonotic Safety Banner */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Zoonotic Safety Reminder</h3>
              <p className="text-sm text-red-700 mt-1">
                Always follow safety protocols when handling suspected cases of <strong>Brucellosis, Anthrax, 
                Leptospirosis, Tuberculosis, Avian Influenza, Rabies, or FMD</strong>. 
                Use appropriate PPE and report to authorities immediately.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="p-4 bg-slate-100 rounded-lg">
        <p className="text-xs text-slate-600 text-center">
          <strong>Clinical Reference Only:</strong> This system provides decision support. 
          Final diagnosis and treatment decisions must be made by a registered veterinarian.
        </p>
      </div>
    </div>
  );
};

export default VetDashboard;
