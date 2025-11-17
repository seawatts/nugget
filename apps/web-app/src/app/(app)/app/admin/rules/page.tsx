'use client';

import { Badge } from '@nugget/ui/badge';
import { Button } from '@nugget/ui/button';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Code,
  Eye,
  FileText,
  Filter,
  Plus,
  Search,
  Target,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useState } from 'react';

// Mock data representing the dynamic content rules
type EditableCondition = {
  id: string;
  type: string;
  value: string;
};

type EditableRule = {
  conditions: EditableCondition[];
  priority: number;
  props: Record<string, string>;
  screen: string;
  slot: string;
  template: string;
};

const mockRules = [
  {
    conditions: [
      { type: 'scope', value: 'Pregnancy' },
      { type: 'week.between', value: '28-32' },
    ],
    id: 'rule_1',
    priority: 60,
    props: {
      deeplink: 'nugget://nursery',
      headline: 'Start your nursery',
      subtext: "You're in the perfect window to plan your baby's space",
    },
    screen: 'Pregnancy',
    slot: 'Callout',
    status: 'active',
    template: 'CTA.GoTo',
  },
  {
    conditions: [
      { type: 'scope', value: 'Pregnancy' },
      { type: 'week.gte', value: '39' },
      { type: 'notDone', value: 'hospital_bag' },
    ],
    id: 'rule_2',
    priority: 80,
    props: {
      deeplink: 'nugget://hospital',
      label: 'Finish packing your hospital bag',
      percent: 'compute(progress.hospital_bag)',
    },
    screen: 'Hospital',
    slot: 'Banner',
    status: 'active',
    template: 'Card.Progress',
  },
  {
    conditions: [
      { type: 'scope', value: 'Pregnancy' },
      { type: 'week.eq', value: '30' },
    ],
    id: 'rule_3',
    priority: 50,
    props: {
      body: 'aiTextBaml(WeeklySummary, ttl: 7d)',
      title: 'Week 30 Update',
    },
    screen: 'Pregnancy',
    slot: 'WeekSummary',
    status: 'active',
    template: 'Card.WeekSummary',
  },
  {
    conditions: [
      { type: 'scope', value: 'Postpartum' },
      { type: 'postpartum.day.eq', value: '0' },
    ],
    id: 'rule_4',
    priority: 90,
    props: {
      body: 'aiTextBaml(PostpartumDay0, ttl: 7d)',
      title: 'Welcome to parenthood!',
    },
    screen: 'Postpartum',
    slot: 'DailySummary',
    status: 'active',
    template: 'Card.Success',
  },
  {
    conditions: [
      { type: 'scope', value: 'Pregnancy' },
      { type: 'stale', value: 'hospital_bag > 3d' },
    ],
    id: 'rule_5',
    priority: 70,
    props: {
      deeplink: 'nugget://hospital',
      headline: 'Update your hospital bag',
      subtext: "It's been a while since you checked this",
    },
    screen: 'Hospital',
    slot: 'Reminder',
    status: 'active',
    template: 'CTA.GoTo',
  },
  {
    conditions: [
      { type: 'scope', value: 'Postpartum' },
      { type: 'postpartum.week.between', value: '0-12' },
    ],
    id: 'rule_6',
    priority: 85,
    props: {
      body: 'aiTextBaml(PostpartumWeekly, ttl: 7d)',
      title: 'Week $postpartum.week recap',
    },
    screen: 'Postpartum',
    slot: 'WeeklySummary',
    status: 'active',
    template: 'Card.WeekSummary',
  },
];

export default function AdminRulesPage() {
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newRule, setNewRule] = useState<EditableRule>({
    conditions: [createEmptyCondition()],
    priority: 50,
    props: {} as Record<string, string>,
    screen: '',
    slot: '',
    template: '',
  });

  const screens = Array.from(new Set(mockRules.map((r) => r.screen)));
  const slots = Array.from(new Set(mockRules.map((r) => r.slot)));

  const filteredRules = mockRules.filter((rule) => {
    const matchesScreen = !selectedScreen || rule.screen === selectedScreen;
    const matchesSlot = !selectedSlot || rule.slot === selectedSlot;
    const matchesSearch =
      !searchQuery ||
      rule.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(rule.props)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesScreen && matchesSlot && matchesSearch;
  });

  const getConditionIcon = (type: string) => {
    if (type.includes('week') || type.includes('day'))
      return <Calendar className="h-4 w-4" />;
    if (type === 'scope') return <Target className="h-4 w-4" />;
    if (type.includes('progress')) return <BarChart3 className="h-4 w-4" />;
    if (type === 'stale') return <Clock className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };

  const getTemplateColor = (template: string) => {
    if (template.includes('CTA'))
      return 'bg-accent/20 text-accent border-accent/30';
    if (template.includes('Progress'))
      return 'bg-chart-2/20 text-chart-2 border-chart-2/30';
    if (template.includes('Success'))
      return 'bg-primary/20 text-primary border-primary/30';
    if (template.includes('WeekSummary'))
      return 'bg-chart-5/20 text-chart-5 border-chart-5/30';
    return 'bg-muted text-muted-foreground';
  };

  function createEmptyCondition(): EditableCondition {
    return {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2, 10),
      type: '',
      value: '',
    };
  }

  const addCondition = () => {
    setNewRule((prev) => ({
      ...prev,
      conditions: [...prev.conditions, createEmptyCondition()],
    }));
  };

  const removeCondition = (conditionId: string) => {
    setNewRule((prev) => ({
      ...prev,
      conditions: prev.conditions.filter(
        (condition) => condition.id !== conditionId,
      ),
    }));
  };

  const updateCondition = (
    conditionId: string,
    field: 'type' | 'value',
    value: string,
  ) => {
    setNewRule((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition) =>
        condition.id === conditionId
          ? { ...condition, [field]: value }
          : condition,
      ),
    }));
  };

  const addProp = (key: string, value: string) => {
    setNewRule((prev) => ({
      ...prev,
      props: { ...prev.props, [key]: value },
    }));
  };

  const removeProp = (key: string) => {
    setNewRule((prev) => {
      const { [key]: _, ...rest } = prev.props;
      return { ...prev, props: rest };
    });
  };

  const handleSaveRule = () => {
    setIsDrawerOpen(false);
    setNewRule({
      conditions: [createEmptyCondition()],
      priority: 50,
      props: {} as Record<string, string>,
      screen: '',
      slot: '',
      template: '',
    });
  };

  const handleDrawerOverlayKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsDrawerOpen(false);
    }
  };

  return (
    <>
      <main className="px-4 py-6 space-y-6">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Dynamic Content Rules
            </h1>
            <p className="text-muted-foreground mt-2">
              View and manage contextual content rules for the app
            </p>
          </div>
          <Button
            className="rounded-full"
            onClick={() => setIsDrawerOpen(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Rule
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="text-2xl font-bold text-foreground">
              {mockRules.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total Rules
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="text-2xl font-bold text-primary">
              {mockRules.filter((r) => r.status === 'active').length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Active</div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="text-2xl font-bold text-foreground">
              {screens.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Screens</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rules..."
              type="text"
              value={searchQuery}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              className="rounded-full"
              onClick={() => setSelectedScreen(null)}
              size="sm"
              variant={!selectedScreen ? 'default' : 'outline'}
            >
              All Screens
            </Button>
            {screens.map((screen) => (
              <Button
                className="rounded-full whitespace-nowrap"
                key={screen}
                onClick={() => setSelectedScreen(screen)}
                size="sm"
                variant={selectedScreen === screen ? 'default' : 'outline'}
              >
                {screen}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              className="rounded-full"
              onClick={() => setSelectedSlot(null)}
              size="sm"
              variant={!selectedSlot ? 'default' : 'outline'}
            >
              All Slots
            </Button>
            {slots.map((slot) => (
              <Button
                className="rounded-full whitespace-nowrap"
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                size="sm"
                variant={selectedSlot === slot ? 'default' : 'outline'}
              >
                {slot}
              </Button>
            ))}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode('cards')}
            size="sm"
            variant={viewMode === 'cards' ? 'default' : 'outline'}
          >
            <Eye className="h-4 w-4 mr-2" />
            Cards
          </Button>
          <Button
            onClick={() => setViewMode('table')}
            size="sm"
            variant={viewMode === 'table' ? 'default' : 'outline'}
          >
            <Code className="h-4 w-4 mr-2" />
            JSON
          </Button>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          {filteredRules.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No rules match your filters
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            filteredRules.map((rule) => (
              <div
                className="bg-card border border-border rounded-2xl p-5 space-y-4"
                key={rule.id}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">
                        {rule.id}
                      </h3>
                      <Badge className="text-xs" variant="outline">
                        Priority {rule.priority}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="text-xs" variant="secondary">
                        {rule.screen} / {rule.slot}
                      </Badge>
                      <Badge
                        className={`text-xs border ${getTemplateColor(rule.template)}`}
                      >
                        {rule.template}
                      </Badge>
                    </div>
                  </div>
                  {rule.status === 'active' && (
                    <div className="flex items-center gap-1 text-primary">
                      <Zap className="h-4 w-4" />
                      <span className="text-xs font-medium">Active</span>
                    </div>
                  )}
                </div>

                {/* Conditions */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Conditions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {rule.conditions.map((cond) => (
                      <div
                        className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm"
                        key={`${rule.id}-${cond.type}-${cond.value}`}
                      >
                        {getConditionIcon(cond.type)}
                        <span className="font-mono text-xs">
                          {cond.type}:{' '}
                          <span className="text-primary">{cond.value}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Props Preview */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Content
                  </h4>
                  <div className="bg-muted rounded-lg p-3 space-y-2">
                    {Object.entries(rule.props).map(([key, value]) => (
                      <div className="text-sm" key={key}>
                        <span className="font-medium text-foreground">
                          {key}:
                        </span>{' '}
                        <span className="text-muted-foreground">
                          {typeof value === 'string' && value.length > 50
                            ? `${value.substring(0, 50)}...`
                            : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-card border border-border rounded-2xl p-5">
              <pre className="text-xs font-mono text-foreground overflow-x-auto">
                {JSON.stringify(filteredRules, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <button
            aria-label="Close create rule drawer"
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setIsDrawerOpen(false)}
            onKeyDown={handleDrawerOverlayKeyDown}
            type="button"
          />

          {/* Drawer */}
          <div className="fixed inset-x-0 bottom-0 top-0 bg-background z-50 overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border px-4 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                Create New Rule
              </h2>
              <button
                className="p-2 hover:bg-muted rounded-full"
                onClick={() => setIsDrawerOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 py-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">
                  Basic Information
                </h3>

                <div>
                  <label
                    className="block text-sm font-medium text-foreground mb-2"
                    htmlFor="rule-screen"
                  >
                    Screen
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    id="rule-screen"
                    onChange={(e) =>
                      setNewRule({ ...newRule, screen: e.target.value })
                    }
                    value={newRule.screen}
                  >
                    <option value="">Select screen...</option>
                    <option value="Pregnancy">Pregnancy</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Postpartum">Postpartum</option>
                    <option value="Home">Home</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-foreground mb-2"
                    htmlFor="rule-slot"
                  >
                    Slot
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    id="rule-slot"
                    onChange={(e) =>
                      setNewRule({ ...newRule, slot: e.target.value })
                    }
                    value={newRule.slot}
                  >
                    <option value="">Select slot...</option>
                    <option value="Banner">Banner</option>
                    <option value="Callout">Callout</option>
                    <option value="WeekSummary">Week Summary</option>
                    <option value="DailySummary">Daily Summary</option>
                    <option value="Reminder">Reminder</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-foreground mb-2"
                    htmlFor="rule-priority"
                  >
                    Priority (0-100)
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    id="rule-priority"
                    max="100"
                    min="0"
                    onChange={(e) =>
                      setNewRule({
                        ...newRule,
                        priority: Number.parseInt(e.target.value, 10),
                      })
                    }
                    type="number"
                    value={newRule.priority}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-foreground mb-2"
                    htmlFor="rule-template"
                  >
                    Template
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    id="rule-template"
                    onChange={(e) =>
                      setNewRule({ ...newRule, template: e.target.value })
                    }
                    value={newRule.template}
                  >
                    <option value="">Select template...</option>
                    <option value="CTA.GoTo">CTA.GoTo</option>
                    <option value="Card.Progress">Card.Progress</option>
                    <option value="Card.WeekSummary">Card.WeekSummary</option>
                    <option value="Card.Success">Card.Success</option>
                    <option value="Card.Hidden">Card.Hidden</option>
                  </select>
                </div>
              </div>

              {/* Conditions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Conditions</h3>
                  <Button
                    className="rounded-full bg-transparent"
                    onClick={addCondition}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                {newRule.conditions.map((condition, index) => {
                  const typeInputId = `rule-condition-${condition.id}-type`;
                  const valueInputId = `rule-condition-${condition.id}-value`;
                  return (
                    <div
                      className="bg-card border border-border rounded-xl p-4 space-y-3"
                      key={condition.id}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Condition {index + 1}
                        </span>
                        {newRule.conditions.length > 1 && (
                          <button
                            className="p-1 hover:bg-muted rounded-full"
                            onClick={() => removeCondition(condition.id)}
                            type="button"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                        )}
                      </div>

                      <div>
                        <label
                          className="block text-xs text-muted-foreground mb-1"
                          htmlFor={typeInputId}
                        >
                          Type
                        </label>
                        <input
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          id={typeInputId}
                          onChange={(e) =>
                            updateCondition(
                              condition.id,
                              'type',
                              e.target.value,
                            )
                          }
                          placeholder="e.g., scope, week.between, notDone"
                          type="text"
                          value={condition.type}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-xs text-muted-foreground mb-1"
                          htmlFor={valueInputId}
                        >
                          Value
                        </label>
                        <input
                          className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          id={valueInputId}
                          onChange={(e) =>
                            updateCondition(
                              condition.id,
                              'value',
                              e.target.value,
                            )
                          }
                          placeholder="e.g., Pregnancy, 28-32, hospital_bag"
                          type="text"
                          value={condition.value}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Content Props */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">
                  Content Properties
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add key-value pairs for the template content (e.g., headline,
                  body, deeplink)
                </p>

                <div className="space-y-3">
                  {Object.entries(newRule.props).map(([key, value]) => (
                    <div className="flex gap-2" key={key}>
                      <input
                        className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground"
                        disabled
                        type="text"
                        value={key}
                      />
                      <input
                        className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        onChange={(e) => addProp(key, e.target.value)}
                        type="text"
                        value={value}
                      />
                      <button
                        className="p-2 hover:bg-muted rounded-lg"
                        onClick={() => removeProp(key)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <input
                      className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      id="new-prop-key"
                      placeholder="Property key (e.g., headline)"
                      type="text"
                    />
                    <input
                      className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      id="new-prop-value"
                      placeholder="Property value"
                      type="text"
                    />
                    <Button
                      className="rounded-lg"
                      onClick={() => {
                        const keyInput = document.getElementById(
                          'new-prop-key',
                        ) as HTMLInputElement;
                        const valueInput = document.getElementById(
                          'new-prop-value',
                        ) as HTMLInputElement;
                        if (keyInput.value && valueInput.value) {
                          addProp(keyInput.value, valueInput.value);
                          keyInput.value = '';
                          valueInput.value = '';
                        }
                      }}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1 rounded-xl py-6"
                  onClick={handleSaveRule}
                >
                  Save Rule
                </Button>
                <Button
                  className="flex-1 rounded-xl py-6"
                  onClick={() => setIsDrawerOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
