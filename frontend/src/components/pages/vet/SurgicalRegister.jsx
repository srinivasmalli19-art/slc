import React, { useState, useEffect } from 'react';
import { 
  Plus, Loader2, Scissors, Search, Filter, Calendar,
  Eye, Edit2, CheckCircle2, AlertTriangle, Activity
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate, speciesDisplayNames } from '@/lib/utils';

const surgeryTypes = [
  { value: 'caesarean', label: 'Caesarean Section' },
  { value: 'rumenotomy', label: 'Rumenotomy' },
  { value: 'hernia', label: 'Hernia Repair' },
  { value: 'castration_surgical', label: 'Surgical Castration' },
  { value: 'tumor_removal', label: 'Tumor Removal' },
  { value: 'dehorning', label: 'Dehorning' },
  { value: 'tail_docking', label: 'Tail Docking' },
  { value: 'wound_suturing', label: 'Wound Suturing' },
  { value: 'abscess_drainage', label: 'Abscess Drainage' },
  { value: 'fracture_repair', label: 'Fracture Repair' },
  { value: 'teat_surgery', label: 'Teat Surgery' },
  { value: 'eye_surgery', label: 'Eye Surgery' },
  { value: 'other', label: 'Other' },
];

const anesthesiaTypes = [
  { value: 'local', label: 'Local Anesthesia' },
  { value: 'regional', label: 'Regional Block' },
  { value: 'epidural', label: 'Epidural' },
  { value: 'general', label: 'General Anesthesia' },
  { value: 'sedation', label: 'Sedation Only' },
  { value: 'none', label: 'None' },
];

const outcomeOptions = [
  { value: 'successful', label: 'Successful', color: 'bg-green-100 text-green-700' },
  { value: 'partial_success', label: 'Partial Success', color: 'bg-amber-100 text-amber-700' },
  { value: 'complications', label: 'Complications', color: 'bg-orange-100 text-orange-700' },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-700' },
  { value: 'died_during', label: 'Died During Surgery', color: 'bg-red-200 text-red-800' },
  { value: 'died_post_op', label: 'Died Post-Op', color: 'bg-red-200 text-red-800' },
];

const speciesOptions = Object.entries(speciesDisplayNames);

const SurgicalRegister = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [viewCase, setViewCase] = useState(null);
  
  const [newCase, setNewCase] = useState({
    tag_number: '',
    farmer_name: '',
    farmer_village: '',
    farmer_phone: '',
    species: '',
    breed: '',
    age_months: '',
    surgery_type: '',
    surgery_type_other: '',
    pre_op_condition: '',
    anesthesia_type: 'local',
    anesthesia_details: '',
    surgical_procedure: '',
    findings: '',
    post_op_care: '',
    outcome: 'successful',
    complications: '',
    follow_up_date: '',
    remarks: '',
  });

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await api.get('/vet/surgical');
      setCases(response.data);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
      toast.error('Failed to load surgical cases');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCase.tag_number || !newCase.farmer_name || !newCase.species || 
        !newCase.surgery_type || !newCase.pre_op_condition || !newCase.surgical_procedure) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...newCase,
        age_months: newCase.age_months ? parseInt(newCase.age_months) : null,
      };
      await api.post('/vet/surgical', payload);
      toast.success('Surgical case registered successfully!');
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
      surgery_type: '',
      surgery_type_other: '',
      pre_op_condition: '',
      anesthesia_type: 'local',
      anesthesia_details: '',
      surgical_procedure: '',
      findings: '',
      post_op_care: '',
      outcome: 'successful',
      complications: '',
      follow_up_date: '',
      remarks: '',
    });
  };

  const handleChange = (field, value) => {
    setNewCase(prev => ({ ...prev, [field]: value }));
  };

  const getOutcomeBadge = (outcome) => {
    const option = outcomeOptions.find(o => o.value === outcome);
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : (
      <Badge variant="outline">{outcome}</Badge>
    );
  };

  const getSurgeryLabel = (type) => {
    const surgery = surgeryTypes.find(s => s.value === type);
    return surgery ? surgery.label : type;
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tag_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = filterSpecies === 'all' || c.species === filterSpecies;
    const matchesOutcome = filterOutcome === 'all' || c.outcome === filterOutcome;
    return matchesSearch && matchesSpecies && matchesOutcome;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Surgical Case Register
          </h1>
          <p className="text-slate-500 text-sm">Surgery records with anesthesia and outcomes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-green-600 hover:bg-green-700" data-testid="new-surgical-case-btn">
              <Plus className="h-4 w-4" />
              New Surgical Case
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5 text-green-600" />
                New Surgical Case Entry
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
                    data-testid="surgical-tag-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Farmer Name *</Label>
                  <Input
                    value={newCase.farmer_name}
                    onChange={(e) => handleChange('farmer_name', e.target.value)}
                    placeholder="Owner name"
                    data-testid="surgical-farmer-name"
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
                    <SelectTrigger data-testid="surgical-species-select">
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
              </div>

              {/* Surgery Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Surgery Type *</Label>
                  <Select value={newCase.surgery_type} onValueChange={(v) => handleChange('surgery_type', v)}>
                    <SelectTrigger data-testid="surgical-type-select">
                      <SelectValue placeholder="Select surgery type" />
                    </SelectTrigger>
                    <SelectContent>
                      {surgeryTypes.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newCase.surgery_type === 'other' && (
                  <div className="space-y-2">
                    <Label>Specify Surgery Type</Label>
                    <Input
                      value={newCase.surgery_type_other}
                      onChange={(e) => handleChange('surgery_type_other', e.target.value)}
                      placeholder="Specify other surgery"
                    />
                  </div>
                )}
              </div>

              {/* Pre-Op Condition */}
              <div className="space-y-2">
                <Label>Pre-Operative Condition *</Label>
                <Textarea
                  value={newCase.pre_op_condition}
                  onChange={(e) => handleChange('pre_op_condition', e.target.value)}
                  placeholder="Describe patient condition before surgery..."
                  rows={2}
                  data-testid="surgical-pre-op"
                />
              </div>

              {/* Anesthesia */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Anesthesia Type *</Label>
                  <Select value={newCase.anesthesia_type} onValueChange={(v) => handleChange('anesthesia_type', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select anesthesia" />
                    </SelectTrigger>
                    <SelectContent>
                      {anesthesiaTypes.map(a => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Anesthesia Details</Label>
                  <Input
                    value={newCase.anesthesia_details}
                    onChange={(e) => handleChange('anesthesia_details', e.target.value)}
                    placeholder="Drug, dose, route..."
                  />
                </div>
              </div>

              {/* Surgical Procedure */}
              <div className="space-y-2">
                <Label>Surgical Procedure *</Label>
                <Textarea
                  value={newCase.surgical_procedure}
                  onChange={(e) => handleChange('surgical_procedure', e.target.value)}
                  placeholder="Describe the surgical procedure performed..."
                  rows={3}
                  data-testid="surgical-procedure"
                />
              </div>

              {/* Findings */}
              <div className="space-y-2">
                <Label>Findings</Label>
                <Textarea
                  value={newCase.findings}
                  onChange={(e) => handleChange('findings', e.target.value)}
                  placeholder="Intra-operative findings..."
                  rows={2}
                />
              </div>

              {/* Post-Op Care */}
              <div className="space-y-2">
                <Label>Post-Operative Care</Label>
                <Textarea
                  value={newCase.post_op_care}
                  onChange={(e) => handleChange('post_op_care', e.target.value)}
                  placeholder="Post-operative care instructions..."
                  rows={2}
                />
              </div>

              {/* Outcome */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Outcome *</Label>
                  <Select value={newCase.outcome} onValueChange={(v) => handleChange('outcome', v)}>
                    <SelectTrigger data-testid="surgical-outcome-select">
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      {outcomeOptions.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              {/* Complications */}
              {(newCase.outcome === 'complications' || newCase.outcome === 'failed' || 
                newCase.outcome === 'died_during' || newCase.outcome === 'died_post_op') && (
                <div className="space-y-2">
                  <Label>Complications Details</Label>
                  <Textarea
                    value={newCase.complications}
                    onChange={(e) => handleChange('complications', e.target.value)}
                    placeholder="Describe complications..."
                    rows={2}
                  />
                </div>
              )}

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

              <Button type="submit" className="w-full gap-2 bg-green-600 hover:bg-green-700" disabled={saving} data-testid="submit-surgical-case">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Register Surgical Case
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
              <div className="p-2 bg-green-100 rounded-lg">
                <Scissors className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{cases.length}</p>
                <p className="text-xs text-slate-500">Total Surgeries</p>
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
                  {cases.filter(c => c.outcome === 'successful').length}
                </p>
                <p className="text-xs text-slate-500">Successful</p>
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
                  {cases.filter(c => c.outcome === 'complications').length}
                </p>
                <p className="text-xs text-slate-500">Complications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Activity className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {cases.filter(c => c.outcome?.includes('died')).length}
                </p>
                <p className="text-xs text-slate-500">Mortality</p>
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
            <Select value={filterOutcome} onValueChange={setFilterOutcome}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                {outcomeOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : filteredCases.length === 0 ? (
        <Card className="p-12 text-center">
          <Scissors className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No surgical cases found</p>
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
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Scissors className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{c.case_number}</h3>
                        {getOutcomeBadge(c.outcome)}
                      </div>
                      <p className="text-sm text-slate-600">
                        {getSurgeryLabel(c.surgery_type)} • {speciesDisplayNames[c.species] || c.species}
                      </p>
                      <p className="text-xs text-slate-500">
                        Tag: {c.tag_number} • {c.farmer_name} • {formatDate(c.surgery_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setViewCase(c)} data-testid={`view-surgical-${c.id}`}>
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
              <Scissors className="h-5 w-5 text-green-600" />
              Surgical Case Details - {viewCase?.case_number}
            </DialogTitle>
          </DialogHeader>
          {viewCase && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Surgery Type</Label>
                  <p className="font-medium">{getSurgeryLabel(viewCase.surgery_type)}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Outcome</Label>
                  <div className="mt-1">{getOutcomeBadge(viewCase.outcome)}</div>
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
                  <p className="font-medium">{formatDate(viewCase.surgery_date)}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Pre-Operative Condition</Label>
                <p className="text-sm bg-slate-50 p-2 rounded mt-1">{viewCase.pre_op_condition}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Anesthesia</Label>
                  <p className="font-medium">
                    {anesthesiaTypes.find(a => a.value === viewCase.anesthesia_type)?.label}
                    {viewCase.anesthesia_details && ` - ${viewCase.anesthesia_details}`}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Surgical Procedure</Label>
                <p className="text-sm bg-slate-50 p-2 rounded mt-1">{viewCase.surgical_procedure}</p>
              </div>
              {viewCase.findings && (
                <div>
                  <Label className="text-xs text-slate-500">Findings</Label>
                  <p className="text-sm bg-slate-50 p-2 rounded mt-1">{viewCase.findings}</p>
                </div>
              )}
              {viewCase.post_op_care && (
                <div>
                  <Label className="text-xs text-slate-500">Post-Op Care</Label>
                  <p className="text-sm bg-slate-50 p-2 rounded mt-1">{viewCase.post_op_care}</p>
                </div>
              )}
              {viewCase.complications && (
                <div>
                  <Label className="text-xs text-slate-500">Complications</Label>
                  <p className="text-sm bg-red-50 p-2 rounded mt-1 text-red-700">{viewCase.complications}</p>
                </div>
              )}
              {viewCase.remarks && (
                <div>
                  <Label className="text-xs text-slate-500">Remarks</Label>
                  <p className="text-sm bg-slate-50 p-2 rounded mt-1">{viewCase.remarks}</p>
                </div>
              )}
              <div className="text-xs text-slate-400 text-right">
                Performed by: {viewCase.vet_name}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SurgicalRegister;
