import React, { useState, useEffect } from 'react';
import { 
  Plus, Loader2, Search, Filter, Eye, CheckCircle2, 
  Syringe, Calendar, AlertTriangle, Users
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate, speciesDisplayNames } from '@/lib/utils';

const speciesOptions = Object.entries(speciesDisplayNames);

const largeAnimalVaccines = [
  { value: 'fmd', label: 'FMD (Foot & Mouth Disease)' },
  { value: 'hs', label: 'HS (Haemorrhagic Septicaemia)' },
  { value: 'bq', label: 'BQ (Black Quarter)' },
  { value: 'brucella', label: 'Brucellosis (S19/RB51)' },
  { value: 'anthrax', label: 'Anthrax' },
  { value: 'theileriosis', label: 'Theileriosis' },
  { value: 'rabies', label: 'Rabies (Pre-exposure)' },
  { value: 'lsd', label: 'LSD (Lumpy Skin Disease)' },
  { value: 'ppr', label: 'PPR (Small Ruminants)' },
  { value: 'enterotoxemia', label: 'Enterotoxemia' },
  { value: 'goat_pox', label: 'Goat Pox' },
  { value: 'sheep_pox', label: 'Sheep Pox' },
  { value: 'ccpp', label: 'CCPP' },
  { value: 'other', label: 'Other' },
];

const smallAnimalVaccines = [
  { value: 'ranikhet', label: 'Ranikhet (RD/F1)' },
  { value: 'infectious_bronchitis', label: 'Infectious Bronchitis' },
  { value: 'fowl_pox', label: 'Fowl Pox' },
  { value: 'marek', label: "Marek's Disease" },
  { value: 'ibd', label: 'IBD (Gumboro)' },
  { value: 'avian_influenza', label: 'Avian Influenza' },
  { value: 'duck_plague', label: 'Duck Plague' },
  { value: 'rabies_pet', label: 'Rabies (Dogs/Cats)' },
  { value: 'dhpp', label: 'DHPP (Dogs)' },
  { value: 'parvo', label: 'Parvovirus' },
  { value: 'fvrcp', label: 'FVRCP (Cats)' },
  { value: 'swine_fever', label: 'Classical Swine Fever' },
  { value: 'other', label: 'Other' },
];

const routeOptions = [
  { value: 'subcutaneous', label: 'Subcutaneous (S/C)' },
  { value: 'intramuscular', label: 'Intramuscular (I/M)' },
  { value: 'intradermal', label: 'Intradermal (I/D)' },
  { value: 'oral', label: 'Oral' },
  { value: 'intranasal', label: 'Intranasal' },
  { value: 'intravenous', label: 'Intravenous (I/V)' },
  { value: 'eye_drop', label: 'Eye Drop' },
  { value: 'drinking_water', label: 'Drinking Water' },
];

const VaccinationRegister = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterAnimalType, setFilterAnimalType] = useState('all');
  const [viewRecord, setViewRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('large');
  
  const initialFormState = {
    animal_type: 'large',
    tag_number: '',
    farmer_name: '',
    farmer_id: '',
    farmer_village: '',
    farmer_phone: '',
    species: 'cattle',
    breed: '',
    age_months: '',
    vaccine_name: '',
    batch_number: '',
    manufacturer: '',
    dose_rate: '',
    dose_given: '',
    route: 'intramuscular',
    vaccination_date: new Date().toISOString().split('T')[0],
    next_due_date: '',
    flock_size: '',
    animals_vaccinated: '1',
    adverse_reaction: '',
    remarks: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await api.get('/vet/vaccination');
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch vaccination records:', error);
      toast.error('Failed to load vaccination records');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.tag_number.trim()) errors.push('Tag Number is required');
    if (!formData.farmer_name.trim()) errors.push('Farmer Name is required');
    if (!formData.farmer_village.trim()) errors.push('Village is required');
    if (!formData.vaccine_name) errors.push('Vaccine Name is required');
    if (!formData.dose_rate.trim()) errors.push('Dose Rate is required');
    if (formData.farmer_phone && !/^\d{10}$/.test(formData.farmer_phone)) {
      errors.push('Phone must be 10 digits');
    }
    if (formData.animal_type === 'small' && !formData.flock_size) {
      errors.push('Flock Size is required for small animals');
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
        flock_size: formData.flock_size ? parseInt(formData.flock_size) : null,
        animals_vaccinated: formData.animals_vaccinated ? parseInt(formData.animals_vaccinated) : 1,
      };

      await api.post('/vet/vaccination', payload);
      toast.success('Vaccination record created successfully!');
      
      setDialogOpen(false);
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create vaccination record');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setActiveTab('large');
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAnimalTypeChange = (type) => {
    setActiveTab(type);
    handleChange('animal_type', type);
    // Set default species based on animal type
    if (type === 'large') {
      handleChange('species', 'cattle');
    } else {
      handleChange('species', 'poultry');
    }
    handleChange('vaccine_name', '');
  };

  const getVaccineLabel = (vaccine, type) => {
    const vaccines = type === 'large' ? largeAnimalVaccines : smallAnimalVaccines;
    const found = vaccines.find(v => v.value === vaccine);
    return found ? found.label : vaccine;
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tag_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.vaccine_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = filterSpecies === 'all' || r.species === filterSpecies;
    const matchesType = filterAnimalType === 'all' || r.animal_type === filterAnimalType;
    return matchesSearch && matchesSpecies && matchesType;
  });

  // Stats calculations
  const stats = {
    total: records.length,
    large: records.filter(r => r.animal_type === 'large').length,
    small: records.filter(r => r.animal_type === 'small').length,
    thisMonth: records.filter(r => {
      const date = new Date(r.vaccination_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
    totalAnimals: records.reduce((sum, r) => sum + (r.animals_vaccinated || 1), 0),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Vaccination Register
          </h1>
          <p className="text-slate-500 text-sm">Large & Small Animal Vaccination Records</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700" data-testid="new-vaccination-btn">
              <Plus className="h-4 w-4" />
              New Vaccination
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Syringe className="h-5 w-5 text-blue-600" />
                New Vaccination Record
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Animal Type Tabs */}
              <Tabs value={activeTab} onValueChange={handleAnimalTypeChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="large">Large Animals</TabsTrigger>
                  <TabsTrigger value="small">Small Animals / Poultry</TabsTrigger>
                </TabsList>

                {/* Large Animals Tab */}
                <TabsContent value="large" className="space-y-4 mt-4">
                  <p className="text-sm text-slate-500">
                    For Cattle, Buffalo, Sheep, Goat, Horse, Donkey, Camel, Pig
                  </p>
                </TabsContent>

                {/* Small Animals Tab */}
                <TabsContent value="small" className="space-y-4 mt-4">
                  <p className="text-sm text-slate-500">
                    For Poultry, Dogs, Cats, and other small animals
                  </p>
                </TabsContent>
              </Tabs>

              {/* Patient & Owner Info */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Patient & Owner Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Tag/ID Number *</Label>
                    <Input
                      value={formData.tag_number}
                      onChange={(e) => handleChange('tag_number', e.target.value)}
                      placeholder={activeTab === 'small' ? "Shed/Flock ID" : "e.g., TG-001"}
                      data-testid="vacc-tag-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Farmer Name *</Label>
                    <Input
                      value={formData.farmer_name}
                      onChange={(e) => handleChange('farmer_name', e.target.value)}
                      placeholder="Owner name"
                      data-testid="vacc-farmer-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Village *</Label>
                    <Input
                      value={formData.farmer_village}
                      onChange={(e) => handleChange('farmer_village', e.target.value)}
                      placeholder="Village name"
                      data-testid="vacc-village"
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
                      <SelectTrigger data-testid="vacc-species">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {speciesOptions
                          .filter(([key]) => {
                            if (activeTab === 'large') {
                              return ['cattle', 'buffalo', 'sheep', 'goat', 'pig', 'horse', 'donkey', 'camel'].includes(key);
                            }
                            return ['poultry', 'dog', 'cat', 'pig'].includes(key);
                          })
                          .map(([value, label]) => (
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
                  {activeTab === 'large' ? (
                    <>
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
                        <Label>Animals Vaccinated</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.animals_vaccinated}
                          onChange={(e) => handleChange('animals_vaccinated', e.target.value)}
                          placeholder="Count"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Flock/Batch Size *</Label>
                        <Input
                          type="number"
                          value={formData.flock_size}
                          onChange={(e) => handleChange('flock_size', e.target.value)}
                          placeholder="Total flock size"
                          data-testid="vacc-flock-size"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Birds/Animals Vaccinated</Label>
                        <Input
                          type="number"
                          value={formData.animals_vaccinated}
                          onChange={(e) => handleChange('animals_vaccinated', e.target.value)}
                          placeholder="Count vaccinated"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Vaccine Details */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Vaccine Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Vaccine Name *</Label>
                    <Select value={formData.vaccine_name} onValueChange={(v) => handleChange('vaccine_name', v)}>
                      <SelectTrigger data-testid="vacc-vaccine">
                        <SelectValue placeholder="Select vaccine" />
                      </SelectTrigger>
                      <SelectContent>
                        {(activeTab === 'large' ? largeAnimalVaccines : smallAnimalVaccines).map(v => (
                          <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Batch Number</Label>
                    <Input
                      value={formData.batch_number}
                      onChange={(e) => handleChange('batch_number', e.target.value)}
                      placeholder="Vaccine batch"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Manufacturer</Label>
                    <Input
                      value={formData.manufacturer}
                      onChange={(e) => handleChange('manufacturer', e.target.value)}
                      placeholder="Company name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Dose Rate *</Label>
                    <Input
                      value={formData.dose_rate}
                      onChange={(e) => handleChange('dose_rate', e.target.value)}
                      placeholder="e.g., 2 ml/animal"
                      data-testid="vacc-dose-rate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dose Given</Label>
                    <Input
                      value={formData.dose_given}
                      onChange={(e) => handleChange('dose_given', e.target.value)}
                      placeholder="e.g., 2 ml"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
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
                </div>
              </div>

              {/* Dates */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Schedule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vaccination Date *</Label>
                    <Input
                      type="date"
                      value={formData.vaccination_date}
                      onChange={(e) => handleChange('vaccination_date', e.target.value)}
                      data-testid="vacc-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Next Due Date (Booster)</Label>
                    <Input
                      type="date"
                      value={formData.next_due_date}
                      onChange={(e) => handleChange('next_due_date', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Adverse Reaction & Remarks */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Adverse Reaction (if any)
                  </Label>
                  <Textarea
                    value={formData.adverse_reaction}
                    onChange={(e) => handleChange('adverse_reaction', e.target.value)}
                    placeholder="Describe any adverse reaction observed..."
                    rows={2}
                    className="border-amber-200 focus:border-amber-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea
                    value={formData.remarks}
                    onChange={(e) => handleChange('remarks', e.target.value)}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full gap-2 bg-blue-600 hover:bg-blue-700" disabled={saving} data-testid="submit-vaccination">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Register Vaccination
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
              <div className="p-2 bg-blue-100 rounded-lg">
                <Syringe className="h-5 w-5 text-blue-600" />
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
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.totalAnimals}</p>
                <p className="text-xs text-slate-500">Animals Vaccinated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Syringe className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-600">{stats.large}</p>
                <p className="text-xs text-slate-500">Large Animals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Syringe className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.small}</p>
                <p className="text-xs text-slate-500">Small Animals</p>
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
                placeholder="Search by case number, tag, farmer, or vaccine..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="vacc-search"
              />
            </div>
            <Select value={filterAnimalType} onValueChange={setFilterAnimalType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Animal Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="large">Large Animals</SelectItem>
                <SelectItem value="small">Small Animals</SelectItem>
              </SelectContent>
            </Select>
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
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card className="p-12 text-center">
          <Syringe className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No vaccination records found</p>
          <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
            Create First Record
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((r) => (
            <Card key={r.id} className={`hover:shadow-md transition-shadow ${r.adverse_reaction ? 'border-amber-200 bg-amber-50/30' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${r.animal_type === 'large' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                      <Syringe className={`h-6 w-6 ${r.animal_type === 'large' ? 'text-blue-600' : 'text-purple-600'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{r.case_number}</h3>
                        <Badge variant="outline" className={r.animal_type === 'large' ? 'border-blue-200 text-blue-700' : 'border-purple-200 text-purple-700'}>
                          {r.animal_type === 'large' ? 'Large' : 'Small'}
                        </Badge>
                        {r.adverse_reaction && (
                          <Badge className="bg-amber-100 text-amber-700">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Reaction
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        {getVaccineLabel(r.vaccine_name, r.animal_type)} • {speciesDisplayNames[r.species] || r.species}
                        {r.animals_vaccinated > 1 && ` • ${r.animals_vaccinated} animals`}
                      </p>
                      <p className="text-xs text-slate-500">
                        Tag: {r.tag_number} • {r.farmer_name} • {formatDate(r.vaccination_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {r.next_due_date && (
                      <p className="text-xs text-slate-500">
                        Booster: {formatDate(r.next_due_date)}
                      </p>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setViewRecord(r)} data-testid={`view-vacc-${r.id}`}>
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
              <Syringe className="h-5 w-5 text-blue-600" />
              Vaccination Details - {viewRecord?.case_number}
            </DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Animal Type</Label>
                  <p className="font-medium capitalize">{viewRecord.animal_type} Animal</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Species</Label>
                  <p className="font-medium">{speciesDisplayNames[viewRecord.species]}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Tag Number</Label>
                  <p className="font-medium">{viewRecord.tag_number}</p>
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
                <h4 className="text-sm font-medium text-slate-700 mb-2">Vaccine Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label className="text-xs text-slate-500">Vaccine</Label>
                    <p className="font-medium">{getVaccineLabel(viewRecord.vaccine_name, viewRecord.animal_type)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Batch No.</Label>
                    <p className="font-medium">{viewRecord.batch_number || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Manufacturer</Label>
                    <p className="font-medium">{viewRecord.manufacturer || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Dose Rate</Label>
                    <p className="font-medium">{viewRecord.dose_rate}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Route</Label>
                    <p className="font-medium capitalize">{viewRecord.route?.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Schedule & Coverage</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">Vaccination Date</Label>
                    <p className="font-medium">{formatDate(viewRecord.vaccination_date)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Next Due (Booster)</Label>
                    <p className="font-medium">{viewRecord.next_due_date ? formatDate(viewRecord.next_due_date) : 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Animals Vaccinated</Label>
                    <p className="font-medium">{viewRecord.animals_vaccinated || 1}</p>
                  </div>
                  {viewRecord.flock_size && (
                    <div>
                      <Label className="text-xs text-slate-500">Flock Size</Label>
                      <p className="font-medium">{viewRecord.flock_size}</p>
                    </div>
                  )}
                </div>
              </div>

              {viewRecord.adverse_reaction && (
                <div className="border-t pt-4 bg-amber-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Adverse Reaction
                  </h4>
                  <p className="text-sm">{viewRecord.adverse_reaction}</p>
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
                {viewRecord.institution_name && ` • ${viewRecord.institution_name}`}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VaccinationRegister;
