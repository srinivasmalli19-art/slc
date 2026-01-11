import React, { useState, useEffect } from 'react';
import { 
  Plus, Loader2, Heart, Search, Filter, Calendar,
  Eye, Edit2, CheckCircle2, AlertTriangle, Baby
} from 'lucide-react';
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
import { formatDate, speciesDisplayNames } from '@/lib/utils';

const conditionTypes = [
  { value: 'repeat_breeder', label: 'Repeat Breeder' },
  { value: 'anoestrus', label: 'Anoestrus (Silent Heat)' },
  { value: 'metritis', label: 'Metritis' },
  { value: 'pyometra', label: 'Pyometra' },
  { value: 'retained_placenta', label: 'Retained Placenta' },
  { value: 'dystocia', label: 'Dystocia (Difficult Birth)' },
  { value: 'prolapse_uterus', label: 'Uterine Prolapse' },
  { value: 'prolapse_vagina', label: 'Vaginal Prolapse' },
  { value: 'ovarian_cyst', label: 'Ovarian Cyst' },
  { value: 'mastitis', label: 'Mastitis' },
  { value: 'pregnancy_diagnosis', label: 'Pregnancy Diagnosis' },
  { value: 'abortion', label: 'Abortion' },
  { value: 'other', label: 'Other' },
];

const resultOptions = [
  { value: 'ongoing', label: 'Ongoing Treatment', color: 'bg-blue-100 text-blue-700' },
  { value: 'recovered', label: 'Recovered', color: 'bg-green-100 text-green-700' },
  { value: 'pregnant', label: 'Confirmed Pregnant', color: 'bg-pink-100 text-pink-700' },
  { value: 'not_pregnant', label: 'Not Pregnant', color: 'bg-amber-100 text-amber-700' },
  { value: 'referred', label: 'Referred', color: 'bg-purple-100 text-purple-700' },
  { value: 'followup', label: 'Follow-up Required', color: 'bg-amber-100 text-amber-700' },
  { value: 'died', label: 'Died', color: 'bg-red-100 text-red-700' },
  { value: 'culled', label: 'Culled', color: 'bg-red-100 text-red-700' },
];

const speciesOptions = Object.entries(speciesDisplayNames).filter(
  ([key]) => ['cattle', 'buffalo', 'sheep', 'goat', 'pig', 'horse', 'donkey'].includes(key)
);

const GynaecologyRegister = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterCondition, setFilterCondition] = useState('all');
  const [viewCase, setViewCase] = useState(null);
  
  const [newCase, setNewCase] = useState({
    tag_number: '',
    farmer_name: '',
    farmer_village: '',
    farmer_phone: '',
    species: '',
    breed: '',
    age_months: '',
    parity: '',
    last_calving_date: '',
    breeding_history: '',
    condition: '',
    condition_other: '',
    symptoms: '',
    per_rectal_findings: '',
    diagnosis: '',
    treatment: '',
    prognosis: '',
    follow_up_date: '',
    result: 'ongoing',
    remarks: '',
  });

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await api.get('/vet/gynaecology');
      setCases(response.data);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
      toast.error('Failed to load gynaecology cases');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCase.tag_number || !newCase.farmer_name || !newCase.species || 
        !newCase.condition || !newCase.symptoms || !newCase.diagnosis || !newCase.treatment) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...newCase,
        age_months: newCase.age_months ? parseInt(newCase.age_months) : null,
        parity: newCase.parity ? parseInt(newCase.parity) : null,
      };
      await api.post('/vet/gynaecology', payload);
      toast.success('Gynaecology case registered successfully!');
      setDialogOpen(false);
      resetForm();
      fetchCases();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to register case');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setNewCase({
      tag_number: '',
      farmer_name: '',
      farmer_village: '',
      farmer_phone: '',
      species: '',
      breed: '',
      age_months: '',
      parity: '',
      last_calving_date: '',
      breeding_history: '',
      condition: '',
      condition_other: '',
      symptoms: '',
      per_rectal_findings: '',
      diagnosis: '',
      treatment: '',
      prognosis: '',
      follow_up_date: '',
      result: 'ongoing',
      remarks: '',
    });
  };

  const handleChange = (field, value) => {
    setNewCase(prev => ({ ...prev, [field]: value }));
  };

  const getResultBadge = (result) => {
    const option = resultOptions.find(o => o.value === result);
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : (
      <Badge variant="outline">{result}</Badge>
    );
  };

  const getConditionLabel = (condition) => {
    const cond = conditionTypes.find(c => c.value === condition);
    return cond ? cond.label : condition;
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tag_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = filterSpecies === 'all' || c.species === filterSpecies;
    const matchesCondition = filterCondition === 'all' || c.condition === filterCondition;
    return matchesSearch && matchesSpecies && matchesCondition;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Gynaecology Register
          </h1>
          <p className="text-slate-500 text-sm">Reproductive health and breeding records</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-pink-600 hover:bg-pink-700" data-testid="new-gyn-case-btn">
              <Plus className="h-4 w-4" />
              New Case Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-600" />
                New Gynaecology Case Entry
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Patient & Owner Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Tag/ID Number *</Label>
                  <Input
                    value={newCase.tag_number}
                    onChange={(e) => handleChange('tag_number', e.target.value)}
                    placeholder="e.g., TG-001"
                    data-testid="gyn-tag-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Farmer Name *</Label>
                  <Input
                    value={newCase.farmer_name}
                    onChange={(e) => handleChange('farmer_name', e.target.value)}
                    placeholder="Owner name"
                    data-testid="gyn-farmer-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Village</Label>
                  <Input
                    value={newCase.farmer_village}
                    onChange={(e) => handleChange('farmer_village', e.target.value)}
                    placeholder="Village name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={newCase.farmer_phone}
                    onChange={(e) => handleChange('farmer_phone', e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              {/* Animal Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Species *</Label>
                  <Select value={newCase.species} onValueChange={(v) => handleChange('species', v)}>
                    <SelectTrigger data-testid="gyn-species-select">
                      <SelectValue placeholder="Select species" />
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
                    value={newCase.breed}
                    onChange={(e) => handleChange('breed', e.target.value)}
                    placeholder="Breed"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Age (months)</Label>
                  <Input
                    type="number"
                    value={newCase.age_months}
                    onChange={(e) => handleChange('age_months', e.target.value)}
                    placeholder="Age in months"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parity (No. of Calvings)</Label>
                  <Input
                    type="number"
                    value={newCase.parity}
                    onChange={(e) => handleChange('parity', e.target.value)}
                    placeholder="0, 1, 2..."
                  />
                </div>
              </div>

              {/* Reproductive History */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Last Calving Date</Label>
                  <Input
                    type="date"
                    value={newCase.last_calving_date}
                    onChange={(e) => handleChange('last_calving_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Breeding History</Label>
                  <Input
                    value={newCase.breeding_history}
                    onChange={(e) => handleChange('breeding_history', e.target.value)}
                    placeholder="e.g., 3 AI attempts, no conception"
                  />
                </div>
              </div>

              {/* Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condition/Problem *</Label>
                  <Select value={newCase.condition} onValueChange={(v) => handleChange('condition', v)}>
                    <SelectTrigger data-testid="gyn-condition-select">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionTypes.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newCase.condition === 'other' && (
                  <div className="space-y-2">
                    <Label>Specify Condition</Label>
                    <Input
                      value={newCase.condition_other}
                      onChange={(e) => handleChange('condition_other', e.target.value)}
                      placeholder="Specify other condition"
                    />
                  </div>
                )}
              </div>

              {/* Clinical Findings */}
              <div className="space-y-2">
                <Label>Symptoms/History *</Label>
                <Textarea
                  value={newCase.symptoms}
                  onChange={(e) => handleChange('symptoms', e.target.value)}
                  placeholder="Describe symptoms and presenting history..."
                  rows={2}
                  data-testid="gyn-symptoms"
                />
              </div>

              <div className="space-y-2">
                <Label>Per-Rectal Findings</Label>
                <Textarea
                  value={newCase.per_rectal_findings}
                  onChange={(e) => handleChange('per_rectal_findings', e.target.value)}
                  placeholder="Uterine tone, ovarian status, CL presence, follicle size..."
                  rows={2}
                />
              </div>

              {/* Diagnosis & Treatment */}
              <div className="space-y-2">
                <Label>Diagnosis *</Label>
                <Textarea
                  value={newCase.diagnosis}
                  onChange={(e) => handleChange('diagnosis', e.target.value)}
                  placeholder="Clinical diagnosis..."
                  rows={2}
                  data-testid="gyn-diagnosis"
                />
              </div>

              <div className="space-y-2">
                <Label>Treatment *</Label>
                <Textarea
                  value={newCase.treatment}
                  onChange={(e) => handleChange('treatment', e.target.value)}
                  placeholder="Treatment protocol..."
                  rows={2}
                  data-testid="gyn-treatment"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prognosis</Label>
                  <Input
                    value={newCase.prognosis}
                    onChange={(e) => handleChange('prognosis', e.target.value)}
                    placeholder="e.g., Good, Guarded, Poor"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Follow-up Date</Label>
                  <Input
                    type="date"
                    value={newCase.follow_up_date}
                    onChange={(e) => handleChange('follow_up_date', e.target.value)}
                  />
                </div>
              </div>

              {/* Result */}
              <div className="space-y-2">
                <Label>Result *</Label>
                <Select value={newCase.result} onValueChange={(v) => handleChange('result', v)}>
                  <SelectTrigger data-testid="gyn-result-select">
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    {resultOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={newCase.remarks}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full gap-2 bg-pink-600 hover:bg-pink-700" disabled={saving} data-testid="submit-gyn-case">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Register Case
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
              <div className="p-2 bg-pink-100 rounded-lg">
                <Heart className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{cases.length}</p>
                <p className="text-xs text-slate-500">Total Cases</p>
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
                <p className="text-2xl font-bold text-green-600">
                  {cases.filter(c => c.result === 'recovered').length}
                </p>
                <p className="text-xs text-slate-500">Recovered</p>
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
                <p className="text-2xl font-bold text-pink-600">
                  {cases.filter(c => c.result === 'pregnant').length}
                </p>
                <p className="text-xs text-slate-500">Pregnant</p>
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
                <p className="text-2xl font-bold text-amber-600">
                  {cases.filter(c => c.result === 'ongoing' || c.result === 'followup').length}
                </p>
                <p className="text-xs text-slate-500">Ongoing</p>
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
            <Select value={filterCondition} onValueChange={setFilterCondition}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                {conditionTypes.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
        </div>
      ) : filteredCases.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No gynaecology cases found</p>
          <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
            Register First Case
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCases.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center">
                      <Heart className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{c.case_number}</h3>
                        {getResultBadge(c.result)}
                      </div>
                      <p className="text-sm text-slate-600">
                        {getConditionLabel(c.condition)} • {speciesDisplayNames[c.species] || c.species}
                      </p>
                      <p className="text-xs text-slate-500">
                        Tag: {c.tag_number} • {c.farmer_name} • {formatDate(c.case_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setViewCase(c)} data-testid={`view-gyn-${c.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Case Dialog */}
      <Dialog open={!!viewCase} onOpenChange={() => setViewCase(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-600" />
              Gynaecology Case Details - {viewCase?.case_number}
            </DialogTitle>
          </DialogHeader>
          {viewCase && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Condition</Label>
                  <p className="font-medium">{getConditionLabel(viewCase.condition)}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Result</Label>
                  <div className="mt-1">{getResultBadge(viewCase.result)}</div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Tag Number</Label>
                  <p className="font-medium">{viewCase.tag_number}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Species</Label>
                  <p className="font-medium">{speciesDisplayNames[viewCase.species]}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Farmer</Label>
                  <p className="font-medium">{viewCase.farmer_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Date</Label>
                  <p className="font-medium">{formatDate(viewCase.case_date)}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Parity</Label>
                  <p className="font-medium">{viewCase.parity || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Last Calving</Label>
                  <p className="font-medium">{viewCase.last_calving_date ? formatDate(viewCase.last_calving_date) : 'N/A'}</p>
                </div>
              </div>
              {viewCase.breeding_history && (
                <div>
                  <Label className="text-xs text-slate-500">Breeding History</Label>
                  <p className="text-sm">{viewCase.breeding_history}</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-slate-500">Symptoms</Label>
                <p className="text-sm bg-slate-50 p-2 rounded mt-1">{viewCase.symptoms}</p>
              </div>
              {viewCase.per_rectal_findings && (
                <div>
                  <Label className="text-xs text-slate-500">Per-Rectal Findings</Label>
                  <p className="text-sm bg-slate-50 p-2 rounded mt-1">{viewCase.per_rectal_findings}</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-slate-500">Diagnosis</Label>
                <p className="text-sm bg-slate-50 p-2 rounded mt-1">{viewCase.diagnosis}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Treatment</Label>
                <p className="text-sm bg-green-50 p-2 rounded mt-1">{viewCase.treatment}</p>
              </div>
              {viewCase.prognosis && (
                <div>
                  <Label className="text-xs text-slate-500">Prognosis</Label>
                  <p className="text-sm">{viewCase.prognosis}</p>
                </div>
              )}
              {viewCase.remarks && (
                <div>
                  <Label className="text-xs text-slate-500">Remarks</Label>
                  <p className="text-sm bg-slate-50 p-2 rounded mt-1">{viewCase.remarks}</p>
                </div>
              )}
              <div className="text-xs text-slate-400 text-right">
                Treated by: {viewCase.vet_name}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GynaecologyRegister;
