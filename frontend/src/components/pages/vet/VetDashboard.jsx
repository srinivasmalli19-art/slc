import React, { useState, useEffect } from 'react';
import { 
  Activity, Stethoscope, ClipboardList, BookOpen, 
  AlertTriangle, TrendingUp, FileText, Users
} from 'lucide-react';
import { dashboardAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const VetDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getVetStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Diagnostics Today',
      value: stats?.diagnostics_today || 0,
      icon: Activity,
      color: 'text-blue-600 bg-blue-100',
      change: '+12%'
    },
    {
      title: 'Total Diagnostics',
      value: stats?.total_diagnostics || 0,
      icon: Stethoscope,
      color: 'text-green-600 bg-green-100',
    },
    {
      title: 'Animals Registered',
      value: stats?.total_animals || 0,
      icon: ClipboardList,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      title: 'Knowledge Entries',
      value: stats?.knowledge_entries || 0,
      icon: BookOpen,
      color: 'text-amber-600 bg-amber-100',
    },
  ];

  const quickActions = [
    { label: 'New Diagnostic', icon: Stethoscope, path: '/vet/diagnostics/new', color: 'bg-primary' },
    { label: 'View Registers', icon: ClipboardList, path: '/vet/registers', color: 'bg-slate-600' },
    { label: 'Knowledge Center', icon: BookOpen, path: '/vet/knowledge', color: 'bg-amber-600' },
    { label: 'Generate Report', icon: FileText, path: '/vet/reports', color: 'bg-blue-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Veterinarian Dashboard
          </h1>
          <p className="text-slate-500">Clinical Overview & Quick Actions</p>
        </div>
        <Badge variant="outline" className="hidden sm:flex gap-1 items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          System Active
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                {stat.change && (
                  <Badge variant="outline" className="text-green-600 text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.change}
                  </Badge>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Safety Alert Banner */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Safety Reminder</h3>
              <p className="text-sm text-red-700 mt-1">
                Always follow safety protocols when handling suspected cases of Brucellosis, Anthrax, 
                Leptospirosis, Tuberculosis, Avian Influenza, Rabies, or FMD. 
                Use appropriate PPE and report to authorities.
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
