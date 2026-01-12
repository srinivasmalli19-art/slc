import React, { useState, useEffect } from 'react';
import { 
  Plus, Loader2, Search, Filter, Eye, CheckCircle2, 
  Bed, Calendar, AlertTriangle, ArrowRightLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
import { formatDate, speciesDisplayNames } from '@/lib/utils';

const speciesOptions = Object.entries(speciesDisplayNames);

const resultOptions = [
  { value: 'ongoing', label: 'Ongoing', color: 'bg-blue-100 text-blue-700' },
  { value: 'cured', label: 'Cured', color: 'bg-green-100 text-green-700' },
  { value: 'improved', label: 'Improved', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'referred', label: 'Referred', color: 'bg-amber-100 text-amber-700' },
  { value: 'died', label: 'Died', color: 'bg-red-100 text-red-700' },
];

const IPDRegister = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState('all');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [viewRecord, setViewRecord] = useState(null);
  
  const initialFormState = {
    tag_number: '',
    farmer_name: '',
    farmer_village: '',
    farmer_phone: '',
    species: 'cattle',
    breed: '',
    age_months: '',
    symptoms: '',
    tentative_diagnosis: '',
    treatment: '',
    result: 'ongoing',
    follow_up_date: '',
    admission_date: new Date().toISOString().split('T')[0],
    discharge_date: '',
    bed_number: '',
    remarks: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await api.get('/vet/ipd');
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch IPD records:', error);
      toast.error('Failed to load IPD records');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.tag_number.trim()) errors.push('Tag Number is required');
    if (!formData.farmer_name.trim()) errors.push('Farmer Name is required');
    if (!formData.farmer_village.trim()) errors.push('Village is required');
    if (!formData.symptoms.trim()) errors.push('Symptoms are required');
    if (!formData.tentative_diagnosis.trim()) errors.push('Tentative Diagnosis is required');
    if (!formData.treatment.trim()) errors.push('Treatment is required');
    if (!formData.admission_date) errors.push('Admission Date is required');
    if (!formData.bed_number.trim()) errors.push('Bed Number is required');
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
      };

      await api.post('/vet/ipd', payload);
      toast.success('IPD case admitted successfully!');
      
      setDialogOpen(false);
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to admit IPD case');
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

  const getResultBadge = (result) => {
    const option = resultOptions.find(o => o.value === result);
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : (
      <Badge variant="outline">{result}</Badge>
    );
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tag_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.bed_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResult = filterResult === 'all' || r.result === filterResult;
    const matchesSpecies = filterSpecies === 'all' || r.species === filterSpecies;
    return matchesSearch && matchesResult && matchesSpecies;
  });

  const stats = {
    total: records.length,
    ongoing: records.filter(r => r.result === 'ongoing').length,
    cured: records.filter(r => r.result === 'cured').length,
    discharged: records.filter(r => r.discharge_date).length,
    died: records.filter(r => r.result === 'died').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            IPD Register (In-Patient)
          </h1>
          <p className="text-slate-500 text-sm">Hospital admissions & bed management</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" data-testid="new-ipd-btn">
              <Plus className="h-4 w-4" />
              New Admission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-indigo-600" />
                New IPD Admission
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Patient & Owner */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Patient & Owner Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Tag Number *</Label>
                    <Input
                      value={formData.tag_number}
                      onChange={(e) => handleChange('tag_number', e.target.value)}
                      placeholder="Animal tag"
                      data-testid="ipd-tag"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Farmer Name *</Label>
                    <Input
                      value={formData.farmer_name}
                      onChange={(e) => handleChange('farmer_name', e.target.value)}
                      placeholder="Owner name"
                      data-testid="ipd-farmer-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Village *</Label>
                    <Input
                      value={formData.farmer_village}
                      onChange={(e) => handleChange('farmer_village', e.target.value)}
                      placeholder="Village"
                      data-testid="ipd-village"
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
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Species *</Label>
                    <Select value={formData.species} onValueChange={(v) => handleChange('species', v)}>
                      <SelectTrigger data-testid="ipd-species">
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
                </div>
              </div>

              {/* Admission Details */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Admission Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Admission Date *</Label>
                    <Input
                      type="date"
                      value={formData.admission_date}
                      onChange={(e) => handleChange('admission_date', e.target.value)}
                      data-testid="ipd-admission-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bed Number *</Label>
                    <Input
                      value={formData.bed_number}
                      onChange={(e) => handleChange('bed_number', e.target.value)}
                      placeholder="e.g., B-01"
                      data-testid="ipd-bed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Follow-up Date</Label>
                    <Input
                      type="date"
                      value={formData.follow_up_date}
                      onChange={(e) => handleChange('follow_up_date', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Clinical Details */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Clinical Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Symptoms *</Label>
                    <Textarea
                      value={formData.symptoms}
                      onChange={(e) => handleChange('symptoms', e.target.value)}
                      placeholder="Describe symptoms..."
                      rows={2}
                      data-testid="ipd-symptoms"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tentative Diagnosis *</Label>
                    <Textarea
                      value={formData.tentative_diagnosis}
                      onChange={(e) => handleChange('tentative_diagnosis', e.target.value)}
                      placeholder="Provisional diagnosis..."
                      rows={2}
                      data-testid="ipd-diagnosis"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Treatment *</Label>
                    <Textarea
                      value={formData.treatment}
                      onChange={(e) => handleChange('treatment', e.target.value)}
                      placeholder="Treatment protocol..."
                      rows={2}
                      data-testid="ipd-treatment"
                    />
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

              <Button type="submit" className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700" disabled={saving} data-testid="submit-ipd">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Admit Patient
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
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Bed className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bed className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.ongoing}</p>
                <p className="text-xs text-slate-500">Ongoing</p>
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
                <p className="text-2xl font-bold text-green-600">{stats.cured}</p>
                <p className="text-xs text-slate-500">Cured</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <ArrowRightLeft className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.discharged}</p>
                <p className="text-xs text-slate-500">Discharged</p>
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
                <p className="text-2xl font-bold text-red-600">{stats.died}</p>
                <p className="text-xs text-slate-500">Deaths</p>
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
                placeholder="Search by case number, tag, farmer, or bed..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="ipd-search"
              />
            </div>
            <Select value={filterResult} onValueChange={setFilterResult}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                {resultOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSpecies} onValueChange={setFilterSpecies}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Species" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Species</SelectItem>
                {speciesOptions.map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card className="p-12 text-center">
          <Bed className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No IPD records found</p>
          <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
            Admit First Patient
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((r) => (
            <Card key={r.id} className={`hover:shadow-md transition-shadow ${r.result === 'died' ? 'border-red-300 bg-red-50/30' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      r.result === 'ongoing' ? 'bg-blue-100' : 
                      r.result === 'cured' ? 'bg-green-100' : 
                      r.result === 'died' ? 'bg-red-100' : 'bg-slate-100'
                    }`}>
                      <Bed className={`h-6 w-6 ${
                        r.result === 'ongoing' ? 'text-blue-600' :
                        r.result === 'cured' ? 'text-green-600' :
                        r.result === 'died' ? 'text-red-600' : 'text-slate-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{r.case_number}</h3>
                        {getResultBadge(r.result)}
                        <Badge variant="outline" className="text-indigo-600">
                          Bed: {r.bed_number}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {speciesDisplayNames[r.species] || r.species} • Tag: {r.tag_number} • {r.tentative_diagnosis}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.farmer_name} • {r.farmer_village} • Admitted: {formatDate(r.admission_date)}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setViewRecord(r)} data-testid={`view-ipd-${r.id}`}>
                    <Eye className="h-4 w-4" />
                  </Button>
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
              <Bed className="h-5 w-5 text-indigo-600" />
              IPD Details - {viewRecord?.case_number}
            </DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Bed Number</Label>
                  <p className="font-medium">{viewRecord.bed_number}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Result</Label>
                  <div className="mt-1">{getResultBadge(viewRecord.result)}</div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Admission Date</Label>
                  <p className="font-medium">{formatDate(viewRecord.admission_date)}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Species</Label>
                  <p className="font-medium">{speciesDisplayNames[viewRecord.species]}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Patient & Owner</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">Tag Number</Label>
                    <p className="font-medium">{viewRecord.tag_number}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Farmer</Label>
                    <p className="font-medium">{viewRecord.farmer_name}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Clinical Details</h4>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-slate-500">Symptoms</Label>
                    <p className="text-sm bg-slate-50 p-2 rounded">{viewRecord.symptoms}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Diagnosis</Label>
                    <p className="text-sm bg-slate-50 p-2 rounded">{viewRecord.tentative_diagnosis}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Treatment</Label>
                    <p className="text-sm bg-slate-50 p-2 rounded">{viewRecord.treatment}</p>
                  </div>
                </div>
              </div>

              {viewRecord.discharge_date && (
                <div className="border-t pt-4 bg-green-50 p-3 rounded">
                  <h4 className="text-sm font-medium text-green-700 mb-2">Discharge Info</h4>
                  <p className="font-medium">Discharged: {formatDate(viewRecord.discharge_date)}</p>
                </div>
              )}

              <div className="text-xs text-slate-400 text-right border-t pt-4">
                Attending Vet: {viewRecord.vet_name}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IPDRegister;
