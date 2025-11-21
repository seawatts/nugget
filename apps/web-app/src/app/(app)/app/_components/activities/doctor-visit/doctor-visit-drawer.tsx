'use client';

import { api } from '@nugget/api/react';
import { Badge } from '@nugget/ui/badge';
import { Button } from '@nugget/ui/button';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import { Textarea } from '@nugget/ui/textarea';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getLengthUnitLabel,
  getWeightUnitLabel,
  inchesToCm,
  lbsToKg,
} from '../shared/measurement-utils';
import { categorizeVaccines, getVaccineDisplayInfo } from './vaccine-utils';

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
  babyAgeDays?: number | null;
  vaccinationHistory?: string[];
}

export function DoctorVisitDrawerContent({
  onDataChange,
  initialData,
  babyAgeDays,
  vaccinationHistory = [],
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
  const [customVaccine, setCustomVaccine] = useState('');

  // Categorize vaccines based on baby's age and history
  const vaccineCategories = useMemo(() => {
    return categorizeVaccines(babyAgeDays ?? null, vaccinationHistory);
  }, [babyAgeDays, vaccinationHistory]);

  // Get list of vaccines to display (age-appropriate + any custom ones user has added)
  const displayVaccines = useMemo(() => {
    const recommendedSet = new Set(vaccineCategories.recommended);
    const customVaccines = vaccinations.filter((v) => !recommendedSet.has(v));
    return [...vaccineCategories.recommended, ...customVaccines];
  }, [vaccineCategories.recommended, vaccinations]);

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

  const addCustomVaccine = () => {
    const trimmed = customVaccine.trim();
    if (trimmed && !vaccinations.includes(trimmed)) {
      setVaccinations((prev) => [...prev, trimmed]);
      setCustomVaccine('');
    }
  };

  const handleCustomVaccineKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomVaccine();
    }
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
        {displayVaccines.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {displayVaccines.map((vaccination) => {
              const isSelected = vaccinations.includes(vaccination);
              const alreadyGiven =
                vaccineCategories.alreadyGiven.includes(vaccination);
              const displayInfo = getVaccineDisplayInfo(
                vaccination,
                isSelected,
                alreadyGiven,
              );

              return (
                <div className="relative" key={vaccination}>
                  <Button
                    className={`h-auto min-h-10 text-sm w-full ${
                      isSelected
                        ? 'bg-activity-doctor-visit text-activity-doctor-visit-foreground hover:bg-activity-doctor-visit/90'
                        : 'bg-transparent'
                    } ${displayInfo.className}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleVaccination(vaccination);
                    }}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                  >
                    <div className="flex flex-col items-center gap-1 py-1">
                      <span>{displayInfo.label}</span>
                      {displayInfo.showBadge && !isSelected && (
                        <Badge
                          className="text-xs px-1.5 py-0"
                          variant="secondary"
                        >
                          {displayInfo.badgeText}
                        </Badge>
                      )}
                    </div>
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No age-appropriate vaccines found. Add custom vaccines below.
          </p>
        )}

        {/* Add custom vaccine input */}
        <div className="flex gap-2 mt-3">
          <Input
            onChange={(e) => setCustomVaccine(e.target.value)}
            onKeyDown={handleCustomVaccineKeyDown}
            placeholder="Add other vaccine..."
            type="text"
            value={customVaccine}
          />
          <Button
            disabled={!customVaccine.trim()}
            onClick={addCustomVaccine}
            type="button"
            variant="outline"
          >
            Add
          </Button>
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
