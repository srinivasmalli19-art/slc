import React, { useState, useEffect } from 'react';
import { 
  Plus, Loader2, Search, Filter, Eye, CheckCircle2, 
  Skull, Calendar, AlertTriangle, FileText, DollarSign
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

const speciesOptions = Object.entries(speciesDisplayNames);

const causeCategoryOptions = [
  { value: 'disease', label: 'Disease', color: 'bg-red-100 text-red-700' },
  { value: 'accident', label: 'Accident', color: 'bg-amber-100 text-amber-700' },
  { value: 'predator', label: 'Predator Attack', color: 'bg-orange-100 text-orange-700' },
  { value: 'natural', label: 'Natural/Old Age', color: 'bg-slate-100 text-slate-700' },
  { value: 'unknown', label: 'Unknown', color: 'bg-purple-100 text-purple-700' },
];

const disposalMethods = [
  { value: 'burial', label: 'Deep Burial' },
  { value: 'burning', label: 'Burning/Incineration' },
  { value: 'rendering', label: 'Rendering Plant' },
];

const commonDiseases = [
  'FMD', 'Anthrax', 'Brucellosis', 'HS', 'BQ', 'PPR', 'LSD',
  'Rabies', 'Theileriosis', 'Enterotoxemia', 'Bloat', 'Milk Fever',
  'Snake Bite', 'Poisoning', 'Respiratory Infection', 'GI Infection', 'Other'
];

const MortalityRegister = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewRecord, setViewRecord] = useState(null);
  
  const initialFormState = {
    death_date: new Date().toISOString().split('T')[0],
    tag_number: '',
    species: 'cattle',
    breed: '',
    age_months: '',
    sex: 'male',
    farmer_name: '',
    farmer_id: '',
    farmer_village: '',
    farmer_phone: '',
    cause_of_death: '',
    cause_category: 'disease',
    disease_suspected: '',
    symptoms_before_death: '',
    duration_of_illness: '',
    treatment_given: '',
    post_mortem_done: false,
    post_mortem_findings: '',
    samples_collected: false,
    lab_confirmation: '',
    disposal_method: 'burial',
    disposal_supervised: true,
    insurance_claimed: false,
    insurance_amount: '',
    notified_to_authorities: false,
    outbreak_linked: false,
    outbreak_id: '',
    remarks: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await api.get('/vet/mortality');
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch mortality records:', error);
      toast.error('Failed to load mortality records');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.death_date) errors.push('Death Date is required');
    if (!formData.tag_number.trim()) errors.push('Tag Number is required');
    if (!formData.farmer_name.trim()) errors.push('Farmer Name is required');
    if (!formData.farmer_village.trim()) errors.push('Village is required');
    if (!formData.cause_of_death.trim()) errors.push('Cause of Death is required');
    if (!formData.disposal_method) errors.push('Disposal Method is required');
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
        age_months: formData.age_months ? parseInt(formData.age_months) : null,
        insurance_amount: formData.insurance_amount ? parseFloat(formData.insurance_amount) : null,
      };

      await api.post('/vet/mortality', payload);
      toast.success('Mortality record created successfully!');
      
      setDialogOpen(false);
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create mortality record');
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

  const getCategoryBadge = (category) => {
    const option = causeCategoryOptions.find(o => o.value === category);
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : (
      <Badge variant="outline">{category}</Badge>
    );
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tag_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.cause_of_death?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = filterSpecies === 'all' || r.species === filterSpecies;
    const matchesCategory = filterCategory === 'all' || r.cause_category === filterCategory;
    return matchesSearch && matchesSpecies && matchesCategory;
  });

  const stats = {
    total: records.length,
    disease: records.filter(r => r.cause_category === 'disease').length,
    accident: records.filter(r => r.cause_category === 'accident').length,
    thisMonth: records.filter(r => {
      const date = new Date(r.death_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
    pmDone: records.filter(r => r.post_mortem_done).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Livestock Mortality Register
          </h1>
          <p className="text-slate-500 text-sm">Death records & cause analysis</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-slate-700 hover:bg-slate-800" data-testid="new-mortality-btn">
              <Plus className="h-4 w-4" />
              Record Death
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Skull className="h-5 w-5 text-slate-600" />
                Record Livestock Mortality
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Animal & Death Details */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Animal & Death Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Death Date *</Label>
                    <Input
                      type="date"
                      value={formData.death_date}
                      onChange={(e) => handleChange('death_date', e.target.value)}
                      data-testid="mortality-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tag Number *</Label>
                    <Input
                      value={formData.tag_number}
                      onChange={(e) => handleChange('tag_number', e.target.value)}
                      placeholder="Animal tag"
                      data-testid="mortality-tag"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Species *</Label>
                    <Select value={formData.species} onValueChange={(v) => handleChange('species', v)}>
                      <SelectTrigger data-testid="mortality-species">
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
                    <Label>Sex</Label>
                    <Select value={formData.sex} onValueChange={(v) => handleChange('sex', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Breed</Label>
                    <Input
                      value={formData.breed}
                      onChange={(e) => handleChange('breed', e.target.value)}
                      placeholder="Breed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Age (months)</Label>
                    <Input
                      type="number"
                      value={formData.age_months}
                      onChange={(e) => handleChange('age_months', e.target.value)}
                      placeholder="Age"
                    />
                  </div>
                </div>
              </div>

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
                      data-testid="mortality-farmer-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Village *</Label>
                    <Input
                      value={formData.farmer_village}
                      onChange={(e) => handleChange('farmer_village', e.target.value)}
                      placeholder="Village"
                      data-testid="mortality-village"
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

              {/* Cause of Death */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Cause of Death</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cause Category *</Label>
                    <Select value={formData.cause_category} onValueChange={(v) => handleChange('cause_category', v)}>
                      <SelectTrigger data-testid="mortality-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {causeCategoryOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cause of Death *</Label>
                    <Input
                      value={formData.cause_of_death}
                      onChange={(e) => handleChange('cause_of_death', e.target.value)}
                      placeholder="Specific cause"
                      data-testid="mortality-cause"
                    />
                  </div>
                </div>
                {formData.cause_category === 'disease' && (
                  <div className="mt-4 space-y-2">
                    <Label>Disease Suspected</Label>
                    <Select value={formData.disease_suspected} onValueChange={(v) => handleChange('disease_suspected', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select disease" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonDiseases.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Symptoms Before Death</Label>
                    <Textarea
                      value={formData.symptoms_before_death}
                      onChange={(e) => handleChange('symptoms_before_death', e.target.value)}
                      placeholder="Observed symptoms..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Treatment Given</Label>
                    <Textarea
                      value={formData.treatment_given}
                      onChange={(e) => handleChange('treatment_given', e.target.value)}
                      placeholder="Treatment history..."
                      rows={2}
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label>Duration of Illness</Label>
                  <Input
                    value={formData.duration_of_illness}
                    onChange={(e) => handleChange('duration_of_illness', e.target.value)}
                    placeholder="e.g., 3 days, Sudden death"
                  />
                </div>
              </div>

              {/* Post-Mortem & Lab */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Post-Mortem & Lab</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="post_mortem_done" 
                        checked={formData.post_mortem_done}
                        onCheckedChange={(checked) => handleChange('post_mortem_done', checked)}
                      />
                      <Label htmlFor="post_mortem_done" className="cursor-pointer">Post-Mortem Done</Label>
                    </div>
                    {formData.post_mortem_done && (
                      <div className="space-y-2 pl-6">
                        <Label>PM Findings</Label>
                        <Textarea
                          value={formData.post_mortem_findings}
                          onChange={(e) => handleChange('post_mortem_findings', e.target.value)}
                          placeholder="Post-mortem findings..."
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="samples_collected" 
                        checked={formData.samples_collected}
                        onCheckedChange={(checked) => handleChange('samples_collected', checked)}
                      />
                      <Label htmlFor="samples_collected" className="cursor-pointer">Samples Collected</Label>
                    </div>
                    {formData.samples_collected && (
                      <div className="space-y-2 pl-6">
                        <Label>Lab Confirmation</Label>
                        <Input
                          value={formData.lab_confirmation}
                          onChange={(e) => handleChange('lab_confirmation', e.target.value)}
                          placeholder="Lab results"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Disposal & Insurance */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Disposal & Insurance</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Disposal Method *</Label>
                    <Select value={formData.disposal_method} onValueChange={(v) => handleChange('disposal_method', v)}>
                      <SelectTrigger data-testid="mortality-disposal">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {disposalMethods.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox 
                      id="disposal_supervised" 
                      checked={formData.disposal_supervised}
                      onCheckedChange={(checked) => handleChange('disposal_supervised', checked)}
                    />
                    <Label htmlFor="disposal_supervised" className="cursor-pointer">Disposal Supervised</Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="insurance_claimed" 
                        checked={formData.insurance_claimed}
                        onCheckedChange={(checked) => handleChange('insurance_claimed', checked)}
                      />
                      <Label htmlFor="insurance_claimed" className="cursor-pointer flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> Insurance Claimed
                      </Label>
                    </div>
                    {formData.insurance_claimed && (
                      <div className="space-y-2 pl-6">
                        <Label>Claim Amount (₹)</Label>
                        <Input
                          type="number"
                          value={formData.insurance_amount}
                          onChange={(e) => handleChange('insurance_amount', e.target.value)}
                          placeholder="Amount"
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="outbreak_linked" 
                        checked={formData.outbreak_linked}
                        onCheckedChange={(checked) => handleChange('outbreak_linked', checked)}
                      />
                      <Label htmlFor="outbreak_linked" className="cursor-pointer text-red-600">
                        Linked to Outbreak
                      </Label>
                    </div>
                    {formData.outbreak_linked && (
                      <div className="space-y-2 pl-6">
                        <Label>Outbreak ID</Label>
                        <Input
                          value={formData.outbreak_id}
                          onChange={(e) => handleChange('outbreak_id', e.target.value)}
                          placeholder="e.g., OB-2025-0001"
                        />
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="notified_to_authorities" 
                        checked={formData.notified_to_authorities}
                        onCheckedChange={(checked) => handleChange('notified_to_authorities', checked)}
                      />
                      <Label htmlFor="notified_to_authorities" className="cursor-pointer">
                        Notified to Authorities
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full gap-2 bg-slate-700 hover:bg-slate-800" disabled={saving} data-testid="submit-mortality">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Record Mortality
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
              <div className="p-2 bg-slate-100 rounded-lg">
                <Skull className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Deaths</p>
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
                <p className="text-2xl font-bold text-red-600">{stats.disease}</p>
                <p className="text-xs text-slate-500">Disease Related</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.accident}</p>
                <p className="text-xs text-slate-500">Accidents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.thisMonth}</p>
                <p className="text-xs text-slate-500">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.pmDone}</p>
                <p className="text-xs text-slate-500">PM Done</p>
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
                placeholder="Search by case number, tag, farmer, or cause..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="mortality-search"
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
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {causeCategoryOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card className="p-12 text-center">
          <Skull className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No mortality records found</p>
          <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
            Record First Death
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((r) => (
            <Card key={r.id} className={`hover:shadow-md transition-shadow ${r.outbreak_linked ? 'border-red-300 bg-red-50/30' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Skull className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{r.case_number}</h3>
                        {getCategoryBadge(r.cause_category)}
                        {r.post_mortem_done && <Badge variant="outline" className="text-purple-600">PM Done</Badge>}
                        {r.outbreak_linked && <Badge className="bg-red-100 text-red-700">Outbreak Linked</Badge>}
                      </div>
                      <p className="text-sm text-slate-600">
                        {speciesDisplayNames[r.species] || r.species} • Tag: {r.tag_number} • {r.cause_of_death}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.farmer_name} • {r.farmer_village} • {formatDate(r.death_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {r.insurance_claimed && (
                      <Badge variant="outline" className="text-green-600">
                        <DollarSign className="h-3 w-3 mr-1" /> Insured
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setViewRecord(r)} data-testid={`view-mortality-${r.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Skull className="h-5 w-5 text-slate-600" />
              Mortality Details - {viewRecord?.case_number}
            </DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Tag Number</Label>
                  <p className="font-medium">{viewRecord.tag_number}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Species</Label>
                  <p className="font-medium">{speciesDisplayNames[viewRecord.species]}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Death Date</Label>
                  <p className="font-medium">{formatDate(viewRecord.death_date)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Cause of Death</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">Category</Label>
                    <div className="mt-1">{getCategoryBadge(viewRecord.cause_category)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Cause</Label>
                    <p className="font-medium">{viewRecord.cause_of_death}</p>
                  </div>
                </div>
                {viewRecord.symptoms_before_death && (
                  <div className="mt-3">
                    <Label className="text-xs text-slate-500">Symptoms</Label>
                    <p className="text-sm bg-slate-50 p-2 rounded mt-1">{viewRecord.symptoms_before_death}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Farmer Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">Name</Label>
                    <p className="font-medium">{viewRecord.farmer_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Village</Label>
                    <p className="font-medium">{viewRecord.farmer_village}</p>
                  </div>
                </div>
              </div>

              {(viewRecord.post_mortem_done || viewRecord.samples_collected) && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Investigation</h4>
                  <div className="flex gap-3">
                    {viewRecord.post_mortem_done && (
                      <Badge className="bg-purple-100 text-purple-700">Post-Mortem Done</Badge>
                    )}
                    {viewRecord.samples_collected && (
                      <Badge className="bg-cyan-100 text-cyan-700">Samples Collected</Badge>
                    )}
                  </div>
                  {viewRecord.post_mortem_findings && (
                    <p className="text-sm bg-slate-50 p-2 rounded mt-2">{viewRecord.post_mortem_findings}</p>
                  )}
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Disposal</h4>
                <p className="font-medium capitalize">{viewRecord.disposal_method?.replace('_', ' ')}</p>
                {viewRecord.disposal_supervised && <Badge variant="outline" className="mt-1">Supervised</Badge>}
              </div>

              <div className="text-xs text-slate-400 text-right border-t pt-4">
                Recorded by: {viewRecord.vet_name}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MortalityRegister;
