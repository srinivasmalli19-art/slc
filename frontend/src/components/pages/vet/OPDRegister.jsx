import React, { useState, useEffect } from 'react';
import { 
  Plus, Loader2, ClipboardList, Search, Filter, Calendar,
  Eye, Edit2, ChevronRight, AlertTriangle, CheckCircle2
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
import { formatDate, speciesDisplayNames, HIGH_RISK_DISEASES } from '@/lib/utils';

const resultOptions = [
  { value: 'ongoing', label: 'Ongoing Treatment', color: 'bg-blue-100 text-blue-700' },
  { value: 'recovered', label: 'Recovered', color: 'bg-green-100 text-green-700' },
  { value: 'referred', label: 'Referred', color: 'bg-purple-100 text-purple-700' },
  { value: 'followup', label: 'Follow-up Required', color: 'bg-amber-100 text-amber-700' },
  { value: 'died', label: 'Died', color: 'bg-red-100 text-red-700' },
];

const speciesOptions = Object.entries(speciesDisplayNames);

const OPDRegister = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [viewCase, setViewCase] = useState(null);
  
  const [newCase, setNewCase] = useState({
    tag_number: '',
    farmer_name: '',
    farmer_village: '',
    farmer_phone: '',
    species: '',
    breed: '',
    age_months: '',
    symptoms: '',
    tentative_diagnosis: '',
    treatment: '',
    result: 'ongoing',
    follow_up_date: '',
    remarks: '',
  });

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await api.get('/vet/opd');
      setCases(response.data);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
      toast.error('Failed to load OPD cases');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCase.tag_number || !newCase.farmer_name || !newCase.species || !newCase.symptoms || !newCase.tentative_diagnosis || !newCase.treatment) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...newCase,
        age_months: newCase.age_months ? parseInt(newCase.age_months) : null,
      };
      await api.post('/vet/opd', payload);
      toast.success('OPD case registered successfully!');
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
      symptoms: '',
      tentative_diagnosis: '',
      treatment: '',
      result: 'ongoing',
      follow_up_date: '',
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

  const isZoonotic = (diagnosis) => {
    return HIGH_RISK_DISEASES.some(disease => 
      diagnosis.toLowerCase().includes(disease.toLowerCase())
    );
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tag_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = filterSpecies === 'all' || c.species === filterSpecies;
    const matchesResult = filterResult === 'all' || c.result === filterResult;
    return matchesSearch && matchesSpecies && matchesResult;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            OPD Register
          </h1>
          <p className="text-slate-500 text-sm">Out-Patient Department case records</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="new-opd-case-btn">
              <Plus className="h-4 w-4" />
              New OPD Case
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New OPD Case</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Patient & Farmer Details */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-700 mb-3">Patient & Farmer Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tag Number *</Label>
                    <Input
                      value={newCase.tag_number}
                      onChange={(e) => handleChange('tag_number', e.target.value)}
                      placeholder="Animal tag/ID"
                      data-testid="tag-number-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Species *</Label>
                    <Select 
                      value={newCase.species}
                      onValueChange={(val) => handleChange('species', val)}
                    >
                      <SelectTrigger data-testid="species-select">
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
                    <Label>Farmer Name *</Label>
                    <Input
                      value={newCase.farmer_name}
                      onChange={(e) => handleChange('farmer_name', e.target.value)}
                      placeholder="Owner's name"
                      data-testid="farmer-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Farmer Village</Label>
                    <Input
                      value={newCase.farmer_village}
                      onChange={(e) => handleChange('farmer_village', e.target.value)}
                      placeholder="Village name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Farmer Phone</Label>
                    <Input
                      value={newCase.farmer_phone}
                      onChange={(e) => handleChange('farmer_phone', e.target.value)}
                      placeholder="Mobile number"
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
              </div>

              {/* Clinical Details */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Clinical Details</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Symptoms *</Label>
                    <Textarea
                      value={newCase.symptoms}
                      onChange={(e) => handleChange('symptoms', e.target.value)}
                      placeholder="Describe observed symptoms"
                      rows={2}
                      data-testid="symptoms-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tentative Diagnosis *</Label>
                    <Textarea
                      value={newCase.tentative_diagnosis}
                      onChange={(e) => handleChange('tentative_diagnosis', e.target.value)}
                      placeholder="Preliminary diagnosis based on examination"
                      rows={2}
                      data-testid="diagnosis-input"
                    />
                    {newCase.tentative_diagnosis && isZoonotic(newCase.tentative_diagnosis) && (
                      <div className="p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Suspected zoonotic disease. Follow safety protocols!</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Treatment *</Label>
                    <Textarea
                      value={newCase.treatment}
                      onChange={(e) => handleChange('treatment', e.target.value)}
                      placeholder="Treatment prescribed"
                      rows={2}
                      data-testid="treatment-input"
                    />
                  </div>
                </div>
              </div>

              {/* Result & Follow-up */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Result</Label>
                  <Select 
                    value={newCase.result}
                    onValueChange={(val) => handleChange('result', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {resultOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newCase.result === 'followup' && (
                  <div className="space-y-2">
                    <Label>Follow-up Date</Label>
                    <Input
                      type="date"
                      value={newCase.follow_up_date}
                      onChange={(e) => handleChange('follow_up_date', e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  value={newCase.remarks}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                  placeholder="Additional notes"
                  rows={2}
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> Diagnosis is tentative only. All records are auditable. 
                  Final clinical decisions must be documented properly.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={saving} data-testid="submit-opd-btn">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Register OPD Case
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by case number, tag, or farmer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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
            <Select value={filterResult} onValueChange={setFilterResult}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                {resultOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredCases.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No OPD cases found</p>
          <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
            Register first case
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCases.map((caseItem) => (
            <Card 
              key={caseItem.id} 
              className={`hover:shadow-md transition-shadow ${
                isZoonotic(caseItem.tentative_diagnosis) ? 'border-red-300 bg-red-50' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isZoonotic(caseItem.tentative_diagnosis) ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {isZoonotic(caseItem.tentative_diagnosis) ? (
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      ) : (
                        <ClipboardList className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{caseItem.case_number}</h3>
                        <Badge variant="outline" className="text-xs">
                          S.No: {caseItem.serial_number}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">{caseItem.tag_number}</span> • {speciesDisplayNames[caseItem.species]}
                      </p>
                      <p className="text-sm text-slate-500">
                        Owner: {caseItem.farmer_name} {caseItem.farmer_village && `• ${caseItem.farmer_village}`}
                      </p>
                      <p className="text-sm text-slate-700 mt-1">
                        <span className="font-medium">Dx:</span> {caseItem.tentative_diagnosis}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    {getResultBadge(caseItem.result)}
                    <p className="text-xs text-slate-500">{formatDate(caseItem.case_date)}</p>
                    <p className="text-xs text-slate-400">By: {caseItem.vet_name}</p>
                  </div>
                </div>
                
                {caseItem.follow_up_date && caseItem.result === 'followup' && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 bg-amber-100 p-2 rounded">
                    <Calendar className="h-4 w-4" />
                    Follow-up: {formatDate(caseItem.follow_up_date)}
                  </div>
                )}

                {isZoonotic(caseItem.tentative_diagnosis) && (
                  <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                    <strong>⚠️ Zoonotic Alert:</strong> Follow safety protocols. Use PPE. Report to authorities.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Case Count */}
      <div className="text-sm text-slate-500 text-center">
        Showing {filteredCases.length} of {cases.length} cases
      </div>
    </div>
  );
};

export default OPDRegister;
