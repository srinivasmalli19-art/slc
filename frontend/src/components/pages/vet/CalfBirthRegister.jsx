import React, { useState, useEffect } from 'react';
import { 
  Plus, Loader2, Search, Filter, Eye, CheckCircle2, 
  Baby, Calendar, AlertTriangle, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { formatDate, speciesDisplayNames } from '@/lib/utils';

const speciesOptions = Object.entries(speciesDisplayNames).filter(([key]) => 
  ['cattle', 'buffalo', 'goat', 'sheep'].includes(key)
);

const birthTypeOptions = [
  { value: 'normal', label: 'Normal Delivery', color: 'bg-green-100 text-green-700' },
  { value: 'assisted', label: 'Assisted Delivery', color: 'bg-amber-100 text-amber-700' },
  { value: 'caesarean', label: 'Caesarean Section', color: 'bg-red-100 text-red-700' },
];

const conditionOptions = [
  { value: 'healthy', label: 'Healthy', color: 'bg-green-100 text-green-700' },
  { value: 'weak', label: 'Weak', color: 'bg-amber-100 text-amber-700' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
  { value: 'good', label: 'Good', color: 'bg-green-100 text-green-700' },
];

const CalfBirthRegister = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterSex, setFilterSex] = useState('all');
  const [viewRecord, setViewRecord] = useState(null);
  
  const initialFormState = {
    farmer_name: '',
    farmer_id: '',
    farmer_village: '',
    farmer_phone: '',
    dam_tag_number: '',
    dam_species: 'cattle',
    dam_breed: '',
    sire_tag_number: '',
    sire_breed: '',
    ai_done_date: '',
    ai_case_number: '',
    expected_birth_date: '',
    actual_birth_date: new Date().toISOString().split('T')[0],
    birth_type: 'normal',
    calf_sex: 'male',
    calf_weight_kg: '',
    calf_tag_number: '',
    calf_color: '',
    twins: false,
    stillborn: false,
    dam_condition: 'good',
    calf_condition: 'healthy',
    first_colostrum_time: '',
    remarks: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await api.get('/vet/calf-birth');
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch calf birth records:', error);
      toast.error('Failed to load calf birth records');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.farmer_name.trim()) errors.push('Farmer Name is required');
    if (!formData.farmer_village.trim()) errors.push('Village is required');
    if (!formData.dam_tag_number.trim()) errors.push('Dam Tag Number is required');
    if (!formData.actual_birth_date) errors.push('Actual Birth Date is required');
    if (!formData.calf_sex) errors.push('Calf Sex is required');
    if (formData.farmer_phone && !/^\d{10}$/.test(formData.farmer_phone)) {
      errors.push('Phone must be 10 digits');
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        calf_weight_kg: formData.calf_weight_kg ? parseFloat(formData.calf_weight_kg) : null,
      };

      await api.post('/vet/calf-birth', payload);
      toast.success('Calf birth registered successfully!');
      
      setDialogOpen(false);
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to register calf birth');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getBirthTypeBadge = (type) => {
    const option = birthTypeOptions.find(o => o.value === type);
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : (
      <Badge variant="outline">{type}</Badge>
    );
  };

  const getConditionBadge = (condition) => {
    const option = conditionOptions.find(o => o.value === condition);
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : (
      <Badge variant="outline">{condition}</Badge>
    );
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.dam_tag_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.calf_tag_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = filterSpecies === 'all' || r.dam_species === filterSpecies;
    const matchesSex = filterSex === 'all' || r.calf_sex === filterSex;
    return matchesSearch && matchesSpecies && matchesSex;
  });

  // Stats calculations
  const stats = {
    total: records.length,
    male: records.filter(r => r.calf_sex === 'male').length,
    female: records.filter(r => r.calf_sex === 'female').length,
    stillborn: records.filter(r => r.stillborn).length,
    twins: records.filter(r => r.twins).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Calf Birth Register
          </h1>
          <p className="text-slate-500 text-sm">Record and track calf births</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700" data-testid="new-calf-birth-btn">
              <Plus className="h-4 w-4" />
              New Calf Birth
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5 text-cyan-600" />
                Register Calf Birth
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Farmer Details */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Farmer Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Farmer Name *</Label>
                    <Input
                      value={formData.farmer_name}
                      onChange={(e) => handleChange('farmer_name', e.target.value)}
                      placeholder="Full name"
                      data-testid="calf-farmer-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Village *</Label>
                    <Input
                      value={formData.farmer_village}
                      onChange={(e) => handleChange('farmer_village', e.target.value)}
                      placeholder="Village"
                      data-testid="calf-village"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formData.farmer_phone}
                      onChange={(e) => handleChange('farmer_phone', e.target.value)}
                      placeholder="10-digit phone"
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Farmer ID</Label>
                    <Input
                      value={formData.farmer_id}
                      onChange={(e) => handleChange('farmer_id', e.target.value)}
                      placeholder="ID (optional)"
                    />
                  </div>
                </div>
              </div>

              {/* Dam Details */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Dam (Mother) Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Dam Tag Number *</Label>
                    <Input
                      value={formData.dam_tag_number}
                      onChange={(e) => handleChange('dam_tag_number', e.target.value)}
                      placeholder="Mother's tag"
                      data-testid="calf-dam-tag"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Species *</Label>
                    <Select value={formData.dam_species} onValueChange={(v) => handleChange('dam_species', v)}>
                      <SelectTrigger data-testid="calf-species">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {speciesOptions.map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dam Breed</Label>
                    <Input
                      value={formData.dam_breed}
                      onChange={(e) => handleChange('dam_breed', e.target.value)}
                      placeholder="e.g., HF, Jersey"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dam Condition</Label>
                    <Select value={formData.dam_condition} onValueChange={(v) => handleChange('dam_condition', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Sire Details */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Sire (Father) Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Sire Tag Number</Label>
                    <Input
                      value={formData.sire_tag_number}
                      onChange={(e) => handleChange('sire_tag_number', e.target.value)}
                      placeholder="Father's tag"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sire Breed</Label>
                    <Input
                      value={formData.sire_breed}
                      onChange={(e) => handleChange('sire_breed', e.target.value)}
                      placeholder="Bull breed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>AI Case Number</Label>
                    <Input
                      value={formData.ai_case_number}
                      onChange={(e) => handleChange('ai_case_number', e.target.value)}
                      placeholder="e.g., AI-2025-00001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>AI Done Date</Label>
                    <Input
                      type="date"
                      value={formData.ai_done_date}
                      onChange={(e) => handleChange('ai_done_date', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Birth Details */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Birth Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Expected Birth Date</Label>
                    <Input
                      type="date"
                      value={formData.expected_birth_date}
                      onChange={(e) => handleChange('expected_birth_date', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Actual Birth Date *</Label>
                    <Input
                      type="date"
                      value={formData.actual_birth_date}
                      onChange={(e) => handleChange('actual_birth_date', e.target.value)}
                      data-testid="calf-birth-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Birth Type *</Label>
                    <Select value={formData.birth_type} onValueChange={(v) => handleChange('birth_type', v)}>
                      <SelectTrigger data-testid="calf-birth-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {birthTypeOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>First Colostrum Time</Label>
                    <Input
                      type="time"
                      value={formData.first_colostrum_time}
                      onChange={(e) => handleChange('first_colostrum_time', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-6 mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="twins" 
                      checked={formData.twins}
                      onCheckedChange={(checked) => handleChange('twins', checked)}
                    />
                    <Label htmlFor="twins" className="cursor-pointer">Twins</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="stillborn" 
                      checked={formData.stillborn}
                      onCheckedChange={(checked) => handleChange('stillborn', checked)}
                    />
                    <Label htmlFor="stillborn" className="cursor-pointer text-red-600">Stillborn</Label>
                  </div>
                </div>
              </div>

              {/* Calf Details */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Calf Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Calf Sex *</Label>
                    <Select value={formData.calf_sex} onValueChange={(v) => handleChange('calf_sex', v)}>
                      <SelectTrigger data-testid="calf-sex">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Calf Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.calf_weight_kg}
                      onChange={(e) => handleChange('calf_weight_kg', e.target.value)}
                      placeholder="Birth weight"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Calf Tag Number</Label>
                    <Input
                      value={formData.calf_tag_number}
                      onChange={(e) => handleChange('calf_tag_number', e.target.value)}
                      placeholder="New calf's tag"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Calf Color</Label>
                    <Input
                      value={formData.calf_color}
                      onChange={(e) => handleChange('calf_color', e.target.value)}
                      placeholder="e.g., Black & White"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="space-y-2">
                    <Label>Calf Condition</Label>
                    <Select value={formData.calf_condition} onValueChange={(v) => handleChange('calf_condition', v)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                  placeholder="Additional notes about the birth..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full gap-2 bg-cyan-600 hover:bg-cyan-700" disabled={saving} data-testid="submit-calf-birth">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Register Calf Birth
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Baby className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Births</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Baby className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.male}</p>
                <p className="text-xs text-slate-500">Male Calves</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Baby className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-pink-600">{stats.female}</p>
                <p className="text-xs text-slate-500">Female Calves</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Heart className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.twins}</p>
                <p className="text-xs text-slate-500">Twins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.stillborn}</p>
                <p className="text-xs text-slate-500">Stillborn</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by case number, tag, or farmer..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="calf-search"
              />
            </div>
            <Select value={filterSpecies} onValueChange={setFilterSpecies}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Species" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Species</SelectItem>
                {speciesOptions.map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSex} onValueChange={setFilterSex}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Calf Sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card className="p-12 text-center">
          <Baby className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No calf birth records found</p>
          <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
            Register First Birth
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((r) => (
            <Card key={r.id} className={`hover:shadow-md transition-shadow ${r.stillborn ? 'border-red-200 bg-red-50/30' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${r.calf_sex === 'male' ? 'bg-blue-100' : 'bg-pink-100'}`}>
                      <Baby className={`h-6 w-6 ${r.calf_sex === 'male' ? 'text-blue-600' : 'text-pink-600'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{r.case_number}</h3>
                        {getBirthTypeBadge(r.birth_type)}
                        {r.twins && <Badge className="bg-amber-100 text-amber-700">Twins</Badge>}
                        {r.stillborn && <Badge className="bg-red-100 text-red-700">Stillborn</Badge>}
                      </div>
                      <p className="text-sm text-slate-600">
                        {speciesDisplayNames[r.dam_species] || r.dam_species} • Dam: {r.dam_tag_number} • 
                        Calf: {r.calf_sex === 'male' ? '♂ Male' : '♀ Female'}
                        {r.calf_tag_number && ` (${r.calf_tag_number})`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.farmer_name} • {r.farmer_village} • {formatDate(r.actual_birth_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setViewRecord(r)} data-testid={`view-calf-${r.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Record Dialog */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5 text-cyan-600" />
              Calf Birth Details - {viewRecord?.case_number}
            </DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Birth Date</Label>
                  <p className="font-medium">{formatDate(viewRecord.actual_birth_date)}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Birth Type</Label>
                  <div className="mt-1">{getBirthTypeBadge(viewRecord.birth_type)}</div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Farmer</Label>
                  <p className="font-medium">{viewRecord.farmer_name}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Dam Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">Tag Number</Label>
                    <p className="font-medium">{viewRecord.dam_tag_number}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Species</Label>
                    <p className="font-medium">{speciesDisplayNames[viewRecord.dam_species]}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Breed</Label>
                    <p className="font-medium">{viewRecord.dam_breed || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Dam Condition</Label>
                    <div className="mt-1">{getConditionBadge(viewRecord.dam_condition)}</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Calf Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">Sex</Label>
                    <p className="font-medium capitalize">{viewRecord.calf_sex === 'male' ? '♂ Male' : '♀ Female'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Weight</Label>
                    <p className="font-medium">{viewRecord.calf_weight_kg ? `${viewRecord.calf_weight_kg} kg` : 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Tag Number</Label>
                    <p className="font-medium">{viewRecord.calf_tag_number || 'Not assigned'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Color</Label>
                    <p className="font-medium">{viewRecord.calf_color || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Condition</Label>
                    <div className="mt-1">{getConditionBadge(viewRecord.calf_condition)}</div>
                  </div>
                </div>
              </div>

              {viewRecord.ai_case_number && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">AI Reference</h4>
                  <p className="text-sm">Case: {viewRecord.ai_case_number}</p>
                  {viewRecord.ai_done_date && (
                    <p className="text-sm">AI Date: {formatDate(viewRecord.ai_done_date)}</p>
                  )}
                </div>
              )}

              {viewRecord.remarks && (
                <div className="border-t pt-4">
                  <Label className="text-xs text-slate-500">Remarks</Label>
                  <p className="text-sm bg-slate-50 p-2 rounded mt-1">{viewRecord.remarks}</p>
                </div>
              )}

              <div className="text-xs text-slate-400 text-right border-t pt-4">
                Registered by: {viewRecord.vet_name} • {formatDate(viewRecord.registered_at)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalfBirthRegister;
