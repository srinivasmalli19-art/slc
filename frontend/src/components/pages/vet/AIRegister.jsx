import React, { useState, useEffect } from 'react';
import { 
  Plus, Loader2, Search, Filter, Eye, Edit2, CheckCircle2, 
  Heart, Calendar, MapPin, User, Phone, FileText, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate, speciesDisplayNames } from '@/lib/utils';

const speciesOptions = Object.entries(speciesDisplayNames).filter(([key]) => 
  ['cattle', 'buffalo', 'goat', 'sheep'].includes(key)
);

const aiTypeOptions = [
  { value: 'fresh', label: 'Fresh Semen' },
  { value: 'frozen', label: 'Frozen Semen' },
];

const pdResultOptions = [
  { value: 'positive', label: 'Pregnant', color: 'bg-green-100 text-green-700' },
  { value: 'negative', label: 'Not Pregnant', color: 'bg-red-100 text-red-700' },
  { value: 'repeat', label: 'Repeat AI', color: 'bg-amber-100 text-amber-700' },
  { value: 'pending', label: 'PD Pending', color: 'bg-slate-100 text-slate-700' },
];

const heatSymptoms = [
  'Bellowing', 'Mounting', 'Clear Mucus Discharge', 'Swollen Vulva',
  'Restlessness', 'Decreased Milk', 'Standing Heat', 'Reduced Feed Intake'
];

const AIRegister = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterPDResult, setFilterPDResult] = useState('all');
  const [viewRecord, setViewRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  const initialFormState = {
    // Location Details
    village: '',
    mandal: '',
    district: '',
    state: '',
    // Semen Straw Details
    ss_number: '',
    bull_id: '',
    bull_breed: '',
    semen_batch: '',
    semen_station: '',
    // Animal Details
    tag_number: '',
    sire_number: '',
    species: 'cattle',
    breed: '',
    age_years: '',
    parity: '',
    body_condition_score: '',
    milk_yield_liters: '',
    // Farmer Details
    farmer_name: '',
    farmer_father_name: '',
    farmer_address: '',
    farmer_phone: '',
    farmer_aadhaar: '',
    // AI Details
    ai_date: new Date().toISOString().split('T')[0],
    ai_time: '',
    heat_symptoms: '',
    ai_attempt_number: 1,
    ai_type: 'frozen',
    straws_used: 1,
    insemination_site: '',
    // Stock Details
    opening_balance: '',
    straws_received: '',
    straws_used_today: '',
    closing_balance: '',
    // Fee Details
    fee_amount: '',
    fee_receipt_number: '',
    fee_date: '',
    // Pregnancy Diagnosis
    pd_date: '',
    pd_result: '',
    pd_days: '',
    // Calf Birth
    calf_birth_date: '',
    calf_sex: '',
    calf_weight_kg: '',
    calf_tag_number: '',
    // Additional
    lh_count: '',
    lhiii_count: '',
    remarks: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await api.get('/vet/ai-register');
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch AI records:', error);
      toast.error('Failed to load AI records');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.village.trim()) errors.push('Village is required');
    if (!formData.ss_number.trim()) errors.push('Semen Straw Number is required');
    if (!formData.tag_number.trim()) errors.push('Animal Tag Number is required');
    if (!formData.farmer_name.trim()) errors.push('Farmer Name is required');
    if (!formData.farmer_phone.trim()) errors.push('Farmer Phone is required');
    if (!formData.ai_date) errors.push('AI Date is required');
    if (formData.farmer_phone && !/^\d{10}$/.test(formData.farmer_phone)) {
      errors.push('Phone must be 10 digits');
    }
    if (formData.farmer_aadhaar && !/^\d{12}$/.test(formData.farmer_aadhaar)) {
      errors.push('Aadhaar must be 12 digits');
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
        age_years: formData.age_years ? parseInt(formData.age_years) : null,
        parity: formData.parity ? parseInt(formData.parity) : null,
        body_condition_score: formData.body_condition_score ? parseFloat(formData.body_condition_score) : null,
        milk_yield_liters: formData.milk_yield_liters ? parseFloat(formData.milk_yield_liters) : null,
        ai_attempt_number: parseInt(formData.ai_attempt_number) || 1,
        straws_used: parseInt(formData.straws_used) || 1,
        opening_balance: formData.opening_balance ? parseInt(formData.opening_balance) : null,
        straws_received: formData.straws_received ? parseInt(formData.straws_received) : null,
        straws_used_today: formData.straws_used_today ? parseInt(formData.straws_used_today) : null,
        closing_balance: formData.closing_balance ? parseInt(formData.closing_balance) : null,
        fee_amount: formData.fee_amount ? parseFloat(formData.fee_amount) : null,
        pd_days: formData.pd_days ? parseInt(formData.pd_days) : null,
        calf_weight_kg: formData.calf_weight_kg ? parseFloat(formData.calf_weight_kg) : null,
        lh_count: formData.lh_count ? parseInt(formData.lh_count) : null,
        lhiii_count: formData.lhiii_count ? parseInt(formData.lhiii_count) : null,
      };

      if (editRecord) {
        await api.put(`/vet/ai-register/${editRecord.id}`, payload);
        toast.success('AI record updated successfully!');
      } else {
        await api.post('/vet/ai-register', payload);
        toast.success('AI record created successfully!');
      }
      
      setDialogOpen(false);
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save AI record');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditRecord(null);
    setActiveTab('basic');
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const openEditDialog = (record) => {
    setEditRecord(record);
    setFormData({
      ...initialFormState,
      ...record,
      age_years: record.age_years?.toString() || '',
      parity: record.parity?.toString() || '',
      body_condition_score: record.body_condition_score?.toString() || '',
      milk_yield_liters: record.milk_yield_liters?.toString() || '',
      ai_attempt_number: record.ai_attempt_number || 1,
      straws_used: record.straws_used || 1,
      opening_balance: record.opening_balance?.toString() || '',
      straws_received: record.straws_received?.toString() || '',
      straws_used_today: record.straws_used_today?.toString() || '',
      closing_balance: record.closing_balance?.toString() || '',
      fee_amount: record.fee_amount?.toString() || '',
      pd_days: record.pd_days?.toString() || '',
      calf_weight_kg: record.calf_weight_kg?.toString() || '',
      lh_count: record.lh_count?.toString() || '',
      lhiii_count: record.lhiii_count?.toString() || '',
    });
    setDialogOpen(true);
  };

  const getPDResultBadge = (result) => {
    if (!result) return <Badge variant="outline">PD Pending</Badge>;
    const option = pdResultOptions.find(o => o.value === result);
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
      r.village?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = filterSpecies === 'all' || r.species === filterSpecies;
    const matchesPD = filterPDResult === 'all' || r.pd_result === filterPDResult || (!r.pd_result && filterPDResult === 'pending');
    return matchesSearch && matchesSpecies && matchesPD;
  });

  // Stats calculations
  const stats = {
    total: records.length,
    pregnant: records.filter(r => r.pd_result === 'positive').length,
    notPregnant: records.filter(r => r.pd_result === 'negative').length,
    pending: records.filter(r => !r.pd_result || r.pd_result === 'pending').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            AI Register (Artificial Insemination)
          </h1>
          <p className="text-slate-500 text-sm">Complete breeding & pregnancy tracking</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-pink-600 hover:bg-pink-700" data-testid="new-ai-record-btn">
              <Plus className="h-4 w-4" />
              New AI Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-600" />
                {editRecord ? 'Update AI Record' : 'New AI Record Entry'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="semen">Semen Details</TabsTrigger>
                  <TabsTrigger value="animal">Animal Details</TabsTrigger>
                  <TabsTrigger value="stock">Stock & Fee</TabsTrigger>
                  <TabsTrigger value="followup">PD & Calf</TabsTrigger>
                </TabsList>

                {/* Tab 1: Basic Info */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Village *</Label>
                      <Input
                        value={formData.village}
                        onChange={(e) => handleChange('village', e.target.value)}
                        placeholder="Village name"
                        data-testid="ai-village"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mandal</Label>
                      <Input
                        value={formData.mandal}
                        onChange={(e) => handleChange('mandal', e.target.value)}
                        placeholder="Mandal/Block"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>District</Label>
                      <Input
                        value={formData.district}
                        onChange={(e) => handleChange('district', e.target.value)}
                        placeholder="District"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={formData.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        placeholder="State"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" /> Farmer Details
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Farmer Name *</Label>
                        <Input
                          value={formData.farmer_name}
                          onChange={(e) => handleChange('farmer_name', e.target.value)}
                          placeholder="Full name"
                          data-testid="ai-farmer-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Father's Name</Label>
                        <Input
                          value={formData.farmer_father_name}
                          onChange={(e) => handleChange('farmer_father_name', e.target.value)}
                          placeholder="Father's name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone *</Label>
                        <Input
                          value={formData.farmer_phone}
                          onChange={(e) => handleChange('farmer_phone', e.target.value)}
                          placeholder="10-digit phone"
                          maxLength={10}
                          data-testid="ai-farmer-phone"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Aadhaar Number</Label>
                        <Input
                          value={formData.farmer_aadhaar}
                          onChange={(e) => handleChange('farmer_aadhaar', e.target.value)}
                          placeholder="12-digit Aadhaar"
                          maxLength={12}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Address</Label>
                      <Textarea
                        value={formData.farmer_address}
                        onChange={(e) => handleChange('farmer_address', e.target.value)}
                        placeholder="Full address"
                        rows={2}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 2: Semen Details */}
                <TabsContent value="semen" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Semen Straw Number *</Label>
                      <Input
                        value={formData.ss_number}
                        onChange={(e) => handleChange('ss_number', e.target.value)}
                        placeholder="SS Number"
                        data-testid="ai-ss-number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bull ID</Label>
                      <Input
                        value={formData.bull_id}
                        onChange={(e) => handleChange('bull_id', e.target.value)}
                        placeholder="Bull identification"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bull Breed</Label>
                      <Input
                        value={formData.bull_breed}
                        onChange={(e) => handleChange('bull_breed', e.target.value)}
                        placeholder="e.g., HF, Jersey, Murrah"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Semen Batch</Label>
                      <Input
                        value={formData.semen_batch}
                        onChange={(e) => handleChange('semen_batch', e.target.value)}
                        placeholder="Batch number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Semen Station</Label>
                      <Input
                        value={formData.semen_station}
                        onChange={(e) => handleChange('semen_station', e.target.value)}
                        placeholder="Semen station name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>AI Type</Label>
                      <Select value={formData.ai_type} onValueChange={(v) => handleChange('ai_type', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {aiTypeOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> AI Details
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>AI Date *</Label>
                        <Input
                          type="date"
                          value={formData.ai_date}
                          onChange={(e) => handleChange('ai_date', e.target.value)}
                          data-testid="ai-date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>AI Time</Label>
                        <Input
                          type="time"
                          value={formData.ai_time}
                          onChange={(e) => handleChange('ai_time', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>AI Attempt #</Label>
                        <Select value={formData.ai_attempt_number.toString()} onValueChange={(v) => handleChange('ai_attempt_number', parseInt(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1st AI</SelectItem>
                            <SelectItem value="2">2nd AI</SelectItem>
                            <SelectItem value="3">3rd AI</SelectItem>
                            <SelectItem value="4">4th+ AI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Straws Used</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.straws_used}
                          onChange={(e) => handleChange('straws_used', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label>Heat Symptoms</Label>
                        <Select value={formData.heat_symptoms} onValueChange={(v) => handleChange('heat_symptoms', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select symptoms" />
                          </SelectTrigger>
                          <SelectContent>
                            {heatSymptoms.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Insemination Site</Label>
                        <Input
                          value={formData.insemination_site}
                          onChange={(e) => handleChange('insemination_site', e.target.value)}
                          placeholder="e.g., Mid-cervix, Deep cervix"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 3: Animal Details */}
                <TabsContent value="animal" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Tag Number *</Label>
                      <Input
                        value={formData.tag_number}
                        onChange={(e) => handleChange('tag_number', e.target.value)}
                        placeholder="Animal tag"
                        data-testid="ai-tag-number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Species *</Label>
                      <Select value={formData.species} onValueChange={(v) => handleChange('species', v)}>
                        <SelectTrigger data-testid="ai-species">
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
                        placeholder="Animal breed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sire Number</Label>
                      <Input
                        value={formData.sire_number}
                        onChange={(e) => handleChange('sire_number', e.target.value)}
                        placeholder="Sire tag"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Age (Years)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.age_years}
                        onChange={(e) => handleChange('age_years', e.target.value)}
                        placeholder="Age"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Parity</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.parity}
                        onChange={(e) => handleChange('parity', e.target.value)}
                        placeholder="Number of calvings"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Body Condition Score</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="1"
                        max="5"
                        value={formData.body_condition_score}
                        onChange={(e) => handleChange('body_condition_score', e.target.value)}
                        placeholder="1-5 scale"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Milk Yield (L/day)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formData.milk_yield_liters}
                        onChange={(e) => handleChange('milk_yield_liters', e.target.value)}
                        placeholder="Liters per day"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 4: Stock & Fee */}
                <TabsContent value="stock" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Opening Balance</Label>
                      <Input
                        type="number"
                        value={formData.opening_balance}
                        onChange={(e) => handleChange('opening_balance', e.target.value)}
                        placeholder="Straws"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Straws Received</Label>
                      <Input
                        type="number"
                        value={formData.straws_received}
                        onChange={(e) => handleChange('straws_received', e.target.value)}
                        placeholder="Received today"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Straws Used Today</Label>
                      <Input
                        type="number"
                        value={formData.straws_used_today}
                        onChange={(e) => handleChange('straws_used_today', e.target.value)}
                        placeholder="Used today"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Closing Balance</Label>
                      <Input
                        type="number"
                        value={formData.closing_balance}
                        onChange={(e) => handleChange('closing_balance', e.target.value)}
                        placeholder="Remaining"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> Fee Details
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Fee Amount (₹)</Label>
                        <Input
                          type="number"
                          value={formData.fee_amount}
                          onChange={(e) => handleChange('fee_amount', e.target.value)}
                          placeholder="Amount"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Receipt Number</Label>
                        <Input
                          value={formData.fee_receipt_number}
                          onChange={(e) => handleChange('fee_receipt_number', e.target.value)}
                          placeholder="Receipt #"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fee Date</Label>
                        <Input
                          type="date"
                          value={formData.fee_date}
                          onChange={(e) => handleChange('fee_date', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Additional Counts</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>LH Count</Label>
                        <Input
                          type="number"
                          value={formData.lh_count}
                          onChange={(e) => handleChange('lh_count', e.target.value)}
                          placeholder="Liquid handling count"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>LHIII Count</Label>
                        <Input
                          type="number"
                          value={formData.lhiii_count}
                          onChange={(e) => handleChange('lhiii_count', e.target.value)}
                          placeholder="LHIII count"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 5: PD & Calf Birth */}
                <TabsContent value="followup" className="space-y-4 mt-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-medium text-blue-700 mb-3">Pregnancy Diagnosis (PD)</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>PD Date</Label>
                        <Input
                          type="date"
                          value={formData.pd_date}
                          onChange={(e) => handleChange('pd_date', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>PD Result</Label>
                        <Select value={formData.pd_result} onValueChange={(v) => handleChange('pd_result', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select result" />
                          </SelectTrigger>
                          <SelectContent>
                            {pdResultOptions.filter(o => o.value !== 'pending').map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>PD Days</Label>
                        <Input
                          type="number"
                          value={formData.pd_days}
                          onChange={(e) => handleChange('pd_days', e.target.value)}
                          placeholder="Days post-AI"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="text-sm font-medium text-green-700 mb-3">Calf Birth Details (if applicable)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Calf Birth Date</Label>
                        <Input
                          type="date"
                          value={formData.calf_birth_date}
                          onChange={(e) => handleChange('calf_birth_date', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Calf Sex</Label>
                        <Select value={formData.calf_sex} onValueChange={(v) => handleChange('calf_sex', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sex" />
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
                          placeholder="Calf tag"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Textarea
                      value={formData.remarks}
                      onChange={(e) => handleChange('remarks', e.target.value)}
                      placeholder="Any additional notes..."
                      rows={3}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4 border-t">
                <Button type="submit" className="flex-1 gap-2 bg-pink-600 hover:bg-pink-700" disabled={saving} data-testid="submit-ai-record">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {editRecord ? 'Update AI Record' : 'Register AI Record'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Heart className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">Total AI Records</p>
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
                <p className="text-2xl font-bold text-green-600">{stats.pregnant}</p>
                <p className="text-xs text-slate-500">Confirmed Pregnant</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FileText className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.notPregnant}</p>
                <p className="text-xs text-slate-500">Not Pregnant</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                <p className="text-xs text-slate-500">PD Pending</p>
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
                placeholder="Search by case number, tag, farmer, or village..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="ai-search"
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
            <Select value={filterPDResult} onValueChange={setFilterPDResult}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="PD Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                {pdResultOptions.map(o => (
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
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No AI records found</p>
          <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
            Create First AI Record
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center">
                      <Heart className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{r.case_number}</h3>
                        {getPDResultBadge(r.pd_result)}
                        {r.ai_attempt_number > 1 && (
                          <Badge variant="outline" className="text-xs">
                            {r.ai_attempt_number}nd/rd AI
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        {speciesDisplayNames[r.species] || r.species} • Tag: {r.tag_number} • Bull: {r.bull_breed || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-500">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {r.village} • {r.farmer_name} • {formatDate(r.ai_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setViewRecord(r)} data-testid={`view-ai-${r.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(r)} data-testid={`edit-ai-${r.id}`}>
                      <Edit2 className="h-4 w-4" />
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-600" />
              AI Record Details - {viewRecord?.case_number}
            </DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Village</Label>
                  <p className="font-medium">{viewRecord.village}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">AI Date</Label>
                  <p className="font-medium">{formatDate(viewRecord.ai_date)}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Species</Label>
                  <p className="font-medium">{speciesDisplayNames[viewRecord.species]}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">PD Result</Label>
                  <div className="mt-1">{getPDResultBadge(viewRecord.pd_result)}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Farmer Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">Farmer Name</Label>
                    <p className="font-medium">{viewRecord.farmer_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Phone</Label>
                    <p className="font-medium">{viewRecord.farmer_phone}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Animal & Semen</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">Tag Number</Label>
                    <p className="font-medium">{viewRecord.tag_number}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Breed</Label>
                    <p className="font-medium">{viewRecord.breed || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">SS Number</Label>
                    <p className="font-medium">{viewRecord.ss_number}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Bull Breed</Label>
                    <p className="font-medium">{viewRecord.bull_breed || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {viewRecord.pd_result === 'positive' && viewRecord.calf_birth_date && (
                <div className="border-t pt-4 bg-green-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-green-700 mb-2">Calf Birth</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-slate-500">Birth Date</Label>
                      <p className="font-medium">{formatDate(viewRecord.calf_birth_date)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Calf Sex</Label>
                      <p className="font-medium capitalize">{viewRecord.calf_sex || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Weight</Label>
                      <p className="font-medium">{viewRecord.calf_weight_kg ? `${viewRecord.calf_weight_kg} kg` : 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Calf Tag</Label>
                      <p className="font-medium">{viewRecord.calf_tag_number || 'N/A'}</p>
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
                <p>Monthly No: {viewRecord.monthly_number} • Yearly No: {viewRecord.yearly_number}</p>
                <p>Performed by: {viewRecord.vet_name}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIRegister;
