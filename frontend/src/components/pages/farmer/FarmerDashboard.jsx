import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, PawPrint, Stethoscope, Heart, Milk, Calculator, 
  Leaf, Lightbulb, ShoppingCart, Ruler, Percent, FileText,
  Bell, Plus, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dashboardAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getFarmerStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { 
      icon: User, 
      label: 'My Profile', 
      path: '/farmer/profile',
      color: 'bg-blue-100 text-blue-600',
      description: 'View & edit your details'
    },
    { 
      icon: PawPrint, 
      label: 'My Animals', 
      path: '/farmer/animals',
      color: 'bg-green-100 text-green-600',
      count: stats?.total_animals,
      description: 'Manage your livestock'
    },
    { 
      icon: Stethoscope, 
      label: 'Animal Health', 
      path: '/farmer/vaccinations',
      color: 'bg-purple-100 text-purple-600',
      count: stats?.total_vaccinations,
      description: 'Vaccinations & Deworming'
    },
    { 
      icon: Heart, 
      label: 'Breeding', 
      path: '/farmer/breeding',
      color: 'bg-pink-100 text-pink-600',
      count: stats?.total_breeding,
      description: 'AI & Natural breeding'
    },
    { 
      icon: Milk, 
      label: 'Milk Records', 
      path: '/farmer/milk-records',
      color: 'bg-sky-100 text-sky-600',
      description: 'Track daily milk yield'
    },
    { 
      icon: Calculator, 
      label: 'Ration Calculator', 
      path: '/farmer/ration-calculator',
      color: 'bg-amber-100 text-amber-600',
      description: 'Feed planning'
    },
    { 
      icon: Leaf, 
      label: 'Ayurvedic Practices', 
      path: '/farmer/ayurvedic',
      color: 'bg-emerald-100 text-emerald-600',
      description: 'Traditional remedies'
    },
    { 
      icon: Lightbulb, 
      label: 'Animal Care Tips', 
      path: '/farmer/tips',
      color: 'bg-yellow-100 text-yellow-600',
      description: 'Helpful advice'
    },
    { 
      icon: ShoppingCart, 
      label: 'Near By Animal Sales', 
      path: '/farmer/animal-market',
      color: 'bg-orange-100 text-orange-600',
      description: 'Buy & sell animals'
    },
    { 
      icon: Ruler, 
      label: 'Area Measurement', 
      path: '/farmer/area-calculator',
      color: 'bg-indigo-100 text-indigo-600',
      description: 'Calculate land area'
    },
    { 
      icon: Percent, 
      label: 'Interest Calculator', 
      path: '/farmer/interest-calculator',
      color: 'bg-rose-100 text-rose-600',
      description: 'Loan calculations'
    },
    { 
      icon: FileText, 
      label: 'Reports', 
      path: '/farmer/reports/vaccination',
      color: 'bg-slate-100 text-slate-600',
      description: 'View all reports'
    },
    { 
      icon: Bell, 
      label: 'Alerts & Reminders', 
      path: '/farmer/alerts/vaccination',
      color: 'bg-red-100 text-red-600',
      description: 'Due dates & reminders'
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats?.total_animals || 0}</p>
            <p className="text-sm text-green-600">Total Animals</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{stats?.total_vaccinations || 0}</p>
            <p className="text-sm text-purple-600">Vaccinations</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-700">{stats?.total_deworming || 0}</p>
            <p className="text-sm text-orange-600">Deworming</p>
          </CardContent>
        </Card>
        <Card className="bg-pink-50 border-pink-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-pink-700">{stats?.total_breeding || 0}</p>
            <p className="text-sm text-pink-600">Breeding</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action */}
      <div className="flex justify-end">
        <Button 
          onClick={() => navigate('/farmer/animals/new')}
          className="gap-2"
          data-testid="add-animal-btn"
        >
          <Plus className="h-4 w-4" />
          Add New Animal
        </Button>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {menuItems.map((item, index) => (
          <Card
            key={item.path}
            className="slc-card-farmer cursor-pointer group hover:shadow-lg"
            onClick={() => navigate(item.path)}
            data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 ${item.color} group-hover:scale-110 transition-transform`}>
                <item.icon className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">{item.label}</h3>
              <p className="text-xs text-slate-500 mt-1">{item.description}</p>
              {item.count !== undefined && item.count > 0 && (
                <Badge className="mt-2 bg-primary/10 text-primary">
                  {item.count} records
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Banner */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <p className="text-sm text-green-800 text-center">
            <strong>Tip:</strong> Keep your animal records updated regularly for better health management.
            All information shown is for reference only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmerDashboard;
