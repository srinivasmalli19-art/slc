import React, { useState, useEffect } from 'react';
import { User, Save, Edit2, Loader2, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';

const qualifications = [
  'B.V.Sc. & A.H.',
  'M.V.Sc.',
  'Ph.D. (Veterinary)',
  'Diploma in Animal Husbandry',
  'Other'
];

const states = [
  'Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Kerala',
  'Maharashtra', 'Gujarat', 'Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh',
  'Bihar', 'West Bengal', 'Odisha', 'Punjab', 'Haryana', 'Other'
];

const VetProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  
  const [profile, setProfile] = useState({
    registration_number: '',
    qualification: '',
    mobile_number: user?.phone || '',
    institution_name: '',
    working_village: '',
    mandal: '',
    district: '',
    state: '',
    date_of_joining: '',
    remarks: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/vet/profile');
      if (response.data) {
        setProfile({
          registration_number: response.data.registration_number || '',
          qualification: response.data.qualification || '',
          mobile_number: response.data.mobile_number || user?.phone || '',
          institution_name: response.data.institution_name || '',
          working_village: response.data.working_village || '',
          mandal: response.data.mandal || '',
          district: response.data.district || '',
          state: response.data.state || '',
          date_of_joining: response.data.date_of_joining || '',
          remarks: response.data.remarks || '',
        });
        setProfileExists(true);
      } else {
        setIsEditing(true); // Start in edit mode for new profile
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.registration_number || !profile.qualification || !profile.mobile_number) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    setSaving(true);
    try {
      if (profileExists) {
        await api.put('/vet/profile', profile);
        toast.success('Profile updated successfully!');
      } else {
        await api.post('/vet/profile', profile);
        toast.success('Profile created successfully!');
        setProfileExists(true);
      }
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const isComplete = profile.registration_number && profile.qualification && profile.mobile_number;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Veterinarian Profile Register
          </h1>
          <p className="text-slate-500 text-sm">Mandatory setup for certificates</p>
        </div>
        <Button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={saving}
          className="gap-2"
          data-testid="edit-save-profile-btn"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isEditing ? (
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

      {/* Status Card */}
      <Card className={isComplete ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isComplete ? 'bg-green-100' : 'bg-amber-100'}`}>
              {isComplete ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${isComplete ? 'text-green-800' : 'text-amber-800'}`}>
                {isComplete ? 'Profile Complete' : 'Profile Incomplete'}
              </h3>
              <p className={`text-sm ${isComplete ? 'text-green-700' : 'text-amber-700'}`}>
                {isComplete 
                  ? 'You can now generate certificates and access all features.' 
                  : 'Complete your profile to enable certificate generation.'}
              </p>
            </div>
            {profileExists && profile.vet_id && (
              <Badge className="bg-blue-600">{profile.vet_id}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Card */}
      <Card className="border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Dr. {user?.name || 'Veterinarian'}</h2>
              <p className="text-sm text-slate-600">Registration: {profile.registration_number || 'Not set'}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  <Shield className="h-3 w-3 mr-1" />
                  Clinical Authority
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Details */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Details</CardTitle>
          <CardDescription>Your professional registration information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Registration Number *</Label>
              <Input 
                value={profile.registration_number}
                onChange={(e) => handleChange('registration_number', e.target.value)}
                disabled={!isEditing || (profileExists && profile.registration_number)}
                placeholder="e.g., VCI/2020/12345"
                className={profileExists && profile.registration_number ? "bg-slate-50" : ""}
                data-testid="registration-number-input"
              />
              {profileExists && profile.registration_number && (
                <p className="text-xs text-amber-600">Registration number cannot be changed once saved</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Qualification *</Label>
              {isEditing ? (
                <Select 
                  value={profile.qualification}
                  onValueChange={(val) => handleChange('qualification', val)}
                >
                  <SelectTrigger data-testid="qualification-select">
                    <SelectValue placeholder="Select qualification" />
                  </SelectTrigger>
                  <SelectContent>
                    {qualifications.map(q => (
                      <SelectItem key={q} value={q}>{q}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={profile.qualification} disabled />
              )}
            </div>
            <div className="space-y-2">
              <Label>Mobile Number *</Label>
              <Input 
                value={profile.mobile_number}
                onChange={(e) => handleChange('mobile_number', e.target.value)}
                disabled={!isEditing}
                placeholder="10 digit mobile"
                data-testid="mobile-number-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Joining</Label>
              <Input 
                type="date"
                value={profile.date_of_joining}
                onChange={(e) => handleChange('date_of_joining', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Institution & Location */}
      <Card>
        <CardHeader>
          <CardTitle>Institution & Location</CardTitle>
          <CardDescription>Your workplace details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Institution Name</Label>
              <Input 
                value={profile.institution_name}
                onChange={(e) => handleChange('institution_name', e.target.value)}
                disabled={!isEditing}
                placeholder="e.g., District Veterinary Hospital"
              />
            </div>
            <div className="space-y-2">
              <Label>Working Village</Label>
              <Input 
                value={profile.working_village}
                onChange={(e) => handleChange('working_village', e.target.value)}
                disabled={!isEditing}
                placeholder="Village name"
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
              <Label>District</Label>
              <Input 
                value={profile.district}
                onChange={(e) => handleChange('district', e.target.value)}
                disabled={!isEditing}
                placeholder="District name"
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
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

      {/* Remarks */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Remarks</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={profile.remarks}
            onChange={(e) => handleChange('remarks', e.target.value)}
            disabled={!isEditing}
            placeholder="Any additional notes or remarks"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Save Button for Mobile */}
      {isEditing && (
        <Button onClick={handleSave} className="w-full gap-2" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Profile
        </Button>
      )}

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800">Important</h4>
              <ul className="text-sm text-blue-700 mt-1 list-disc list-inside space-y-1">
                <li>Registration number is mandatory and cannot be changed once saved</li>
                <li>Profile must be complete to generate certificates</li>
                <li>All data is subject to audit</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VetProfile;
