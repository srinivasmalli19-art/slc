import React, { useState, useEffect } from 'react';
import { 
  Plus, Loader2, Search, Filter, Eye, CheckCircle2, 
  Bug, Calendar, FlaskConical, Pill
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

const dewormingDrugs = [
  { value: 'albendazole', label: 'Albendazole' },
  { value: 'ivermectin', label: 'Ivermectin' },
  { value: 'fenbendazole', label: 'Fenbendazole' },
  { value: 'levamisole', label: 'Levamisole' },
  { value: 'praziquantel', label: 'Praziquantel' },
  { value: 'oxfendazole', label: 'Oxfendazole' },
  { value: 'moxidectin', label: 'Moxidectin' },
  { value: 'closantel', label: 'Closantel' },
  { value: 'triclabendazole', label: 'Triclabendazole' },
  { value: 'combination', label: 'Combination Drug' },
  { value: 'other', label: 'Other' },
];

const routeOptions = [
  { value: 'oral', label: 'Oral' },
  { value: 'subcutaneous', label: 'Subcutaneous' },
  { value: 'intramuscular', label: 'Intramuscular' },
  { value: 'pour-on', label: 'Pour-On' },
  { value: 'intravenous', label: 'Intravenous' },
];

const resultOptions = [
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
  { value: 'partial', label: 'Partial', color: 'bg-amber-100 text-amber-700' },
  { value: 'adverse_reaction', label: 'Adverse Reaction', color: 'bg-red-100 text-red-700' },
  { value: 'refused', label: 'Refused by Animal', color: 'bg-slate-100 text-slate-700' },
];

const DewormingRegister = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterDrug, setFilterDrug] = useState('');
  const [viewRecord, setViewRecord] = useState(null);
  
  const initialFormState = {
    tag_number: '',
    farmer_name: '',
    farmer_id: '',
    farmer_village: '',
    farmer_phone: '',
    species: 'cattle',
    breed: '',
    age_months: '',
    body_weight_kg: '',
    drug_used: 'albendazole',
    drug_batch: '',
    dose_rate: '',
    dose_given: '',
    route: 'oral',
    deworming_date: new Date().toISOString().split('T')[0],
    next_due_date: '',
    result: 'completed',
    fecal_sample_taken: false,
    epg_before: '',
    epg_after: '',
    remarks: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await api.get('/vet/deworming');
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch deworming records:', error);
      toast.error('Failed to load deworming records');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.tag_number.trim()) errors.push('Tag Number is required');
    if (!formData.farmer_name.trim()) errors.push('Farmer Name is required');
    if (!formData.farmer_village.trim()) errors.push('Village is required');
    if (!formData.drug_used) errors.push('Drug Used is required');
    if (!formData.dose_rate.trim()) errors.push('Dose Rate is required');
    if (!formData.dose_given.trim()) errors.push('Dose Given is required');
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
        body_weight_kg: formData.body_weight_kg ? parseFloat(formData.body_weight_kg) : null,
        epg_before: formData.epg_before ? parseInt(formData.epg_before) : null,
        epg_after: formData.epg_after ? parseInt(formData.epg_after) : null,
      };

      await api.post('/vet/deworming', payload);
      toast.success('Deworming record created successfully!');
      
      setDialogOpen(false);
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create deworming record');
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

  // Auto-calculate next due date (3 months from deworming date)
  const calculateNextDue = (dewormingDate) => {
    if (!dewormingDate) return '';
    const date = new Date(dewormingDate);
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (date) => {
    handleChange('deworming_date', date);
    if (!formData.next_due_date) {
      handleChange('next_due_date', calculateNextDue(date));
    }
  };

  const getResultBadge = (result) => {
    const option = resultOptions.find(o => o.value === result);
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : (
      <Badge variant="outline">{result}</Badge>
    );
  };

  const getDrugLabel = (drug) => {
    const option = dewormingDrugs.find(d => d.value === drug);
    return option ? option.label : drug;
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tag_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = filterSpecies === 'all' || r.species === filterSpecies;
    const matchesDrug = !filterDrug || r.drug_used?.toLowerCase().includes(filterDrug.toLowerCase());
    return matchesSearch && matchesSpecies && matchesDrug;
  });

  // Stats calculations
  const stats = {
    total: records.length,
    completed: records.filter(r => r.result === 'completed').length,
    thisMonth: records.filter(r => {
      const date = new Date(r.deworming_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
    fecalTested: records.filter(r => r.fecal_sample_taken).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Deworming Register
          </h1>
          <p className="text-slate-500 text-sm">Anti-parasitic treatment records</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-amber-600 hover:bg-amber-700" data-testid="new-deworming-btn">
              <Plus className="h-4 w-4" />
              New Deworming
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-amber-600" />
                New Deworming Record
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Patient & Owner Info */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Patient & Owner Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Tag/ID Number *</Label>
                    <Input
                      value={formData.tag_number}
                      onChange={(e) => handleChange('tag_number', e.target.value)}
                      placeholder="e.g., TG-001"
                      data-testid="dew-tag-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Farmer Name *</Label>
                    <Input
                      value={formData.farmer_name}
                      onChange={(e) => handleChange('farmer_name', e.target.value)}
                      placeholder="Owner name"
                      data-testid="dew-farmer-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Village *</Label>
                    <Input
                      value={formData.farmer_village}
                      onChange={(e) => handleChange('farmer_village', e.target.value)}
                      placeholder="Village name"
                      data-testid="dew-village"
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
                </div>
              </div>

              {/* Animal Info */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Animal Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Species *</Label>
                    <Select value={formData.species} onValueChange={(v) => handleChange('species', v)}>
                      <SelectTrigger data-testid="dew-species">
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
                  <div className="space-y-2">
                    <Label>Body Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.body_weight_kg}
                      onChange={(e) => handleChange('body_weight_kg', e.target.value)}
                      placeholder="Weight"
                    />
                  </div>
                </div>
              </div>

              {/* Drug Details */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Drug Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Drug Used *</Label>
                    <Select value={formData.drug_used} onValueChange={(v) => handleChange('drug_used', v)}>
                      <SelectTrigger data-testid="dew-drug">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dewormingDrugs.map(d => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Drug Batch No.</Label>
                    <Input
                      value={formData.drug_batch}
                      onChange={(e) => handleChange('drug_batch', e.target.value)}
                      placeholder="Batch number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dose Rate *</Label>
                    <Input
                      value={formData.dose_rate}
                      onChange={(e) => handleChange('dose_rate', e.target.value)}
                      placeholder="e.g., 10 mg/kg"
                      data-testid="dew-dose-rate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dose Given *</Label>
                    <Input
                      value={formData.dose_given}
                      onChange={(e) => handleChange('dose_given', e.target.value)}
                      placeholder="e.g., 20 ml"
                      data-testid="dew-dose-given"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Route of Administration *</Label>
                    <Select value={formData.route} onValueChange={(v) => handleChange('route', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {routeOptions.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Result</Label>
                    <Select value={formData.result} onValueChange={(v) => handleChange('result', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {resultOptions.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Schedule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Deworming Date *</Label>
                    <Input
                      type="date"
                      value={formData.deworming_date}
                      onChange={(e) => handleDateChange(e.target.value)}
                      data-testid="dew-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Next Due Date</Label>
                    <Input
                      type="date"
                      value={formData.next_due_date}
                      onChange={(e) => handleChange('next_due_date', e.target.value)}
                    />
                    <p className="text-xs text-slate-400">Auto-calculated: 3 months from deworming</p>
                  </div>
                </div>
              </div>

              {/* Fecal Examination */}
              <div className="border-b pb-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox 
                    id="fecal_sample" 
                    checked={formData.fecal_sample_taken}
                    onCheckedChange={(checked) => handleChange('fecal_sample_taken', checked)}
                  />
                  <Label htmlFor="fecal_sample" className="cursor-pointer flex items-center gap-2">
                    <FlaskConical className="h-4 w-4" />
                    Fecal Sample Collected for EPG Testing
                  </Label>
                </div>
                {formData.fecal_sample_taken && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="space-y-2">
                      <Label>EPG Before Treatment</Label>
                      <Input
                        type="number"
                        value={formData.epg_before}
                        onChange={(e) => handleChange('epg_before', e.target.value)}
                        placeholder="Eggs per gram"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>EPG After Treatment</Label>
                      <Input
                        type="number"
                        value={formData.epg_after}
                        onChange={(e) => handleChange('epg_after', e.target.value)}
                        placeholder="Eggs per gram (14 days post)"
                      />
                    </div>
                  </div>
                )}
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

              <Button type="submit" className="w-full gap-2 bg-amber-600 hover:bg-amber-700" disabled={saving} data-testid="submit-deworming">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Register Deworming
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Bug className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-xs text-slate-500">Completed</p>
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
                <FlaskConical className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.fecalTested}</p>
                <p className="text-xs text-slate-500">Fecal Tested</p>
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
                data-testid="dew-search"
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
            <Input
              placeholder="Filter by drug..."
              className="w-40"
              value={filterDrug}
              onChange={(e) => setFilterDrug(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card className="p-12 text-center">
          <Bug className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No deworming records found</p>
          <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
            Create First Record
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Bug className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{r.case_number}</h3>
                        {getResultBadge(r.result)}
                        {r.fecal_sample_taken && (
                          <Badge variant="outline" className="text-purple-600 border-purple-200">
                            <FlaskConical className="h-3 w-3 mr-1" /> EPG Tested
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        <Pill className="h-3 w-3 inline mr-1" />
                        {getDrugLabel(r.drug_used)} • {r.dose_given} • {speciesDisplayNames[r.species] || r.species}
                      </p>
                      <p className="text-xs text-slate-500">
                        Tag: {r.tag_number} • {r.farmer_name} • {formatDate(r.deworming_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {r.next_due_date && (
                      <p className="text-xs text-slate-500">
                        Next Due: {formatDate(r.next_due_date)}
                      </p>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setViewRecord(r)} data-testid={`view-dew-${r.id}`}>
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
              <Bug className="h-5 w-5 text-amber-600" />
              Deworming Details - {viewRecord?.case_number}
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
                  <Label className="text-xs text-slate-500">Result</Label>
                  <div className="mt-1">{getResultBadge(viewRecord.result)}</div>
                </div>
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

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Drug Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">Drug Used</Label>
                    <p className="font-medium">{getDrugLabel(viewRecord.drug_used)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Batch No.</Label>
                    <p className="font-medium">{viewRecord.drug_batch || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Dose Rate</Label>
                    <p className="font-medium">{viewRecord.dose_rate}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Dose Given</Label>
                    <p className="font-medium">{viewRecord.dose_given}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Schedule</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">Deworming Date</Label>
                    <p className="font-medium">{formatDate(viewRecord.deworming_date)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Next Due</Label>
                    <p className="font-medium">{viewRecord.next_due_date ? formatDate(viewRecord.next_due_date) : 'Not set'}</p>
                  </div>
                </div>
              </div>

              {viewRecord.fecal_sample_taken && (
                <div className="border-t pt-4 bg-purple-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-700 mb-2 flex items-center gap-2">
                    <FlaskConical className="h-4 w-4" /> EPG Testing Results
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-slate-500">EPG Before</Label>
                      <p className="font-medium">{viewRecord.epg_before || 'Not recorded'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">EPG After (14 days)</Label>
                      <p className="font-medium">{viewRecord.epg_after || 'Not recorded'}</p>
                    </div>
                  </div>
                </div>
              )}

              {viewRecord.remarks && (
                <div className="border-t pt-4">
                  <Label className="text-xs text-slate-500">Remarks</Label>
                  <p className="text-sm bg-slate-50 p-2 rounded mt-1">{viewRecord.remarks}</p>
                </div>
              )}

              <div className="text-xs text-slate-400 text-right border-t pt-4">
                Performed by: {viewRecord.vet_name}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DewormingRegister;
