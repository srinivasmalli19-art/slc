import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format date for display
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Format date for input fields
export function formatDateForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

// Species display names
export const speciesDisplayNames = {
  cattle: 'Cattle',
  buffalo: 'Buffalo',
  sheep: 'Sheep',
  goat: 'Goat',
  pig: 'Pig',
  poultry: 'Poultry',
  dog: 'Dog (Canine)',
  cat: 'Cat (Feline)',
  horse: 'Horse',
  donkey: 'Donkey',
  camel: 'Camel'
};

// Test categories display names
export const testCategoryDisplayNames = {
  blood: 'Blood Test',
  dung: 'Dung/Fecal Test',
  milk: 'Milk Test',
  urine: 'Urine Test',
  nasal: 'Nasal/Respiratory Test',
  skin: 'Skin Scraping Test'
};

// Interpretation status colors
export const statusColors = {
  normal: 'bg-green-100 text-green-800 border-green-200',
  high: 'bg-red-100 text-red-800 border-red-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  positive: 'bg-red-100 text-red-800 border-red-200',
  negative: 'bg-green-100 text-green-800 border-green-200'
};

// High-risk diseases list
export const HIGH_RISK_DISEASES = [
  'Brucellosis',
  'Anthrax',
  'Leptospirosis',
  'Tuberculosis',
  'Avian Influenza',
  'Rabies',
  'FMD'
];

// Disclaimer text
export const DISCLAIMER_TEXT = "This system provides clinical reference and decision support only. Final diagnosis and treatment decisions must be made by a registered veterinarian.";

// Role permissions
export const ROLE_PERMISSIONS = {
  farmer: ['animals', 'vaccinations', 'deworming', 'breeding', 'profile'],
  paravet: ['animals', 'vaccinations', 'deworming', 'breeding', 'census', 'samples'],
  veterinarian: ['animals', 'vaccinations', 'deworming', 'breeding', 'diagnostics', 'knowledge-center', 'reports'],
  admin: ['users', 'knowledge-center', 'settings', 'reports', 'audit'],
  guest: ['area-calculator', 'interest-calculator', 'downloads']
};
