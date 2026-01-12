import React, { useState, useEffect } from 'react';
import { 
  Plus, Loader2, Search, Filter, Eye, CheckCircle2, 
  Bed, Calendar, Clock, AlertTriangle, ArrowRightLeft
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

const statusOptions = [
  { value: 'admitted', label: 'Admitted', color: 'bg-blue-100 text-blue-700' },
  { value: 'under_treatment', label: 'Under Treatment', color: 'bg-amber-100 text-amber-700' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
  { value: 'stable', label: 'Stable', color: 'bg-green-100 text-green-700' },
  { value: 'discharged', label: 'Discharged', color: 'bg-slate-100 text-slate-700' },
  { value: 'died', label: 'Died', color: 'bg-slate-800 text-white' },
  { value: 'referred', label: 'Referred', color: 'bg-purple-100 text-purple-700' },
];

const outcomeOptions = [
  { value: 'recovered', label: 'Recovered' },
  { value: 'improved', label: 'Improved' },
  { value: 'same', label: 'No Change' },
  { value: 'deteriorated', label: 'Deteriorated' },
  { value: 'died', label: 'Died' },
  { value: 'referred', label: 'Referred Out' },
];

const IPDRegister = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [viewRecord, setViewRecord] = useState(null);
  
  const initialFormState = {
    // From OPD base
    tag_number: '',
    farmer_name: '',
    farmer_id: '',
    farmer_village: '',
    farmer_phone: '',
    species: 'cattle',
    breed: '',
    age_months: '',
    sex: 'male',
    body_weight_kg: '',
    chief_complaint: '',
    history: '',
    clinical_findings: '',
    temperature: '',
    pulse_rate: '',
    respiration_rate: '',
    diagnosis: '',
    treatment: '',
    // IPD specific
    admission_date: new Date().toISOString().split('T')[0],
    admission_time: '',
    bed_number: '',
    ward: '',
    admission_reason: '',
    initial_condition: '',
    ipd_status: 'admitted',
    discharge_date: '',
    discharge_time: '',
    discharge_outcome: '',
    days_hospitalized: '',
    total_charges: '',
    follow_up_date: '',
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
    if (!formData.chief_complaint.trim()) errors.push('Chief Complaint is required');
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
        body_weight_kg: formData.body_weight_kg ? parseFloat(formData.body_weight_kg) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        pulse_rate: formData.pulse_rate ? parseInt(formData.pulse_rate) : null,
        respiration_rate: formData.respiration_rate ? parseInt(formData.respiration_rate) : null,
        days_hospitalized: formData.days_hospitalized ? parseInt(formData.days_hospitalized) : null,
        total_charges: formData.total_charges ? parseFloat(formData.total_charges) : null,
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

  const getStatusBadge = (status) => {
    const option = statusOptions.find(o => o.value === status);
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : (
      <Badge variant="outline">{status}</Badge>
    );
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tag_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.bed_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || r.ipd_status === filterStatus;
    const matchesSpecies = filterSpecies === 'all' || r.species === filterSpecies;
    return matchesSearch && matchesStatus && matchesSpecies;
  });

  const stats = {
    total: records.length,
    admitted: records.filter(r => ['admitted', 'under_treatment', 'critical', 'stable'].includes(r.ipd_status)).length,
    critical: records.filter(r => r.ipd_status === 'critical').length,
    discharged: records.filter(r => r.ipd_status === 'discharged').length,
    died: records.filter(r => r.ipd_status === 'died').length,
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
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

              {/* Admission Details */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Admission Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <Label>Admission Time</Label>
                    <Input
                      type="time"
                      value={formData.admission_time}
                      onChange={(e) => handleChange('admission_time', e.target.value)}
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
                    <Label>Ward</Label>
                    <Input
                      value={formData.ward}
                      onChange={(e) => handleChange('ward', e.target.value)}
                      placeholder="e.g., Large Animal Ward"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label>Admission Reason / Chief Complaint *</Label>
                  <Textarea
                    value={formData.chief_complaint}
                    onChange={(e) => handleChange('chief_complaint', e.target.value)}
                    placeholder="Main complaint / reason for admission..."
                    rows={2}
                    data-testid="ipd-complaint"
                  />
                </div>
              </div>

              {/* Clinical Findings */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Clinical Examination</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Temperature (°F)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => handleChange('temperature', e.target.value)}
                      placeholder="°F"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pulse Rate</Label>
                    <Input
                      type="number"
                      value={formData.pulse_rate}
                      onChange={(e) => handleChange('pulse_rate', e.target.value)}
                      placeholder="/min"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Respiration Rate</Label>
                    <Input
                      type="number"
                      value={formData.respiration_rate}
                      onChange={(e) => handleChange('respiration_rate', e.target.value)}
                      placeholder="/min"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Initial Condition</Label>
                    <Select value={formData.initial_condition} onValueChange={(v) => handleChange('initial_condition', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stable">Stable</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Clinical Findings</Label>
                    <Textarea
                      value={formData.clinical_findings}
                      onChange={(e) => handleChange('clinical_findings', e.target.value)}
                      placeholder="Detailed clinical findings..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provisional Diagnosis</Label>
                    <Textarea
                      value={formData.diagnosis}
                      onChange={(e) => handleChange('diagnosis', e.target.value)}
                      placeholder="Diagnosis..."
                      rows={2}
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label>Treatment Plan</Label>
                  <Textarea
                    value={formData.treatment}
                    onChange={(e) => handleChange('treatment', e.target.value)}
                    placeholder="Treatment protocol..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Status & Discharge */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Status & Discharge</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>IPD Status</Label>
                    <Select value={formData.ipd_status} onValueChange={(v) => handleChange('ipd_status', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {['discharged', 'died', 'referred'].includes(formData.ipd_status) && (
                    <>
                      <div className="space-y-2">
                        <Label>Discharge Date</Label>
                        <Input
                          type="date"
                          value={formData.discharge_date}
                          onChange={(e) => handleChange('discharge_date', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discharge Outcome</Label>
                        <Select value={formData.discharge_outcome} onValueChange={(v) => handleChange('discharge_outcome', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {outcomeOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Days Hospitalized</Label>
                        <Input
                          type="number"
                          value={formData.days_hospitalized}
                          onChange={(e) => handleChange('days_hospitalized', e.target.value)}
                          placeholder="Days"
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Total Charges (₹)</Label>
                    <Input
                      type="number"
                      value={formData.total_charges}
                      onChange={(e) => handleChange('total_charges', e.target.value)}
                      placeholder="Amount"
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
                <p className="text-2xl font-bold text-blue-600">{stats.admitted}</p>
                <p className="text-xs text-slate-500">Currently Admitted</p>
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
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                <p className="text-xs text-slate-500">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowRightLeft className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.discharged}</p>
                <p className="text-xs text-slate-500">Discharged</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Clock className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-600">{stats.died}</p>
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
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusOptions.map(o => (
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
            <Card key={r.id} className={`hover:shadow-md transition-shadow ${r.ipd_status === 'critical' ? 'border-red-300 bg-red-50/30' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      r.ipd_status === 'critical' ? 'bg-red-100' : 
                      ['admitted', 'under_treatment'].includes(r.ipd_status) ? 'bg-blue-100' : 
                      r.ipd_status === 'discharged' ? 'bg-green-100' : 'bg-slate-100'
                    }`}>
                      <Bed className={`h-6 w-6 ${
                        r.ipd_status === 'critical' ? 'text-red-600' :
                        ['admitted', 'under_treatment'].includes(r.ipd_status) ? 'text-blue-600' :
                        r.ipd_status === 'discharged' ? 'text-green-600' : 'text-slate-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{r.case_number}</h3>
                        {getStatusBadge(r.ipd_status)}
                        <Badge variant="outline" className="text-indigo-600">
                          Bed: {r.bed_number}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {speciesDisplayNames[r.species] || r.species} • Tag: {r.tag_number} • {r.diagnosis || r.chief_complaint}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.farmer_name} • {r.farmer_village} • Admitted: {formatDate(r.admission_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {r.days_hospitalized && (
                      <p className="text-xs text-slate-500">
                        {r.days_hospitalized} days
                      </p>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setViewRecord(r)} data-testid={`view-ipd-${r.id}`}>
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
                  <Label className="text-xs text-slate-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(viewRecord.ipd_status)}</div>
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
                    <Label className="text-xs text-slate-500">Chief Complaint</Label>
                    <p className="text-sm bg-slate-50 p-2 rounded">{viewRecord.chief_complaint}</p>
                  </div>
                  {viewRecord.diagnosis && (
                    <div>
                      <Label className="text-xs text-slate-500">Diagnosis</Label>
                      <p className="text-sm bg-slate-50 p-2 rounded">{viewRecord.diagnosis}</p>
                    </div>
                  )}
                  {viewRecord.treatment && (
                    <div>
                      <Label className="text-xs text-slate-500">Treatment</Label>
                      <p className="text-sm bg-slate-50 p-2 rounded">{viewRecord.treatment}</p>
                    </div>
                  )}
                </div>
              </div>

              {viewRecord.discharge_date && (
                <div className="border-t pt-4 bg-green-50 p-3 rounded">
                  <h4 className="text-sm font-medium text-green-700 mb-2">Discharge Info</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-slate-500">Discharge Date</Label>
                      <p className="font-medium">{formatDate(viewRecord.discharge_date)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Outcome</Label>
                      <p className="font-medium capitalize">{viewRecord.discharge_outcome}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Days Hospitalized</Label>
                      <p className="font-medium">{viewRecord.days_hospitalized || 'N/A'}</p>
                    </div>
                  </div>
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
