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
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate, speciesDisplayNames } from '@/lib/utils';

const castrationMethods = [
  { value: 'surgical_open', label: 'Open Surgical Method' },
  { value: 'surgical_closed', label: 'Closed Surgical Method' },
  { value: 'burdizzo', label: 'Burdizzo (Bloodless)' },
  { value: 'rubber_ring', label: 'Rubber Ring/Elastrator' },
  { value: 'chemical', label: 'Chemical Castration' },
];

const anesthesiaOptions = [
  { value: 'local', label: 'Local Infiltration' },
  { value: 'epidural', label: 'Epidural' },
  { value: 'sedation', label: 'Sedation Only' },
  { value: 'general', label: 'General Anesthesia' },
  { value: 'none', label: 'None' },
];

const outcomeOptions = [
  { value: 'successful', label: 'Successful', color: 'bg-green-100 text-green-700' },
  { value: 'partial', label: 'Partial (One Testicle)', color: 'bg-amber-100 text-amber-700' },
  { value: 'complications', label: 'Complications', color: 'bg-orange-100 text-orange-700' },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-700' },
  { value: 'died', label: 'Died', color: 'bg-red-200 text-red-800' },
];

// Species commonly castrated
const speciesOptions = Object.entries(speciesDisplayNames).filter(
  ([key]) => ['cattle', 'buffalo', 'sheep', 'goat', 'pig', 'horse', 'donkey', 'dog', 'cat'].includes(key)
);

const CastrationRegister = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [viewCase, setViewCase] = useState(null);
  
  const [newCase, setNewCase] = useState({
    tag_number: '',
    farmer_name: '',
    farmer_village: '',
    farmer_phone: '',
    species: '',
    breed: '',
    age_months: '',
    body_weight_kg: '',
    method: '',
    anesthesia_used: 'local',
    anesthesia_details: '',
    procedure_details: '',
    outcome: 'successful',
    complications: '',
    post_op_care: '',
    follow_up_date: '',
    remarks: '',
  });

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await api.get('/vet/castration');
      setCases(response.data);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
      toast.error('Failed to load castration cases');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCase.tag_number || !newCase.farmer_name || !newCase.species || !newCase.method) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...newCase,
        age_months: newCase.age_months ? parseInt(newCase.age_months) : null,
        body_weight_kg: newCase.body_weight_kg ? parseFloat(newCase.body_weight_kg) : null,
      };
      await api.post('/vet/castration', payload);
      toast.success('Castration case registered successfully!');
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
      body_weight_kg: '',
      method: '',
      anesthesia_used: 'local',
      anesthesia_details: '',
      procedure_details: '',
      outcome: 'successful',
      complications: '',
      post_op_care: '',
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

  const getMethodLabel = (method) => {
    const m = castrationMethods.find(c => c.value === method);
    return m ? m.label : method;
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tag_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = filterSpecies === 'all' || c.species === filterSpecies;
    const matchesMethod = filterMethod === 'all' || c.method === filterMethod;
    return matchesSearch && matchesSpecies && matchesMethod;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Castration Register
          </h1>
          <p className="text-slate-500 text-sm">Castration procedures and outcomes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" data-testid="new-castration-case-btn">
              <Plus className="h-4 w-4" />
              New Castration Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5 text-indigo-600" />
                New Castration Case Entry
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
                    data-testid="cast-tag-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Farmer Name *</Label>
                  <Input
                    value={newCase.farmer_name}
                    onChange={(e) => handleChange('farmer_name', e.target.value)}
                    placeholder="Owner name"
                    data-testid="cast-farmer-name"
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
                    <SelectTrigger data-testid="cast-species-select">
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
                  <Label>Body Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newCase.body_weight_kg}
                    onChange={(e) => handleChange('body_weight_kg', e.target.value)}
                    placeholder="Weight in kg"
                  />
                </div>
              </div>

              {/* Castration Method */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Castration Method *</Label>
                  <Select value={newCase.method} onValueChange={(v) => handleChange('method', v)}>
                    <SelectTrigger data-testid="cast-method-select">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {castrationMethods.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Anesthesia Used</Label>
                  <Select value={newCase.anesthesia_used} onValueChange={(v) => handleChange('anesthesia_used', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select anesthesia" />
                    </SelectTrigger>
                    <SelectContent>
                      {anesthesiaOptions.map(a => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Anesthesia Details */}
              {newCase.anesthesia_used !== 'none' && (
                <div className="space-y-2">
                  <Label>Anesthesia Details</Label>
                  <Input
                    value={newCase.anesthesia_details}
                    onChange={(e) => handleChange('anesthesia_details', e.target.value)}
                    placeholder="Drug name, dose, route..."
                  />
                </div>
              )}

              {/* Procedure Details */}
              <div className="space-y-2">
                <Label>Procedure Details</Label>
                <Textarea
                  value={newCase.procedure_details}
                  onChange={(e) => handleChange('procedure_details', e.target.value)}
                  placeholder="Describe the procedure performed..."
                  rows={2}
                />
              </div>

              {/* Outcome */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Outcome *</Label>
                  <Select value={newCase.outcome} onValueChange={(v) => handleChange('outcome', v)}>
                    <SelectTrigger data-testid="cast-outcome-select">
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
              {(newCase.outcome === 'complications' || newCase.outcome === 'failed' || newCase.outcome === 'died') && (
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

              <Button type="submit" className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700" disabled={saving} data-testid="submit-castration-case">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Register Castration
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
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Scissors className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{cases.length}</p>
                <p className="text-xs text-slate-500">Total Castrations</p>
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
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {cases.filter(c => c.method === 'burdizzo').length}
                </p>
                <p className="text-xs text-slate-500">Bloodless</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Scissors className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {cases.filter(c => c.method?.includes('surgical')).length}
                </p>
                <p className="text-xs text-slate-500">Surgical</p>
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
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {castrationMethods.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredCases.length === 0 ? (
        <Card className="p-12 text-center">
          <Scissors className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No castration cases found</p>
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
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Scissors className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{c.case_number}</h3>
                        {getOutcomeBadge(c.outcome)}
                      </div>
                      <p className="text-sm text-slate-600">
                        {getMethodLabel(c.method)} • {speciesDisplayNames[c.species] || c.species}
                      </p>
                      <p className="text-xs text-slate-500">
                        Tag: {c.tag_number} • {c.farmer_name} • {formatDate(c.castration_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setViewCase(c)} data-testid={`view-cast-${c.id}`}>
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
              <Scissors className="h-5 w-5 text-indigo-600" />
              Castration Case Details - {viewCase?.case_number}
            </DialogTitle>
          </DialogHeader>
          {viewCase && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Method</Label>
                  <p className="font-medium">{getMethodLabel(viewCase.method)}</p>
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
                  <p className="font-medium">{formatDate(viewCase.castration_date)}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Age (months)</Label>
                  <p className="font-medium">{viewCase.age_months || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Body Weight</Label>
                  <p className="font-medium">{viewCase.body_weight_kg ? `${viewCase.body_weight_kg} kg` : 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Anesthesia</Label>
                <p className="font-medium">
                  {anesthesiaOptions.find(a => a.value === viewCase.anesthesia_used)?.label || viewCase.anesthesia_used}
                  {viewCase.anesthesia_details && ` - ${viewCase.anesthesia_details}`}
                </p>
              </div>
              {viewCase.procedure_details && (
                <div>
                  <Label className="text-xs text-slate-500">Procedure Details</Label>
                  <p className="text-sm bg-slate-50 p-2 rounded mt-1">{viewCase.procedure_details}</p>
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

export default CastrationRegister;
