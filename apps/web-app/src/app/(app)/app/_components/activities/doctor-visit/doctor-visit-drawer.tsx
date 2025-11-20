'use client';

import { api } from '@nugget/api/react';
import { Button } from '@nugget/ui/button';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import { Textarea } from '@nugget/ui/textarea';
import { useCallback, useEffect, useState } from 'react';
import {
  getLengthUnitLabel,
  getWeightUnitLabel,
  inchesToCm,
  lbsToKg,
} from '../shared/measurement-utils';

export interface DoctorVisitFormData {
  doctorName: string;
  visitType: 'well-baby' | 'sick' | 'follow-up' | 'other' | null;
  location: string;
  weightKg: string;
  lengthCm: string;
  headCircumferenceCm: string;
  vaccinations: string[];
  notes: string;
}

interface DoctorVisitDrawerContentProps {
  onDataChange?: (data: DoctorVisitFormData) => void;
  initialData?: Partial<DoctorVisitFormData>;
}

// Common first-year vaccinations
const COMMON_VACCINATIONS = [
  'Hepatitis B',
  'DTaP',
  'IPV',
  'Hib',
  'PCV13',
  'Rotavirus',
  'MMR',
  'Varicella',
  'Hepatitis A',
  'Influenza',
];

export function DoctorVisitDrawerContent({
  onDataChange,
  initialData,
}: DoctorVisitDrawerContentProps) {
  // Get user preferences
  const { data: userData } = api.user.current.useQuery();
  const measurementUnit = userData?.measurementUnit || 'metric';

  const [visitType, setVisitType] = useState<
    'well-baby' | 'sick' | 'follow-up' | 'other' | null
  >(initialData?.visitType || null);
  const [doctorName, setDoctorName] = useState(initialData?.doctorName || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [weightInput, setWeightInput] = useState(initialData?.weightKg || '');
  const [lengthInput, setLengthInput] = useState(initialData?.lengthCm || '');
  const [headInput, setHeadInput] = useState(
    initialData?.headCircumferenceCm || '',
  );
  const [vaccinations, setVaccinations] = useState<string[]>(
    initialData?.vaccinations || [],
  );
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Convert input to metric for storage
  const getWeightKg = useCallback((): string => {
    if (!weightInput) return '';
    if (measurementUnit === 'imperial') {
      return lbsToKg(Number.parseFloat(weightInput)).toString();
    }
    return weightInput;
  }, [weightInput, measurementUnit]);

  const getLengthCm = useCallback((): string => {
    if (!lengthInput) return '';
    if (measurementUnit === 'imperial') {
      return inchesToCm(Number.parseFloat(lengthInput)).toString();
    }
    return lengthInput;
  }, [lengthInput, measurementUnit]);

  const getHeadCircumferenceCm = useCallback((): string => {
    if (!headInput) return '';
    if (measurementUnit === 'imperial') {
      return inchesToCm(Number.parseFloat(headInput)).toString();
    }
    return headInput;
  }, [headInput, measurementUnit]);

  // Call onDataChange whenever form data changes
  useEffect(() => {
    onDataChange?.({
      doctorName,
      headCircumferenceCm: getHeadCircumferenceCm(),
      lengthCm: getLengthCm(),
      location,
      notes,
      vaccinations,
      visitType,
      weightKg: getWeightKg(),
    });
  }, [
    visitType,
    doctorName,
    location,
    vaccinations,
    notes,
    onDataChange,
    getHeadCircumferenceCm,
    getLengthCm,
    getWeightKg,
  ]);

  const visitTypes = [
    { id: 'well-baby' as const, label: 'Well-Baby Checkup' },
    { id: 'sick' as const, label: 'Sick Visit' },
    { id: 'follow-up' as const, label: 'Follow-up' },
    { id: 'other' as const, label: 'Other' },
  ];

  const toggleVaccination = (vaccination: string) => {
    setVaccinations((prev) =>
      prev.includes(vaccination)
        ? prev.filter((v) => v !== vaccination)
        : [...prev, vaccination],
    );
  };

  return (
    <div className="space-y-6">
      {/* Visit Type */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Visit Type</p>
        <div className="grid grid-cols-2 gap-3">
          {visitTypes.map((type) => {
            const isSelected = visitType === type.id;
            return (
              <button
                className={`p-4 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-activity-doctor-visit bg-activity-doctor-visit/10'
                    : 'border-border bg-card'
                }`}
                key={type.id}
                onClick={() => setVisitType(type.id)}
                type="button"
              >
                <p className="font-semibold text-sm">{type.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Doctor Name */}
      <div className="space-y-3">
        <Label
          className="text-sm font-medium text-muted-foreground"
          htmlFor="doctor-name"
        >
          Doctor/Provider Name
        </Label>
        <Input
          id="doctor-name"
          onChange={(e) => setDoctorName(e.target.value)}
          placeholder="Dr. Smith"
          type="text"
          value={doctorName}
        />
      </div>

      {/* Location */}
      <div className="space-y-3">
        <Label
          className="text-sm font-medium text-muted-foreground"
          htmlFor="location"
        >
          Location
        </Label>
        <Input
          id="location"
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Pediatric Clinic"
          type="text"
          value={location}
        />
      </div>

      {/* Measurements */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Measurements (optional)
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground" htmlFor="weight">
              Weight ({getWeightUnitLabel(measurementUnit)})
            </Label>
            <Input
              id="weight"
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder={measurementUnit === 'imperial' ? '11.5' : '5.2'}
              step="0.1"
              type="number"
              value={weightInput}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground" htmlFor="length">
              Length ({getLengthUnitLabel(measurementUnit)})
            </Label>
            <Input
              id="length"
              onChange={(e) => setLengthInput(e.target.value)}
              placeholder={measurementUnit === 'imperial' ? '21.7' : '55'}
              step="0.1"
              type="number"
              value={lengthInput}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground" htmlFor="head">
              Head ({getLengthUnitLabel(measurementUnit)})
            </Label>
            <Input
              id="head"
              onChange={(e) => setHeadInput(e.target.value)}
              placeholder={measurementUnit === 'imperial' ? '15' : '38'}
              step="0.1"
              type="number"
              value={headInput}
            />
          </div>
        </div>
      </div>

      {/* Vaccinations */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Vaccinations Given (optional)
        </p>
        <div className="grid grid-cols-2 gap-2">
          {COMMON_VACCINATIONS.map((vaccination) => {
            const isSelected = vaccinations.includes(vaccination);
            return (
              <Button
                className={`h-10 text-sm ${
                  isSelected
                    ? 'bg-activity-doctor-visit text-activity-doctor-visit-foreground hover:bg-activity-doctor-visit/90'
                    : 'bg-transparent'
                }`}
                key={vaccination}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleVaccination(vaccination);
                }}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
              >
                {vaccination}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-3">
        <Label
          className="text-sm font-medium text-muted-foreground"
          htmlFor="notes"
        >
          Notes (optional)
        </Label>
        <Textarea
          className="min-h-24 resize-none"
          id="notes"
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this visit..."
          value={notes}
        />
      </div>
    </div>
  );
}
