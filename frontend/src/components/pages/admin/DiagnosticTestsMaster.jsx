import React, { useState, useEffect } from 'react';
import { 
  Plus, Loader2, FlaskConical, Search, Filter, Edit2, Eye, 
  CheckCircle2, AlertTriangle, TestTube, X, Save, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import api from '@/lib/api';

const diagnosticCategories = [
  { value: 'cbc', label: 'CBC' },
  { value: 'biochemistry', label: 'Biochemistry' },
  { value: 'blood_parasites', label: 'Blood Parasites' },
  { value: 'brucellosis', label: 'Brucellosis' },
  { value: 'fmd_antibody', label: 'FMD Antibody' },
  { value: 'pregnancy', label: 'Pregnancy' },
  { value: 'mineral_profile', label: 'Mineral Profile' },
  { value: 'hormones', label: 'Hormones' },
  { value: 'fecal', label: 'Fecal (Parasitology)' },
  { value: 'milk_test', label: 'Milk Quality' },
  { value: 'urine_test', label: 'Urine Test' },
  { value: 'nasal', label: 'Nasal / Respiratory' },
  { value: 'skin_scraping', label: 'Skin Scraping' },
];

const sampleTypes = [
  { value: 'blood', label: 'Blood' },
  { value: 'dung', label: 'Dung / Fecal' },
  { value: 'milk', label: 'Milk' },
  { value: 'urine', label: 'Urine' },
  { value: 'nasal', label: 'Nasal Swab' },
  { value: 'skin', label: 'Skin Scraping' },
];

const diseaseNatures = [
  { value: 'normal', label: 'Normal', color: 'bg-green-100 text-green-700' },
  { value: 'zoonotic', label: 'Zoonotic', color: 'bg-red-100 text-red-700' },
  { value: 'notifiable', label: 'Notifiable', color: 'bg-orange-100 text-orange-700' },
  { value: 'emergency', label: 'Emergency', color: 'bg-red-200 text-red-800' },
];

const speciesOptions = [
  { value: 'cattle', label: 'Cattle' },
  { value: 'buffalo', label: 'Buffalo' },
  { value: 'sheep', label: 'Sheep' },
  { value: 'goat', label: 'Goat' },
  { value: 'pig', label: 'Pig' },
  { value: 'horse', label: 'Horse' },
  { value: 'donkey', label: 'Donkey' },
  { value: 'camel', label: 'Camel' },
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'poultry', label: 'Poultry' },
];

const DiagnosticTestsMaster = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterNature, setFilterNature] = useState('all');
  const [editingTest, setEditingTest] = useState(null);
  const [viewTest, setViewTest] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sample_type: '',
    applicable_species: [],
    purpose: '',
    disease_nature: 'normal',
    parameters: [],
    is_active: true,
  });

  const [newParam, setNewParam] = useState({ name: '', unit: '' });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await api.get('/admin/diagnostic-tests');
      setTests(response.data);
    } catch (error) {
      toast.error('Failed to load diagnostic tests');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      sample_type: '',
      applicable_species: [],
      purpose: '',
      disease_nature: 'normal',
      parameters: [],
      is_active: true,
    });
    setEditingTest(null);
    setNewParam({ name: '', unit: '' });
  };

  const handleEdit = (test) => {
    setEditingTest(test);
    setFormData({
      name: test.name || '',
      category: test.category || '',
      sample_type: test.sample_type || '',
      applicable_species: test.applicable_species || [],
      purpose: test.purpose || '',
      disease_nature: test.disease_nature || 'normal',
      parameters: test.parameters || [],
      is_active: test.is_active !== false,
    });
    setDialogOpen(true);
  };

  const handleSpeciesToggle = (species) => {
    setFormData(prev => ({
      ...prev,
      applicable_species: prev.applicable_species.includes(species)
        ? prev.applicable_species.filter(s => s !== species)
        : [...prev.applicable_species, species]
    }));
  };

  const addParameter = () => {
    if (newParam.name.trim() && newParam.unit.trim()) {
      setFormData(prev => ({
        ...prev,
        parameters: [...prev.parameters, { name: newParam.name.trim(), unit: newParam.unit.trim() }]
      }));
      setNewParam({ name: '', unit: '' });
    }
  };

  const removeParameter = (index) => {
    setFormData(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.sample_type || formData.applicable_species.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingTest) {
        await api.put(`/admin/diagnostic-tests/${editingTest.id}`, formData);
        toast.success('Diagnostic test updated successfully');
      } else {
        await api.post('/admin/diagnostic-tests', formData);
        toast.success('Diagnostic test created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchTests();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save diagnostic test');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryLabel = (category) => {
    const cat = diagnosticCategories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const getNatureBadge = (nature) => {
    const n = diseaseNatures.find(d => d.value === nature);
    return n ? <Badge className={n.color}>{n.label}</Badge> : <Badge variant="outline">{nature}</Badge>;
  };

  const filteredTests = tests.filter(t => {
    const matchesSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    const matchesNature = filterNature === 'all' || t.disease_nature === filterNature;
    return matchesSearch && matchesCategory && matchesNature;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Diagnostic Tests Master
          </h1>
          <p className="text-slate-500 text-sm">Manage diagnostic tests and parameters (Admin Only)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-purple-600 hover:bg-purple-700" data-testid="new-test-btn">
              <Plus className="h-4 w-4" />
              Add Diagnostic Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-purple-600" />
                {editingTest ? 'Edit Diagnostic Test' : 'Add New Diagnostic Test'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Test Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Complete Blood Count"
                    data-testid="test-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {diagnosticCategories.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sample Type *</Label>
                  <Select value={formData.sample_type} onValueChange={(v) => setFormData(prev => ({ ...prev, sample_type: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sample type" />
                    </SelectTrigger>
                    <SelectContent>
                      {sampleTypes.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Disease Nature *</Label>
                  <Select value={formData.disease_nature} onValueChange={(v) => setFormData(prev => ({ ...prev, disease_nature: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select nature" />
                    </SelectTrigger>
                    <SelectContent>
                      {diseaseNatures.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="Describe the purpose of this test..."
                  rows={2}
                />
              </div>

              {/* Applicable Species */}
              <div className="space-y-2">
                <Label>Applicable Species *</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-slate-50">
                  {speciesOptions.map(s => (
                    <label key={s.value} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.applicable_species.includes(s.value)}
                        onCheckedChange={() => handleSpeciesToggle(s.value)}
                      />
                      <span className="text-sm">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Parameters */}
              <div className="space-y-2">
                <Label>Test Parameters</Label>
                <div className="flex gap-2">
                  <Input
                    value={newParam.name}
                    onChange={(e) => setNewParam(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Parameter name (e.g., Hemoglobin)"
                    className="flex-1"
                  />
                  <Input
                    value={newParam.unit}
                    onChange={(e) => setNewParam(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="Unit (e.g., g/dL)"
                    className="w-32"
                  />
                  <Button type="button" variant="outline" onClick={addParameter}>Add</Button>
                </div>
                {formData.parameters.length > 0 && (
                  <div className="border rounded-lg p-3 mt-2">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Parameter</th>
                          <th className="text-left py-2">Unit</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.parameters.map((p, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2">{p.name}</td>
                            <td className="py-2">{p.unit}</td>
                            <td>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeParameter(i)}>
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Zoonotic Warning */}
              {(formData.disease_nature === 'zoonotic' || formData.disease_nature === 'emergency') && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 font-medium">
                    <Shield className="h-5 w-5" />
                    Zoonotic / Emergency Disease
                  </div>
                  <p className="text-sm text-red-600 mt-2">
                    This test will trigger safety protocols including PPE requirements, isolation guidelines, and government reporting obligations.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>

              <Button type="submit" className="w-full gap-2 bg-purple-600 hover:bg-purple-700" disabled={saving} data-testid="save-test-btn">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingTest ? 'Update Diagnostic Test' : 'Save Diagnostic Test'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FlaskConical className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{tests.length}</p>
                <p className="text-xs text-slate-500">Total Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TestTube className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {tests.filter(t => t.sample_type === 'blood').length}
                </p>
                <p className="text-xs text-slate-500">Blood Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {tests.filter(t => t.disease_nature === 'zoonotic').length}
                </p>
                <p className="text-xs text-slate-500">Zoonotic</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {tests.filter(t => t.disease_nature === 'notifiable').length}
                </p>
                <p className="text-xs text-slate-500">Notifiable</p>
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
                placeholder="Search tests..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {diagnosticCategories.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterNature} onValueChange={setFilterNature}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Nature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Natures</SelectItem>
                {diseaseNatures.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Sample</TableHead>
                  <TableHead>Nature</TableHead>
                  <TableHead>Parameters</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>
                      <p className="font-medium">{test.name}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(test.category)}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{test.sample_type}</TableCell>
                    <TableCell>{getNatureBadge(test.disease_nature)}</TableCell>
                    <TableCell>{test.parameters?.length || 0}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {test.applicable_species?.slice(0, 3).map(s => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                        {test.applicable_species?.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{test.applicable_species.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setViewTest(test)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(test)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewTest} onOpenChange={() => setViewTest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-purple-600" />
              {viewTest?.name}
            </DialogTitle>
          </DialogHeader>
          {viewTest && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Category</Label>
                  <p>{getCategoryLabel(viewTest.category)}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Sample Type</Label>
                  <p className="capitalize">{viewTest.sample_type}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Disease Nature</Label>
                  <div className="mt-1">{getNatureBadge(viewTest.disease_nature)}</div>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Purpose</Label>
                <p className="text-sm bg-slate-50 p-2 rounded mt-1">{viewTest.purpose}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Applicable Species</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {viewTest.applicable_species?.map(s => (
                    <Badge key={s} variant="outline">{s}</Badge>
                  ))}
                </div>
              </div>
              {viewTest.parameters?.length > 0 && (
                <div>
                  <Label className="text-xs text-slate-500">Parameters</Label>
                  <div className="border rounded-lg p-3 mt-1">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Parameter</th>
                          <th className="text-left py-2">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewTest.parameters.map((p, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2">{p.name}</td>
                            <td className="py-2">{p.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {viewTest.safety_block && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <Label className="text-xs text-red-700">Safety Requirements</Label>
                  <ul className="list-disc list-inside text-sm text-red-800 mt-1">
                    {viewTest.safety_block.ppe_required?.map((p, i) => <li key={i}>PPE: {p}</li>)}
                    {viewTest.safety_block.isolation_required && <li>Isolation Required</li>}
                    {viewTest.safety_block.government_reporting && <li>Government Reporting Required</li>}
                  </ul>
                </div>
              )}
              <div className="text-xs text-slate-400">
                Version: {viewTest.version} | Updated: {new Date(viewTest.updated_at).toLocaleString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiagnosticTestsMaster;
