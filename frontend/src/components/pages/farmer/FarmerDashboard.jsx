import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, PawPrint, Syringe, Bug, Heart, AlertCircle, 
  Lightbulb, Calculator, Leaf, ShoppingBag, Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../lib/api';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
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
      image: 'https://images.unsplash.com/photo-1543591777-da7228e6d10c?auto=format&fit=crop&w=200&q=80'
    },
    { 
      icon: PawPrint, 
      label: 'My Animals', 
      path: '/farmer/animals',
      color: 'bg-green-100 text-green-600',
      count: stats?.total_animals,
      image: 'https://images.unsplash.com/photo-1594466245134-136169b2d0a1?auto=format&fit=crop&w=200&q=80'
    },
    { 
      icon: Syringe, 
      label: 'Vaccinations', 
      path: '/farmer/vaccinations',
      color: 'bg-purple-100 text-purple-600',
      count: stats?.total_vaccinations,
      image: null
    },
    { 
      icon: Bug, 
      label: 'Deworming', 
      path: '/farmer/deworming',
      color: 'bg-orange-100 text-orange-600',
      count: stats?.total_deworming,
      image: null
    },
    { 
      icon: Heart, 
      label: 'Breeding', 
      path: '/farmer/breeding',
      color: 'bg-pink-100 text-pink-600',
      count: stats?.total_breeding,
      image: null
    },
    { 
      icon: AlertCircle, 
      label: 'Observed Problems', 
      path: '/farmer/problems',
      color: 'bg-red-100 text-red-600',
      image: null
    },
    { 
      icon: Lightbulb, 
      label: 'Tips', 
      path: '/farmer/tips',
      color: 'bg-yellow-100 text-yellow-600',
      image: null
    },
    { 
      icon: Calculator, 
      label: 'Ration Calculator', 
      path: '/farmer/ration',
      color: 'bg-amber-100 text-amber-600',
      image: null
    },
    { 
      icon: Leaf, 
      label: 'Ayurvedic Practice', 
      path: '/farmer/ayurvedic',
      color: 'bg-emerald-100 text-emerald-600',
      image: null
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Action */}
      <div className="flex justify-end">
        <Button 
          onClick={() => navigate('/farmer/animals/new')}
          className="gap-2"
          data-testid="add-animal-btn"
        >
          <Plus className="h-4 w-4" />
          Add Animal
        </Button>
      </div>

      {/* Menu Grid */}
      <div className="dashboard-grid">
        {menuItems.map((item, index) => (
          <Card
            key={item.path}
            className="slc-card-farmer cursor-pointer group"
            onClick={() => navigate(item.path)}
            data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              {item.image ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden mb-3 border-2 border-green-100 group-hover:border-green-300 transition-colors">
                  <img 
                    src={item.image} 
                    alt={item.label}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center mb-3 ${item.color} group-hover:scale-110 transition-transform`}>
                  <item.icon className="h-7 w-7" />
                </div>
              )}
              <h3 className="font-medium text-slate-800 text-sm">{item.label}</h3>
              {item.count !== undefined && (
                <span className="text-xs text-primary font-semibold mt-1">
                  {item.count} records
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Animal Market Button */}
      <Card 
        className="slc-card-farmer cursor-pointer"
        onClick={() => toast.info('Animal Market feature coming soon!')}
        data-testid="animal-market-card"
      >
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-green-100">
            <img 
              src="https://images.unsplash.com/photo-1594466245134-136169b2d0a1?auto=format&fit=crop&w=200&q=80" 
              alt="Animal Market"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Animal Market</h3>
            <p className="text-sm text-slate-500">Buy and sell livestock</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmerDashboard;
