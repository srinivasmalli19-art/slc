import React, { useState, useEffect } from 'react';
import { 
  Plus, Loader2, Wheat, Search, Filter, Edit2, Eye, 
  CheckCircle2, AlertTriangle, Leaf, X, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

const feedCategories = [
  { value: 'green_fodder_legume', label: 'Green Fodder - Legume' },
  { value: 'green_fodder_non_legume', label: 'Green Fodder - Non-Legume' },
  { value: 'tree_fodder', label: 'Tree Fodder / Browse' },
  { value: 'dry_fodder', label: 'Dry Fodder / Hay' },
  { value: 'concentrates', label: 'Concentrates' },
  { value: 'oil_cakes', label: 'Oil Cakes' },
  { value: 'brans', label: 'Brans' },
  { value: 'grains', label: 'Grains' },
  { value: 'agro_industrial', label: 'Agro-Industrial By-products' },
  { value: 'minerals', label: 'Minerals' },
  { value: 'supplements', label: 'Supplements' },
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

const FeedItemsMaster = () => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [editingFeed, setEditingFeed] = useState(null);
  const [viewFeed, setViewFeed] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    local_name: '',
    category: '',
    applicable_species: [],
    dm_percentage: '',
    cp_percentage: '',
    dcp_percentage: '',
    tdn_percentage: '',
    me_mcal: '',
    ndf_percentage: '',
    adf_percentage: '',
    calcium_percentage: '',
    phosphorus_percentage: '',
    default_price_per_kg: '',
    max_inclusion_percentage: '',
    warnings: [],
    contraindicated_species: [],
    is_toxic: false,
    toxicity_notes: '',
    is_active: true,
  });

  const [newWarning, setNewWarning] = useState('');

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async () => {
    try {
      const response = await api.get('/admin/feed-items');
      setFeeds(response.data);
    } catch (error) {
      toast.error('Failed to load feed items');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      local_name: '',
      category: '',
      applicable_species: [],
      dm_percentage: '',
      cp_percentage: '',
      dcp_percentage: '',
      tdn_percentage: '',
      me_mcal: '',
      ndf_percentage: '',
      adf_percentage: '',
      calcium_percentage: '',
      phosphorus_percentage: '',
      default_price_per_kg: '',
      max_inclusion_percentage: '',
      warnings: [],
      contraindicated_species: [],
      is_toxic: false,
      toxicity_notes: '',
      is_active: true,
    });
    setEditingFeed(null);
    setNewWarning('');
  };

  const handleEdit = (feed) => {
    setEditingFeed(feed);
    setFormData({
      name: feed.name || '',
      local_name: feed.local_name || '',
      category: feed.category || '',
      applicable_species: feed.applicable_species || [],
      dm_percentage: feed.dm_percentage?.toString() || '',
      cp_percentage: feed.cp_percentage?.toString() || '',
      dcp_percentage: feed.dcp_percentage?.toString() || '',
      tdn_percentage: feed.tdn_percentage?.toString() || '',
      me_mcal: feed.me_mcal?.toString() || '',
      ndf_percentage: feed.ndf_percentage?.toString() || '',
      adf_percentage: feed.adf_percentage?.toString() || '',
      calcium_percentage: feed.calcium_percentage?.toString() || '',
      phosphorus_percentage: feed.phosphorus_percentage?.toString() || '',
      default_price_per_kg: feed.default_price_per_kg?.toString() || '',
      max_inclusion_percentage: feed.max_inclusion_percentage?.toString() || '',
      warnings: feed.warnings || [],
      contraindicated_species: feed.contraindicated_species || [],
      is_toxic: feed.is_toxic || false,
      toxicity_notes: feed.toxicity_notes || '',
      is_active: feed.is_active !== false,
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

  const addWarning = () => {
    if (newWarning.trim()) {
      setFormData(prev => ({
        ...prev,
        warnings: [...prev.warnings, newWarning.trim()]
      }));
      setNewWarning('');
    }
  };

  const removeWarning = (index) => {
    setFormData(prev => ({
      ...prev,
      warnings: prev.warnings.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category || formData.applicable_species.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        dm_percentage: parseFloat(formData.dm_percentage) || 0,
        cp_percentage: parseFloat(formData.cp_percentage) || 0,
        dcp_percentage: formData.dcp_percentage ? parseFloat(formData.dcp_percentage) : null,
        tdn_percentage: formData.tdn_percentage ? parseFloat(formData.tdn_percentage) : null,
        me_mcal: formData.me_mcal ? parseFloat(formData.me_mcal) : null,
        ndf_percentage: formData.ndf_percentage ? parseFloat(formData.ndf_percentage) : null,
        adf_percentage: formData.adf_percentage ? parseFloat(formData.adf_percentage) : null,
        calcium_percentage: formData.calcium_percentage ? parseFloat(formData.calcium_percentage) : null,
        phosphorus_percentage: formData.phosphorus_percentage ? parseFloat(formData.phosphorus_percentage) : null,
        default_price_per_kg: formData.default_price_per_kg ? parseFloat(formData.default_price_per_kg) : null,
        max_inclusion_percentage: formData.max_inclusion_percentage ? parseFloat(formData.max_inclusion_percentage) : null,
      };

      if (editingFeed) {
        await api.put(`/admin/feed-items/${editingFeed.id}`, payload);
        toast.success('Feed item updated successfully');
      } else {
        await api.post('/admin/feed-items', payload);
        toast.success('Feed item created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchFeeds();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save feed item');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryLabel = (category) => {
    const cat = feedCategories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const getCategoryColor = (category) => {
    const colors = {
      green_fodder_legume: 'bg-green-100 text-green-700',
      green_fodder_non_legume: 'bg-lime-100 text-lime-700',
      tree_fodder: 'bg-emerald-100 text-emerald-700',
      dry_fodder: 'bg-amber-100 text-amber-700',
      concentrates: 'bg-blue-100 text-blue-700',
      oil_cakes: 'bg-orange-100 text-orange-700',
      brans: 'bg-yellow-100 text-yellow-700',
      grains: 'bg-purple-100 text-purple-700',
      minerals: 'bg-gray-100 text-gray-700',
    };
    return colors[category] || 'bg-slate-100 text-slate-700';
  };

  const filteredFeeds = feeds.filter(f => {
    const matchesSearch = f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.local_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || f.category === filterCategory;
    const matchesSpecies = filterSpecies === 'all' || f.applicable_species?.includes(filterSpecies);
    return matchesSearch && matchesCategory && matchesSpecies;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Feed Items Master
          </h1>
          <p className="text-slate-500 text-sm">Manage all feed items with nutritional values (Admin Only)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-green-600 hover:bg-green-700" data-testid="new-feed-btn">
              <Plus className="h-4 w-4" />
              Add Feed Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wheat className="h-5 w-5 text-green-600" />
                {editingFeed ? 'Edit Feed Item' : 'Add New Feed Item'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Feed Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Lucerne"
                    data-testid="feed-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Local Name</Label>
                  <Input
                    value={formData.local_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, local_name: e.target.value }))}
                    placeholder="e.g., Rijka"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                    <SelectTrigger data-testid="feed-category-select">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {feedCategories.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

              {/* Nutritional Values */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Nutritional Values (per kg DM basis)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-green-50">
                  <div className="space-y-1">
                    <Label className="text-xs">DM % *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.dm_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, dm_percentage: e.target.value }))}
                      placeholder="e.g., 22"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">CP %</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.cp_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, cp_percentage: e.target.value }))}
                      placeholder="e.g., 18"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">DCP %</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.dcp_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, dcp_percentage: e.target.value }))}
                      placeholder="e.g., 14"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">TDN %</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.tdn_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, tdn_percentage: e.target.value }))}
                      placeholder="e.g., 58"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ME (Mcal/kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.me_mcal}
                      onChange={(e) => setFormData(prev => ({ ...prev, me_mcal: e.target.value }))}
                      placeholder="e.g., 2.4"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">NDF %</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.ndf_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, ndf_percentage: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Ca %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.calcium_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, calcium_percentage: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">P %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.phosphorus_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, phosphorus_percentage: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Safety */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Default Price (₹/kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.default_price_per_kg}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_price_per_kg: e.target.value }))}
                    placeholder="e.g., 25"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Inclusion %</Label>
                  <Input
                    type="number"
                    step="1"
                    value={formData.max_inclusion_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_inclusion_percentage: e.target.value }))}
                    placeholder="Safety limit"
                  />
                </div>
                <div className="space-y-2 flex items-end gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.is_toxic}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_toxic: checked }))}
                    />
                    <span className="text-sm text-red-600 font-medium">Toxic/Hazardous</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>
              </div>

              {/* Warnings */}
              <div className="space-y-2">
                <Label>Warnings & Notes</Label>
                <div className="flex gap-2">
                  <Input
                    value={newWarning}
                    onChange={(e) => setNewWarning(e.target.value)}
                    placeholder="Add a warning..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addWarning())}
                  />
                  <Button type="button" variant="outline" onClick={addWarning}>Add</Button>
                </div>
                {formData.warnings.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.warnings.map((w, i) => (
                      <Badge key={i} variant="outline" className="bg-amber-50 text-amber-700 gap-1">
                        {w}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeWarning(i)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {formData.is_toxic && (
                <div className="space-y-2">
                  <Label>Toxicity Notes</Label>
                  <Textarea
                    value={formData.toxicity_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, toxicity_notes: e.target.value }))}
                    placeholder="Describe toxicity risks and precautions..."
                    rows={2}
                  />
                </div>
              )}

              <Button type="submit" className="w-full gap-2 bg-green-600 hover:bg-green-700" disabled={saving} data-testid="save-feed-btn">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingFeed ? 'Update Feed Item' : 'Save Feed Item'}
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
              <div className="p-2 bg-green-100 rounded-lg">
                <Wheat className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{feeds.length}</p>
                <p className="text-xs text-slate-500">Total Feeds</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-lime-100 rounded-lg">
                <Leaf className="h-5 w-5 text-lime-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-lime-600">
                  {feeds.filter(f => f.category?.includes('green')).length}
                </p>
                <p className="text-xs text-slate-500">Green Fodder</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Wheat className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {feeds.filter(f => ['oil_cakes', 'brans', 'grains', 'concentrates'].includes(f.category)).length}
                </p>
                <p className="text-xs text-slate-500">Concentrates</p>
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
                <p className="text-2xl font-bold text-red-600">
                  {feeds.filter(f => f.is_toxic || f.warnings?.length > 0).length}
                </p>
                <p className="text-xs text-slate-500">With Warnings</p>
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
                placeholder="Search feeds..."
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
                {feedCategories.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSpecies} onValueChange={setFilterSpecies}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Species" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Species</SelectItem>
                {speciesOptions.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feed Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">DM %</TableHead>
                  <TableHead className="text-center">CP %</TableHead>
                  <TableHead className="text-center">TDN %</TableHead>
                  <TableHead className="text-center">Price (₹/kg)</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeeds.map((feed) => (
                  <TableRow key={feed.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{feed.name}</p>
                        {feed.local_name && <p className="text-xs text-slate-500">{feed.local_name}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(feed.category)}>
                        {getCategoryLabel(feed.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{feed.dm_percentage}</TableCell>
                    <TableCell className="text-center">{feed.cp_percentage}</TableCell>
                    <TableCell className="text-center">{feed.tdn_percentage || '-'}</TableCell>
                    <TableCell className="text-center">{feed.default_price_per_kg || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {feed.applicable_species?.slice(0, 3).map(s => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                        {feed.applicable_species?.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{feed.applicable_species.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {feed.is_active ? (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-500">Inactive</Badge>
                        )}
                        {feed.warnings?.length > 0 && (
                          <Badge className="bg-amber-100 text-amber-700">⚠️</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setViewFeed(feed)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(feed)}>
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
      <Dialog open={!!viewFeed} onOpenChange={() => setViewFeed(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewFeed?.name}</DialogTitle>
          </DialogHeader>
          {viewFeed && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Category</Label>
                  <p><Badge className={getCategoryColor(viewFeed.category)}>{getCategoryLabel(viewFeed.category)}</Badge></p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Local Name</Label>
                  <p>{viewFeed.local_name || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                <div><Label className="text-xs">DM %</Label><p className="font-bold">{viewFeed.dm_percentage}</p></div>
                <div><Label className="text-xs">CP %</Label><p className="font-bold">{viewFeed.cp_percentage}</p></div>
                <div><Label className="text-xs">DCP %</Label><p className="font-bold">{viewFeed.dcp_percentage || '-'}</p></div>
                <div><Label className="text-xs">TDN %</Label><p className="font-bold">{viewFeed.tdn_percentage || '-'}</p></div>
                <div><Label className="text-xs">ME (Mcal)</Label><p className="font-bold">{viewFeed.me_mcal || '-'}</p></div>
                <div><Label className="text-xs">Ca %</Label><p className="font-bold">{viewFeed.calcium_percentage || '-'}</p></div>
                <div><Label className="text-xs">P %</Label><p className="font-bold">{viewFeed.phosphorus_percentage || '-'}</p></div>
                <div><Label className="text-xs">Price (₹/kg)</Label><p className="font-bold">{viewFeed.default_price_per_kg || '-'}</p></div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Applicable Species</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {viewFeed.applicable_species?.map(s => (
                    <Badge key={s} variant="outline">{s}</Badge>
                  ))}
                </div>
              </div>
              {viewFeed.warnings?.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <Label className="text-xs text-amber-700">Warnings</Label>
                  <ul className="list-disc list-inside text-sm text-amber-800 mt-1">
                    {viewFeed.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
              <div className="text-xs text-slate-400">
                Version: {viewFeed.version} | Updated: {new Date(viewFeed.updated_at).toLocaleString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedItemsMaster;
