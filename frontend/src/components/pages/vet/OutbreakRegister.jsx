import React, { useState, useEffect } from 'react';
import { 
  Plus, Loader2, Search, Filter, Eye, CheckCircle2, 
  AlertTriangle, MapPin, Activity, Shield, Users, FileText
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
import { formatDate, speciesDisplayNames, HIGH_RISK_DISEASES } from '@/lib/utils';

const speciesOptions = Object.entries(speciesDisplayNames);

const diseaseNatureOptions = [
  { value: 'normal', label: 'Normal', color: 'bg-slate-100 text-slate-700' },
  { value: 'zoonotic', label: 'Zoonotic', color: 'bg-red-100 text-red-700' },
  { value: 'notifiable', label: 'Notifiable', color: 'bg-amber-100 text-amber-700' },
];

const outbreakStatusOptions = [
  { value: 'active', label: 'Active', color: 'bg-red-100 text-red-700' },
  { value: 'contained', label: 'Contained', color: 'bg-amber-100 text-amber-700' },
  { value: 'closed', label: 'Closed', color: 'bg-green-100 text-green-700' },
];

const commonDiseases = [
  'FMD (Foot & Mouth Disease)',
  'Anthrax',
  'Brucellosis',
  'Hemorrhagic Septicemia (HS)',
  'Black Quarter (BQ)',
  'PPR (Peste des Petits Ruminants)',
  'Lumpy Skin Disease (LSD)',
  'Avian Influenza',
  'Ranikhet Disease',
  'Classical Swine Fever',
  'Rabies',
  'Theileriosis',
  'Babesiosis',
  'Enterotoxemia',
  'Mastitis (Epidemic)',
  'Other'
];

const OutbreakRegister = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewRecord, setViewRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  const initialFormState = {
    outbreak_date: new Date().toISOString().split('T')[0],
    disease_name: '',
    disease_nature: 'normal',
    village: '',
    mandal: '',
    district: '',
    species_affected: [],
    total_susceptible: '',
    animals_affected: '',
    animals_treated: '',
    deaths: '0',
    source_of_infection: '',
    spread_pattern: '',
    control_measures: '',
    vaccination_done: false,
    vaccination_count: '',
    ring_vaccination: false,
    quarantine_imposed: false,
    samples_collected: false,
    lab_results: '',
    reported_to_authorities: false,
    authority_report_date: '',
    outbreak_status: 'active',
    closure_date: '',
    economic_loss_estimate: '',
    remarks: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await api.get('/vet/outbreak');
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch outbreak records:', error);
      toast.error('Failed to load outbreak records');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.outbreak_date) errors.push('Outbreak Date is required');
    if (!formData.disease_name) errors.push('Disease Name is required');
    if (!formData.village.trim()) errors.push('Village is required');
    if (formData.species_affected.length === 0) errors.push('At least one species must be selected');
    if (!formData.total_susceptible) errors.push('Total Susceptible count is required');
    if (!formData.animals_affected) errors.push('Animals Affected count is required');
    if (!formData.animals_treated) errors.push('Animals Treated count is required');
    if (!formData.control_measures.trim()) errors.push('Control Measures are required');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }

    // Check if it's a zoonotic disease
    if (HIGH_RISK_DISEASES.some(d => formData.disease_name.toLowerCase().includes(d.toLowerCase()))) {
      if (!formData.reported_to_authorities) {
        toast.warning('This is a HIGH-RISK ZOONOTIC disease. Government reporting is mandatory!');
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        total_susceptible: parseInt(formData.total_susceptible) || 0,
        animals_affected: parseInt(formData.animals_affected) || 0,
        animals_treated: parseInt(formData.animals_treated) || 0,
        deaths: parseInt(formData.deaths) || 0,
        vaccination_count: formData.vaccination_count ? parseInt(formData.vaccination_count) : null,
        economic_loss_estimate: formData.economic_loss_estimate ? parseFloat(formData.economic_loss_estimate) : null,
      };

      await api.post('/vet/outbreak', payload);
      toast.success('Outbreak registered successfully!');
      
      setDialogOpen(false);
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to register outbreak');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setActiveTab('basic');
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSpecies = (species) => {
    setFormData(prev => ({
      ...prev,
      species_affected: prev.species_affected.includes(species)
        ? prev.species_affected.filter(s => s !== species)
        : [...prev.species_affected, species]
    }));
  };

  const getStatusBadge = (status) => {
    const option = outbreakStatusOptions.find(o => o.value === status);
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : (
      <Badge variant="outline">{status}</Badge>
    );
  };

  const getNatureBadge = (nature) => {
    const option = diseaseNatureOptions.find(o => o.value === nature);
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : null;
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.outbreak_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.disease_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.village?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || r.outbreak_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: records.length,
    active: records.filter(r => r.outbreak_status === 'active').length,
    contained: records.filter(r => r.outbreak_status === 'contained').length,
    zoonotic: records.filter(r => r.disease_nature === 'zoonotic').length,
    totalDeaths: records.reduce((sum, r) => sum + (r.deaths || 0), 0),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Outbreak Register
          </h1>
          <p className="text-slate-500 text-sm">Disease outbreak tracking & government reporting</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-red-600 hover:bg-red-700" data-testid="new-outbreak-btn">
              <Plus className="h-4 w-4" />
              Report Outbreak
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Report Disease Outbreak
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="impact">Impact & Cases</TabsTrigger>
                  <TabsTrigger value="control">Control Measures</TabsTrigger>
                  <TabsTrigger value="reporting">Reporting</TabsTrigger>
                </TabsList>

                {/* Tab 1: Basic Info */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Outbreak Date *</Label>
                      <Input
                        type="date"
                        value={formData.outbreak_date}
                        onChange={(e) => handleChange('outbreak_date', e.target.value)}
                        data-testid="outbreak-date"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Disease Name *</Label>
                      <Select value={formData.disease_name} onValueChange={(v) => handleChange('disease_name', v)}>
                        <SelectTrigger data-testid="outbreak-disease">
                          <SelectValue placeholder="Select disease" />
                        </SelectTrigger>
                        <SelectContent>
                          {commonDiseases.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Disease Nature *</Label>
                      <Select value={formData.disease_nature} onValueChange={(v) => handleChange('disease_nature', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {diseaseNatureOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Village *</Label>
                      <Input
                        value={formData.village}
                        onChange={(e) => handleChange('village', e.target.value)}
                        placeholder="Village name"
                        data-testid="outbreak-village"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mandal/Block</Label>
                      <Input
                        value={formData.mandal}
                        onChange={(e) => handleChange('mandal', e.target.value)}
                        placeholder="Mandal"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Species Affected *</Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-slate-50">
                      {speciesOptions.map(([value, label]) => (
                        <Badge
                          key={value}
                          variant={formData.species_affected.includes(value) ? "default" : "outline"}
                          className={`cursor-pointer ${formData.species_affected.includes(value) ? 'bg-red-600' : ''}`}
                          onClick={() => toggleSpecies(value)}
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 2: Impact & Cases */}
                <TabsContent value="impact" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Total Susceptible *</Label>
                      <Input
                        type="number"
                        value={formData.total_susceptible}
                        onChange={(e) => handleChange('total_susceptible', e.target.value)}
                        placeholder="Total animals at risk"
                        data-testid="outbreak-susceptible"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Animals Affected *</Label>
                      <Input
                        type="number"
                        value={formData.animals_affected}
                        onChange={(e) => handleChange('animals_affected', e.target.value)}
                        placeholder="Sick animals"
                        data-testid="outbreak-affected"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Animals Treated *</Label>
                      <Input
                        type="number"
                        value={formData.animals_treated}
                        onChange={(e) => handleChange('animals_treated', e.target.value)}
                        placeholder="Treated count"
                        data-testid="outbreak-treated"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Deaths</Label>
                      <Input
                        type="number"
                        value={formData.deaths}
                        onChange={(e) => handleChange('deaths', e.target.value)}
                        placeholder="Mortality count"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Source of Infection</Label>
                      <Input
                        value={formData.source_of_infection}
                        onChange={(e) => handleChange('source_of_infection', e.target.value)}
                        placeholder="e.g., Imported animal, Wild animal contact"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Spread Pattern</Label>
                      <Input
                        value={formData.spread_pattern}
                        onChange={(e) => handleChange('spread_pattern', e.target.value)}
                        placeholder="e.g., Radial, Linear, Focal"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Estimated Economic Loss (₹)</Label>
                    <Input
                      type="number"
                      value={formData.economic_loss_estimate}
                      onChange={(e) => handleChange('economic_loss_estimate', e.target.value)}
                      placeholder="Estimated total loss"
                    />
                  </div>
                </TabsContent>

                {/* Tab 3: Control Measures */}
                <TabsContent value="control" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Control Measures Taken *</Label>
                    <Textarea
                      value={formData.control_measures}
                      onChange={(e) => handleChange('control_measures', e.target.value)}
                      placeholder="Describe all control measures implemented..."
                      rows={3}
                      data-testid="outbreak-control"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="vaccination_done" 
                          checked={formData.vaccination_done}
                          onCheckedChange={(checked) => handleChange('vaccination_done', checked)}
                        />
                        <Label htmlFor="vaccination_done" className="cursor-pointer">Vaccination Done</Label>
                      </div>
                      {formData.vaccination_done && (
                        <div className="space-y-2 pl-6">
                          <Label>Vaccinated Count</Label>
                          <Input
                            type="number"
                            value={formData.vaccination_count}
                            onChange={(e) => handleChange('vaccination_count', e.target.value)}
                            placeholder="Animals vaccinated"
                          />
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="ring_vaccination" 
                          checked={formData.ring_vaccination}
                          onCheckedChange={(checked) => handleChange('ring_vaccination', checked)}
                        />
                        <Label htmlFor="ring_vaccination" className="cursor-pointer">Ring Vaccination Done</Label>
                      </div>
                    </div>

                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="quarantine_imposed" 
                          checked={formData.quarantine_imposed}
                          onCheckedChange={(checked) => handleChange('quarantine_imposed', checked)}
                        />
                        <Label htmlFor="quarantine_imposed" className="cursor-pointer">Quarantine Imposed</Label>
                      </div>
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
                          <Label>Lab Results</Label>
                          <Input
                            value={formData.lab_results}
                            onChange={(e) => handleChange('lab_results', e.target.value)}
                            placeholder="Lab findings"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 4: Reporting */}
                <TabsContent value="reporting" className="space-y-4 mt-4">
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <h3 className="text-sm font-medium text-amber-700 mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Government Reporting
                    </h3>
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox 
                        id="reported_to_authorities" 
                        checked={formData.reported_to_authorities}
                        onCheckedChange={(checked) => handleChange('reported_to_authorities', checked)}
                      />
                      <Label htmlFor="reported_to_authorities" className="cursor-pointer font-medium">
                        Reported to Authorities
                      </Label>
                    </div>
                    {formData.reported_to_authorities && (
                      <div className="space-y-2 pl-6">
                        <Label>Report Date</Label>
                        <Input
                          type="date"
                          value={formData.authority_report_date}
                          onChange={(e) => handleChange('authority_report_date', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Outbreak Status</Label>
                      <Select value={formData.outbreak_status} onValueChange={(v) => handleChange('outbreak_status', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {outbreakStatusOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.outbreak_status === 'closed' && (
                      <div className="space-y-2">
                        <Label>Closure Date</Label>
                        <Input
                          type="date"
                          value={formData.closure_date}
                          onChange={(e) => handleChange('closure_date', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Textarea
                      value={formData.remarks}
                      onChange={(e) => handleChange('remarks', e.target.value)}
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <Button type="submit" className="w-full gap-2 bg-red-600 hover:bg-red-700" disabled={saving} data-testid="submit-outbreak">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Register Outbreak
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
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Outbreaks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.active}</p>
                <p className="text-xs text-slate-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.contained}</p>
                <p className="text-xs text-slate-500">Contained</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.zoonotic}</p>
                <p className="text-xs text-slate-500">Zoonotic</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-600">{stats.totalDeaths}</p>
                <p className="text-xs text-slate-500">Total Deaths</p>
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
                placeholder="Search by outbreak number, disease, or village..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="outbreak-search"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {outbreakStatusOptions.map(o => (
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
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No outbreak records found</p>
          <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
            Report First Outbreak
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((r) => (
            <Card key={r.id} className={`hover:shadow-md transition-shadow ${r.disease_nature === 'zoonotic' ? 'border-red-300 bg-red-50/30' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${r.outbreak_status === 'active' ? 'bg-red-100' : r.outbreak_status === 'contained' ? 'bg-amber-100' : 'bg-green-100'}`}>
                      <AlertTriangle className={`h-6 w-6 ${r.outbreak_status === 'active' ? 'text-red-600' : r.outbreak_status === 'contained' ? 'text-amber-600' : 'text-green-600'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{r.outbreak_number}</h3>
                        {getStatusBadge(r.outbreak_status)}
                        {getNatureBadge(r.disease_nature)}
                        {r.reported_to_authorities && (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            <FileText className="h-3 w-3 mr-1" /> Reported
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 font-medium">
                        {r.disease_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {r.village} • Affected: {r.animals_affected} • Deaths: {r.deaths} • {formatDate(r.outbreak_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right text-xs text-slate-500">
                      <p>Morbidity: {r.morbidity_rate || 0}%</p>
                      <p>Mortality: {r.mortality_rate || 0}%</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setViewRecord(r)} data-testid={`view-outbreak-${r.id}`}>
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
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Outbreak Details - {viewRecord?.outbreak_number}
            </DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Disease</Label>
                  <p className="font-medium">{viewRecord.disease_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(viewRecord.outbreak_status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Village</Label>
                  <p className="font-medium">{viewRecord.village}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Date</Label>
                  <p className="font-medium">{formatDate(viewRecord.outbreak_date)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Impact Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-3 rounded">
                    <p className="text-xs text-slate-500">Total Susceptible</p>
                    <p className="text-xl font-bold">{viewRecord.total_susceptible}</p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded">
                    <p className="text-xs text-slate-500">Affected</p>
                    <p className="text-xl font-bold text-amber-600">{viewRecord.animals_affected}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-slate-500">Treated</p>
                    <p className="text-xl font-bold text-green-600">{viewRecord.animals_treated}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <p className="text-xs text-slate-500">Deaths</p>
                    <p className="text-xl font-bold text-red-600">{viewRecord.deaths}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Control Measures</h4>
                <p className="text-sm bg-slate-50 p-3 rounded">{viewRecord.control_measures}</p>
                <div className="flex gap-4 mt-3">
                  {viewRecord.vaccination_done && <Badge className="bg-blue-100 text-blue-700">Vaccination Done ({viewRecord.vaccination_count || 0})</Badge>}
                  {viewRecord.ring_vaccination && <Badge className="bg-purple-100 text-purple-700">Ring Vaccination</Badge>}
                  {viewRecord.quarantine_imposed && <Badge className="bg-orange-100 text-orange-700">Quarantine</Badge>}
                  {viewRecord.samples_collected && <Badge className="bg-cyan-100 text-cyan-700">Samples Collected</Badge>}
                </div>
              </div>

              {viewRecord.reported_to_authorities && (
                <div className="border-t pt-4 bg-green-50 p-3 rounded">
                  <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Government Report
                  </h4>
                  <p className="text-sm">Reported on: {formatDate(viewRecord.authority_report_date)}</p>
                </div>
              )}

              <div className="text-xs text-slate-400 text-right border-t pt-4">
                Reported by: {viewRecord.vet_name}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OutbreakRegister;
