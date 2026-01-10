import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ChevronRight, Loader2 } from 'lucide-react';
import { animalsAPI } from '../../../lib/api';
import { speciesDisplayNames, formatDate } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { toast } from 'sonner';

const speciesCategories = [
  { key: 'all', label: 'All' },
  { key: 'cattle_buffalo', label: 'Buffalo/Cattle', species: ['cattle', 'buffalo'] },
  { key: 'sheep_goat', label: 'Sheep/Goat', species: ['sheep', 'goat'] },
  { key: 'poultry', label: 'Poultry', species: ['poultry'] },
  { key: 'others', label: 'Others', species: ['pig', 'dog', 'cat', 'horse', 'camel', 'donkey'] },
];

const speciesImages = {
  cattle: 'https://images.unsplash.com/photo-1594466245134-136169b2d0a1?auto=format&fit=crop&w=100&q=80',
  buffalo: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=100&q=80',
  sheep: 'https://images.unsplash.com/photo-1690543581035-2cf08f993434?auto=format&fit=crop&w=100&q=80',
  goat: 'https://images.unsplash.com/photo-1590080876351-941da357a5e4?auto=format&fit=crop&w=100&q=80',
  poultry: 'https://images.unsplash.com/photo-1658086130176-9e771ed4c9b1?auto=format&fit=crop&w=100&q=80',
  default: 'https://images.unsplash.com/photo-1594466245134-136169b2d0a1?auto=format&fit=crop&w=100&q=80'
};

const MyAnimals = () => {
  const navigate = useNavigate();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchAnimals();
  }, []);

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const response = await animalsAPI.getAll();
      setAnimals(response.data);
    } catch (error) {
      toast.error('Failed to fetch animals');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnimals = animals.filter(animal => {
    // Filter by search query
    const matchesSearch = animal.tag_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         animal.breed.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    if (activeCategory === 'all') return matchesSearch;
    
    const category = speciesCategories.find(c => c.key === activeCategory);
    if (category?.species) {
      return matchesSearch && category.species.includes(animal.species);
    }
    
    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'pregnant': return 'bg-pink-100 text-pink-800';
      case 'milking': return 'bg-blue-100 text-blue-800';
      case 'dry': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
            My Animals
          </h1>
          <p className="text-slate-500 text-sm">Manage your livestock registry</p>
        </div>
        <Button 
          onClick={() => navigate('/farmer/animals/new')}
          className="gap-2"
          data-testid="add-animal-btn"
        >
          <Plus className="h-4 w-4" />
          Add Animal
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by tag ID or breed..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="search-animals-input"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          {speciesCategories.map(cat => (
            <TabsTrigger 
              key={cat.key} 
              value={cat.key}
              className="whitespace-nowrap"
              data-testid={`category-${cat.key}`}
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAnimals.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-slate-500">No animals found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/farmer/animals/new')}
              >
                Add your first animal
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredAnimals.map((animal) => (
                <Card 
                  key={animal.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/farmer/animals/${animal.id}`)}
                  data-testid={`animal-card-${animal.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                        <img 
                          src={speciesImages[animal.species] || speciesImages.default}
                          alt={animal.species}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800 truncate">
                            {animal.breed}
                          </h3>
                          <Badge className={getStatusColor(animal.status)}>
                            {animal.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">
                          Tag: {animal.tag_id} • {animal.age_months} months • {speciesDisplayNames[animal.species]}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyAnimals;
