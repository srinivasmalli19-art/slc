import React, { useState, useEffect } from 'react';
import { Building2, Plus, Loader2, MapPin, Phone, CheckCircle2, Edit2, Save } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';

const states = [
  'Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Kerala',
  'Maharashtra', 'Gujarat', 'Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh',
  'Bihar', 'West Bengal', 'Odisha', 'Punjab', 'Haryana', 'Other'
];

const InstitutionData = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newInstitution, setNewInstitution] = useState({
    institution_name: '',
    location: '',
    mandal: '',
    district: '',
    state: '',
    contact_number: '',
    jurisdiction_villages: '',
  });

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const response = await api.get('/vet/institutions');
      setInstitutions(response.data);
    } catch (error) {
      console.error('Failed to fetch institutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newInstitution.institution_name || !newInstitution.location || !newInstitution.district || !newInstitution.state) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...newInstitution,
        jurisdiction_villages: newInstitution.jurisdiction_villages
          ? newInstitution.jurisdiction_villages.split(',').map(v => v.trim())
          : []
      };
      await api.post('/vet/institution', payload);
      toast.success('Institution added successfully!');
      setDialogOpen(false);
      setNewInstitution({
        institution_name: '',
        location: '',
        mandal: '',
        district: '',
        state: '',
        contact_number: '',
        jurisdiction_villages: '',
      });
      fetchInstitutions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add institution');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setNewInstitution(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Institution Basic Data
          </h1>
          <p className="text-slate-500 text-sm">Manage institution information</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-institution-btn">
              <Plus className="h-4 w-4" />
              Add Institution
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Institution</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Institution Name *</Label>
                <Input
                  value={newInstitution.institution_name}
                  onChange={(e) => handleChange('institution_name', e.target.value)}
                  placeholder="e.g., District Veterinary Hospital"
                  data-testid="institution-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Location / Address *</Label>
                <Input
                  value={newInstitution.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Full address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mandal / Taluk</Label>
                  <Input
                    value={newInstitution.mandal}
                    onChange={(e) => handleChange('mandal', e.target.value)}
                    placeholder="Mandal name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>District *</Label>
                  <Input
                    value={newInstitution.district}
                    onChange={(e) => handleChange('district', e.target.value)}
                    placeholder="District name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Select 
                    value={newInstitution.state}
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
                </div>
                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input
                    value={newInstitution.contact_number}
                    onChange={(e) => handleChange('contact_number', e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Jurisdiction Villages</Label>
                <Textarea
                  value={newInstitution.jurisdiction_villages}
                  onChange={(e) => handleChange('jurisdiction_villages', e.target.value)}
                  placeholder="Enter villages separated by commas"
                  rows={3}
                />
                <p className="text-xs text-slate-500">Separate multiple villages with commas</p>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Add Institution
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Institutions List */}
      {institutions.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No institutions registered yet</p>
          <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
            Add your first institution
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {institutions.map((inst) => (
            <Card key={inst.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">{inst.institution_name}</h3>
                      <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <MapPin className="h-4 w-4" />
                        {inst.location}
                      </div>
                      <p className="text-sm text-slate-500">
                        {inst.mandal && `${inst.mandal}, `}{inst.district}, {inst.state}
                      </p>
                      {inst.contact_number && (
                        <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                          <Phone className="h-4 w-4" />
                          {inst.contact_number}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {inst.is_verified ? (
                      <Badge className="bg-green-100 text-green-700 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        Pending Verification
                      </Badge>
                    )}
                  </div>
                </div>
                
                {inst.jurisdiction_villages && inst.jurisdiction_villages.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-slate-700 mb-2">Jurisdiction Villages:</p>
                    <div className="flex flex-wrap gap-2">
                      {inst.jurisdiction_villages.map((village, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {village}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800">Note</h4>
              <p className="text-sm text-blue-700 mt-1">
                Institution data will be locked after admin verification. 
                Contact your administrator to make changes to verified institutions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstitutionData;
