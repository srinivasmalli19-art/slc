import React, { useState, useEffect } from 'react';
import { User, Save, Edit2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { dashboardAPI } from '@/lib/api';

const farmerTypes = [
  { value: 'dairy', label: 'Dairy Farmer' },
  { value: 'shepherd', label: 'Shepherd' },
  { value: 'mixed', label: 'Mixed Farming' },
];

const languages = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'telugu', label: 'Telugu' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'kannada', label: 'Kannada' },
  { value: 'marathi', label: 'Marathi' },
  { value: 'gujarati', label: 'Gujarati' },
  { value: 'punjabi', label: 'Punjabi' },
];

const states = [
  'Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Kerala',
  'Maharashtra', 'Gujarat', 'Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh',
  'Bihar', 'West Bengal', 'Odisha', 'Punjab', 'Haryana', 'Other'
];

const FarmerProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  
  // Generate Farmer ID if not exists
  const generateFarmerId = () => {
    const stored = localStorage.getItem('slc_farmer_id');
    if (stored) return stored;
    const newId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    localStorage.setItem('slc_farmer_id', newId);
    return newId;
  };

  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem('slc_farmer_profile');
    if (stored) return JSON.parse(stored);
    return {
      farmer_id: generateFarmerId(),
      name: user?.name || '',
      mobile: user?.phone || '',
      village: user?.village || '',
      mandal: '',
      district: user?.district || '',
      state: user?.state || '',
      aadhar: '',
      farmer_type: 'dairy',
      preferred_language: 'english',
      registration_date: new Date().toISOString().split('T')[0],
    };
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getFarmerStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const handleSave = () => {
    localStorage.setItem('slc_farmer_profile', JSON.stringify(profile));
    setIsEditing(false);
    toast.success('Profile saved successfully!');
  };

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            My Profile
          </h1>
          <p className="text-slate-500 text-sm">View and manage your details</p>
        </div>
        <Button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="gap-2"
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4" />
              Save Profile
            </>
          ) : (
            <>
              <Edit2 className="h-4 w-4" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{profile.name || 'Farmer'}</h2>
              <p className="text-sm text-slate-600">Farmer ID: {profile.farmer_id}</p>
              <Badge className="mt-1 bg-green-600">
                {farmerTypes.find(t => t.value === profile.farmer_type)?.label || 'Farmer'}
              </Badge>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-primary">{stats?.total_animals || 0}</p>
              <p className="text-sm text-slate-600">Total Animals</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your basic details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Farmer ID</Label>
              <Input value={profile.farmer_id} disabled className="bg-slate-50" />
            </div>
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input 
                value={profile.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <Label>Mobile Number *</Label>
              <Input 
                value={profile.mobile}
                onChange={(e) => handleChange('mobile', e.target.value)}
                disabled={!isEditing}
                placeholder="10 digit mobile"
              />
            </div>
            <div className="space-y-2">
              <Label>Aadhar Number (Optional)</Label>
              <Input 
                value={profile.aadhar}
                onChange={(e) => handleChange('aadhar', e.target.value)}
                disabled={!isEditing}
                placeholder="12 digit Aadhar"
                maxLength={12}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle>Address Details</CardTitle>
          <CardDescription>Your location information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Village *</Label>
              <Input 
                value={profile.village}
                onChange={(e) => handleChange('village', e.target.value)}
                disabled={!isEditing}
                placeholder="Your village name"
              />
            </div>
            <div className="space-y-2">
              <Label>Mandal / Taluk</Label>
              <Input 
                value={profile.mandal}
                onChange={(e) => handleChange('mandal', e.target.value)}
                disabled={!isEditing}
                placeholder="Mandal name"
              />
            </div>
            <div className="space-y-2">
              <Label>District *</Label>
              <Input 
                value={profile.district}
                onChange={(e) => handleChange('district', e.target.value)}
                disabled={!isEditing}
                placeholder="District name"
              />
            </div>
            <div className="space-y-2">
              <Label>State *</Label>
              {isEditing ? (
                <Select 
                  value={profile.state}
                  onValueChange={(val) => handleChange('state', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={profile.state} disabled />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Farming Details */}
      <Card>
        <CardHeader>
          <CardTitle>Farming Details</CardTitle>
          <CardDescription>Your farming preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Farmer Type *</Label>
              {isEditing ? (
                <Select 
                  value={profile.farmer_type}
                  onValueChange={(val) => handleChange('farmer_type', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {farmerTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={farmerTypes.find(t => t.value === profile.farmer_type)?.label} disabled />
              )}
            </div>
            <div className="space-y-2">
              <Label>Preferred Language</Label>
              {isEditing ? (
                <Select 
                  value={profile.preferred_language}
                  onValueChange={(val) => handleChange('preferred_language', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={languages.find(l => l.value === profile.preferred_language)?.label} disabled />
              )}
            </div>
            <div className="space-y-2">
              <Label>Total Animals</Label>
              <Input value={stats?.total_animals || 0} disabled className="bg-slate-50" />
            </div>
            <div className="space-y-2">
              <Label>Date of Registration</Label>
              <Input value={profile.registration_date} disabled className="bg-slate-50" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button for Mobile */}
      {isEditing && (
        <Button onClick={handleSave} className="w-full gap-2">
          <Save className="h-4 w-4" />
          Save Profile
        </Button>
      )}
    </div>
  );
};

export default FarmerProfile;
