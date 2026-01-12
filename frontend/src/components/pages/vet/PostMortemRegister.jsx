import React, { useState, useEffect } from 'react';
import { 
  Plus, Loader2, Search, Filter, Eye, CheckCircle2, 
  FileText, Stethoscope, Microscope, AlertTriangle, Download
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate, speciesDisplayNames } from '@/lib/utils';

const speciesOptions = Object.entries(speciesDisplayNames);

const purposeOptions = [
  { value: 'insurance', label: 'Insurance Claim', color: 'bg-green-100 text-green-700' },
  { value: 'legal', label: 'Legal Case', color: 'bg-red-100 text-red-700' },
  { value: 'diagnostic', label: 'Diagnostic', color: 'bg-blue-100 text-blue-700' },
  { value: 'routine', label: 'Routine', color: 'bg-slate-100 text-slate-700' },
];

const rigorMortisOptions = ['present', 'absent', 'partial'];
const bloatingOptions = ['none', 'mild', 'moderate', 'severe'];
const disposalMethods = ['burial', 'burning', 'rendering'];

const sampleTypes = [
  'Blood', 'Serum', 'Tissue (Liver)', 'Tissue (Spleen)', 'Tissue (Kidney)',
  'Tissue (Lung)', 'Tissue (Brain)', 'Intestinal Content', 'Feces', 
  'Urine', 'CSF', 'Swab', 'Other'
];

const PostMortemRegister = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPurpose, setFilterPurpose] = useState('all');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [viewRecord, setViewRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  
  const initialFormState = {
    // Section A: General Information
    pm_date: new Date().toISOString().split('T')[0],
    pm_time: '',
    pm_location: '',
    reference_number: '',
    purpose: 'diagnostic',
    // Section B: Owner Details
    owner_name: '',
    owner_father_name: '',
    owner_address: '',
    owner_village: '',
    owner_mandal: '',
    owner_district: '',
    owner_phone: '',
    owner_aadhaar: '',
    // Section C: Animal Identification
    tag_number: '',
    species: 'cattle',
    breed: '',
    age_years: '',
    age_months: '',
    sex: 'male',
    color_markings: '',
    body_weight_kg: '',
    identification_marks: '',
    // Section D: Death Details
    death_date: '',
    death_time: '',
    place_of_death: '',
    found_dead: false,
    duration_of_illness: '',
    symptoms_observed: '',
    treatment_history: '',
    vaccination_history: '',
    feeding_history: '',
    // Section E: External Examination
    body_condition: '',
    rigor_mortis: 'present',
    bloating: 'none',
    discharge_from_orifices: '',
    skin_condition: '',
    mucous_membrane_color: '',
    eyes_condition: '',
    external_injuries: '',
    parasites_observed: '',
    other_external_findings: '',
    // Section F: Internal Examination
    subcutaneous_tissue: '',
    musculature: '',
    lymph_nodes: '',
    respiratory_system: '',
    cardiovascular_system: '',
    digestive_system: '',
    liver_findings: '',
    spleen_findings: '',
    kidney_findings: '',
    reproductive_system: '',
    nervous_system: '',
    urinary_system: '',
    other_internal_findings: '',
    // Section G: Diagnosis
    gross_pathological_diagnosis: '',
    probable_cause_of_death: '',
    differential_diagnosis: '',
    final_diagnosis: '',
    // Section H: Sample Collection
    samples_collected: false,
    sample_types: [],
    sample_preservation: '',
    lab_submission_date: '',
    lab_name: '',
    lab_results: '',
    // Section I: Disposal & Prevention
    disposal_method: 'burial',
    disposal_location: '',
    disposal_supervised_by: '',
    disinfection_done: true,
    preventive_measures_advised: '',
    quarantine_advised: false,
    vaccination_advised: false,
    // Certification
    insurance_case: false,
    insurance_company: '',
    insurance_policy_number: '',
    estimated_value: '',
    witnesses: '',
    photographs_taken: false,
    photograph_count: '',
    remarks: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await api.get('/vet/post-mortem');
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch post-mortem records:', error);
      toast.error('Failed to load post-mortem records');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.pm_date) errors.push('PM Date is required');
    if (!formData.pm_location.trim()) errors.push('PM Location is required');
    if (!formData.owner_name.trim()) errors.push('Owner Name is required');
    if (!formData.owner_address.trim()) errors.push('Owner Address is required');
    if (!formData.owner_village.trim()) errors.push('Village is required');
    if (!formData.tag_number.trim()) errors.push('Tag Number is required');
    if (!formData.death_date) errors.push('Death Date is required');
    if (!formData.place_of_death.trim()) errors.push('Place of Death is required');
    if (!formData.body_condition.trim()) errors.push('Body Condition is required');
    if (!formData.gross_pathological_diagnosis.trim()) errors.push('Gross Pathological Diagnosis is required');
    if (!formData.probable_cause_of_death.trim()) errors.push('Probable Cause of Death is required');
    if (!formData.disposal_method) errors.push('Disposal Method is required');
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
        age_months: formData.age_months ? parseInt(formData.age_months) : null,
        body_weight_kg: formData.body_weight_kg ? parseFloat(formData.body_weight_kg) : null,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
        photograph_count: formData.photograph_count ? parseInt(formData.photograph_count) : null,
      };

      await api.post('/vet/post-mortem', payload);
      toast.success('Post-mortem record created successfully!');
      
      setDialogOpen(false);
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create post-mortem record');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setActiveTab('general');
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSampleType = (sample) => {
    setFormData(prev => ({
      ...prev,
      sample_types: prev.sample_types.includes(sample)
        ? prev.sample_types.filter(s => s !== sample)
        : [...prev.sample_types, sample]
    }));
  };

  const getPurposeBadge = (purpose) => {
    const option = purposeOptions.find(o => o.value === purpose);
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : (
      <Badge variant="outline">{purpose}</Badge>
    );
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.pm_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tag_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.probable_cause_of_death?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPurpose = filterPurpose === 'all' || r.purpose === filterPurpose;
    const matchesSpecies = filterSpecies === 'all' || r.species === filterSpecies;
    return matchesSearch && matchesPurpose && matchesSpecies;
  });

  const stats = {
    total: records.length,
    insurance: records.filter(r => r.purpose === 'insurance').length,
    legal: records.filter(r => r.purpose === 'legal').length,
    diagnostic: records.filter(r => r.purpose === 'diagnostic').length,
    thisMonth: records.filter(r => {
      const date = new Date(r.pm_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Post-Mortem Register
          </h1>
          <p className="text-slate-500 text-sm">Systematic PM examination records (Sections A-I)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-purple-600 hover:bg-purple-700" data-testid="new-pm-btn">
              <Plus className="h-4 w-4" />
              New Post-Mortem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Microscope className="h-5 w-5 text-purple-600" />
                Post-Mortem Examination Record
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="animal">Animal & Death</TabsTrigger>
                  <TabsTrigger value="external">External Exam</TabsTrigger>
                  <TabsTrigger value="internal">Internal Exam</TabsTrigger>
                  <TabsTrigger value="diagnosis">Diagnosis & Disposal</TabsTrigger>
                </TabsList>

                {/* Tab 1: General Info */}
                <TabsContent value="general" className="space-y-4 mt-4">
                  <h3 className="text-sm font-medium text-slate-700">Section A: General Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>PM Date *</Label>
                      <Input
                        type="date"
                        value={formData.pm_date}
                        onChange={(e) => handleChange('pm_date', e.target.value)}
                        data-testid="pm-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>PM Time</Label>
                      <Input
                        type="time"
                        value={formData.pm_time}
                        onChange={(e) => handleChange('pm_time', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>PM Location *</Label>
                      <Input
                        value={formData.pm_location}
                        onChange={(e) => handleChange('pm_location', e.target.value)}
                        placeholder="Location of PM"
                        data-testid="pm-location"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Purpose *</Label>
                      <Select value={formData.purpose} onValueChange={(v) => handleChange('purpose', v)}>
                        <SelectTrigger data-testid="pm-purpose">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {purposeOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <h3 className="text-sm font-medium text-slate-700 mt-6">Section B: Owner Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Owner Name *</Label>
                      <Input
                        value={formData.owner_name}
                        onChange={(e) => handleChange('owner_name', e.target.value)}
                        placeholder="Full name"
                        data-testid="pm-owner-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Father's Name</Label>
                      <Input
                        value={formData.owner_father_name}
                        onChange={(e) => handleChange('owner_father_name', e.target.value)}
                        placeholder="Father's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Village *</Label>
                      <Input
                        value={formData.owner_village}
                        onChange={(e) => handleChange('owner_village', e.target.value)}
                        placeholder="Village"
                        data-testid="pm-village"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={formData.owner_phone}
                        onChange={(e) => handleChange('owner_phone', e.target.value)}
                        placeholder="10-digit phone"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Full Address *</Label>
                    <Textarea
                      value={formData.owner_address}
                      onChange={(e) => handleChange('owner_address', e.target.value)}
                      placeholder="Complete address..."
                      rows={2}
                      data-testid="pm-address"
                    />
                  </div>
                </TabsContent>

                {/* Tab 2: Animal & Death Details */}
                <TabsContent value="animal" className="space-y-4 mt-4">
                  <h3 className="text-sm font-medium text-slate-700">Section C: Animal Identification</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Tag Number *</Label>
                      <Input
                        value={formData.tag_number}
                        onChange={(e) => handleChange('tag_number', e.target.value)}
                        placeholder="Animal tag"
                        data-testid="pm-tag"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Species *</Label>
                      <Select value={formData.species} onValueChange={(v) => handleChange('species', v)}>
                        <SelectTrigger data-testid="pm-species">
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
                      <Label>Sex *</Label>
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
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Age (Years)</Label>
                      <Input type="number" value={formData.age_years} onChange={(e) => handleChange('age_years', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Age (Months)</Label>
                      <Input type="number" value={formData.age_months} onChange={(e) => handleChange('age_months', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Body Weight (kg)</Label>
                      <Input type="number" value={formData.body_weight_kg} onChange={(e) => handleChange('body_weight_kg', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Color/Markings</Label>
                      <Input value={formData.color_markings} onChange={(e) => handleChange('color_markings', e.target.value)} placeholder="Description" />
                    </div>
                  </div>

                  <h3 className="text-sm font-medium text-slate-700 mt-6">Section D: Death Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Death Date *</Label>
                      <Input type="date" value={formData.death_date} onChange={(e) => handleChange('death_date', e.target.value)} data-testid="pm-death-date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Death Time</Label>
                      <Input type="time" value={formData.death_time} onChange={(e) => handleChange('death_time', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Place of Death *</Label>
                      <Input value={formData.place_of_death} onChange={(e) => handleChange('place_of_death', e.target.value)} placeholder="Location" data-testid="pm-death-place" />
                    </div>
                    <div className="flex items-center space-x-2 pt-8">
                      <Checkbox id="found_dead" checked={formData.found_dead} onCheckedChange={(c) => handleChange('found_dead', c)} />
                      <Label htmlFor="found_dead" className="cursor-pointer">Found Dead</Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration of Illness</Label>
                      <Input value={formData.duration_of_illness} onChange={(e) => handleChange('duration_of_illness', e.target.value)} placeholder="e.g., 3 days" />
                    </div>
                    <div className="space-y-2">
                      <Label>Symptoms Observed</Label>
                      <Textarea value={formData.symptoms_observed} onChange={(e) => handleChange('symptoms_observed', e.target.value)} rows={2} />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 3: External Examination */}
                <TabsContent value="external" className="space-y-4 mt-4">
                  <h3 className="text-sm font-medium text-slate-700">Section E: External Examination Findings</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Body Condition *</Label>
                      <Input value={formData.body_condition} onChange={(e) => handleChange('body_condition', e.target.value)} placeholder="e.g., Good, Emaciated" data-testid="pm-body-condition" />
                    </div>
                    <div className="space-y-2">
                      <Label>Rigor Mortis</Label>
                      <Select value={formData.rigor_mortis} onValueChange={(v) => handleChange('rigor_mortis', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {rigorMortisOptions.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Bloating</Label>
                      <Select value={formData.bloating} onValueChange={(v) => handleChange('bloating', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {bloatingOptions.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Mucous Membrane</Label>
                      <Input value={formData.mucous_membrane_color} onChange={(e) => handleChange('mucous_membrane_color', e.target.value)} placeholder="Color" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Discharge from Orifices</Label>
                      <Textarea value={formData.discharge_from_orifices} onChange={(e) => handleChange('discharge_from_orifices', e.target.value)} rows={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>Skin Condition</Label>
                      <Textarea value={formData.skin_condition} onChange={(e) => handleChange('skin_condition', e.target.value)} rows={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>External Injuries</Label>
                      <Textarea value={formData.external_injuries} onChange={(e) => handleChange('external_injuries', e.target.value)} rows={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>Parasites Observed</Label>
                      <Textarea value={formData.parasites_observed} onChange={(e) => handleChange('parasites_observed', e.target.value)} rows={2} />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 4: Internal Examination */}
                <TabsContent value="internal" className="space-y-4 mt-4">
                  <h3 className="text-sm font-medium text-slate-700">Section F: Internal Examination Findings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Respiratory System</Label>
                      <Textarea value={formData.respiratory_system} onChange={(e) => handleChange('respiratory_system', e.target.value)} rows={2} placeholder="Lungs, trachea, etc." />
                    </div>
                    <div className="space-y-2">
                      <Label>Cardiovascular System</Label>
                      <Textarea value={formData.cardiovascular_system} onChange={(e) => handleChange('cardiovascular_system', e.target.value)} rows={2} placeholder="Heart, blood vessels" />
                    </div>
                    <div className="space-y-2">
                      <Label>Digestive System</Label>
                      <Textarea value={formData.digestive_system} onChange={(e) => handleChange('digestive_system', e.target.value)} rows={2} placeholder="Stomach, intestines" />
                    </div>
                    <div className="space-y-2">
                      <Label>Liver Findings</Label>
                      <Textarea value={formData.liver_findings} onChange={(e) => handleChange('liver_findings', e.target.value)} rows={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>Spleen Findings</Label>
                      <Textarea value={formData.spleen_findings} onChange={(e) => handleChange('spleen_findings', e.target.value)} rows={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>Kidney Findings</Label>
                      <Textarea value={formData.kidney_findings} onChange={(e) => handleChange('kidney_findings', e.target.value)} rows={2} />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 5: Diagnosis & Disposal */}
                <TabsContent value="diagnosis" className="space-y-4 mt-4">
                  <h3 className="text-sm font-medium text-slate-700">Section G: Diagnosis</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Gross Pathological Diagnosis *</Label>
                      <Textarea value={formData.gross_pathological_diagnosis} onChange={(e) => handleChange('gross_pathological_diagnosis', e.target.value)} rows={2} data-testid="pm-diagnosis" />
                    </div>
                    <div className="space-y-2">
                      <Label>Probable Cause of Death *</Label>
                      <Textarea value={formData.probable_cause_of_death} onChange={(e) => handleChange('probable_cause_of_death', e.target.value)} rows={2} data-testid="pm-cause" />
                    </div>
                  </div>

                  <h3 className="text-sm font-medium text-slate-700 mt-6">Section H: Sample Collection</h3>
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox id="samples" checked={formData.samples_collected} onCheckedChange={(c) => handleChange('samples_collected', c)} />
                    <Label htmlFor="samples" className="cursor-pointer">Samples Collected</Label>
                  </div>
                  {formData.samples_collected && (
                    <div className="space-y-4 pl-6 border-l-2 border-purple-200">
                      <div className="flex flex-wrap gap-2">
                        {sampleTypes.map(s => (
                          <Badge
                            key={s}
                            variant={formData.sample_types.includes(s) ? "default" : "outline"}
                            className={`cursor-pointer ${formData.sample_types.includes(s) ? 'bg-purple-600' : ''}`}
                            onClick={() => toggleSampleType(s)}
                          >{s}</Badge>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Lab Name</Label>
                          <Input value={formData.lab_name} onChange={(e) => handleChange('lab_name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Submission Date</Label>
                          <Input type="date" value={formData.lab_submission_date} onChange={(e) => handleChange('lab_submission_date', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )}

                  <h3 className="text-sm font-medium text-slate-700 mt-6">Section I: Disposal & Prevention</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Disposal Method *</Label>
                      <Select value={formData.disposal_method} onValueChange={(v) => handleChange('disposal_method', v)}>
                        <SelectTrigger data-testid="pm-disposal"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {disposalMethods.map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Disposal Location</Label>
                      <Input value={formData.disposal_location} onChange={(e) => handleChange('disposal_location', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Supervised By</Label>
                      <Input value={formData.disposal_supervised_by} onChange={(e) => handleChange('disposal_supervised_by', e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="disinfection" checked={formData.disinfection_done} onCheckedChange={(c) => handleChange('disinfection_done', c)} />
                      <Label htmlFor="disinfection" className="cursor-pointer">Disinfection Done</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="quarantine" checked={formData.quarantine_advised} onCheckedChange={(c) => handleChange('quarantine_advised', c)} />
                      <Label htmlFor="quarantine" className="cursor-pointer">Quarantine Advised</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="vacc_advised" checked={formData.vaccination_advised} onCheckedChange={(c) => handleChange('vaccination_advised', c)} />
                      <Label htmlFor="vacc_advised" className="cursor-pointer">Vaccination Advised</Label>
                    </div>
                  </div>

                  {formData.purpose === 'insurance' && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="text-sm font-medium text-green-700 mb-3">Insurance Details</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Insurance Company</Label>
                          <Input value={formData.insurance_company} onChange={(e) => handleChange('insurance_company', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Policy Number</Label>
                          <Input value={formData.insurance_policy_number} onChange={(e) => handleChange('insurance_policy_number', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Estimated Value (₹)</Label>
                          <Input type="number" value={formData.estimated_value} onChange={(e) => handleChange('estimated_value', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 mt-4">
                    <Label>Remarks</Label>
                    <Textarea value={formData.remarks} onChange={(e) => handleChange('remarks', e.target.value)} rows={2} />
                  </div>
                </TabsContent>
              </Tabs>

              <Button type="submit" className="w-full gap-2 bg-purple-600 hover:bg-purple-700" disabled={saving} data-testid="submit-pm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Save Post-Mortem Record
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
              <div className="p-2 bg-purple-100 rounded-lg">
                <Microscope className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">Total PM Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.insurance}</p>
                <p className="text-xs text-slate-500">Insurance Cases</p>
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
                <p className="text-2xl font-bold text-red-600">{stats.legal}</p>
                <p className="text-xs text-slate-500">Legal Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Stethoscope className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.diagnostic}</p>
                <p className="text-xs text-slate-500">Diagnostic</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Microscope className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.thisMonth}</p>
                <p className="text-xs text-slate-500">This Month</p>
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
                placeholder="Search by PM number, tag, owner, or cause..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="pm-search"
              />
            </div>
            <Select value={filterPurpose} onValueChange={setFilterPurpose}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purpose</SelectItem>
                {purposeOptions.map(o => (
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
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card className="p-12 text-center">
          <Microscope className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No post-mortem records found</p>
          <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
            Create First PM Record
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((r) => (
            <Card key={r.id} className={`hover:shadow-md transition-shadow ${r.purpose === 'legal' ? 'border-red-300 bg-red-50/30' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Microscope className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{r.pm_number}</h3>
                        {getPurposeBadge(r.purpose)}
                        {r.samples_collected && (
                          <Badge variant="outline" className="text-cyan-600">Samples</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        {speciesDisplayNames[r.species] || r.species} • Tag: {r.tag_number} • {r.probable_cause_of_death}
                      </p>
                      <p className="text-xs text-slate-500">
                        Owner: {r.owner_name} • {r.owner_village} • PM Date: {formatDate(r.pm_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setViewRecord(r)} data-testid={`view-pm-${r.id}`}>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-purple-600" />
              Post-Mortem Report - {viewRecord?.pm_number}
            </DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-start">
                <div className="grid grid-cols-3 gap-4 flex-1">
                  <div>
                    <Label className="text-xs text-slate-500">PM Date</Label>
                    <p className="font-medium">{formatDate(viewRecord.pm_date)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Purpose</Label>
                    <div className="mt-1">{getPurposeBadge(viewRecord.purpose)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Species</Label>
                    <p className="font-medium">{speciesDisplayNames[viewRecord.species]}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Animal & Owner</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">Tag Number</Label>
                    <p className="font-medium">{viewRecord.tag_number}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Owner</Label>
                    <p className="font-medium">{viewRecord.owner_name}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Diagnosis</h4>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-slate-500">Gross Pathological Diagnosis</Label>
                    <p className="text-sm bg-slate-50 p-2 rounded">{viewRecord.gross_pathological_diagnosis}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Probable Cause of Death</Label>
                    <p className="text-sm bg-purple-50 p-2 rounded font-medium">{viewRecord.probable_cause_of_death}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Disposal</h4>
                <p className="font-medium capitalize">{viewRecord.disposal_method}</p>
                <div className="flex gap-2 mt-2">
                  {viewRecord.disinfection_done && <Badge className="bg-green-100 text-green-700">Disinfected</Badge>}
                  {viewRecord.quarantine_advised && <Badge className="bg-amber-100 text-amber-700">Quarantine Advised</Badge>}
                  {viewRecord.vaccination_advised && <Badge className="bg-blue-100 text-blue-700">Vaccination Advised</Badge>}
                </div>
              </div>

              <div className="text-xs text-slate-400 text-right border-t pt-4">
                Conducted by: {viewRecord.vet_name} ({viewRecord.vet_registration_number || 'N/A'})
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostMortemRegister;
