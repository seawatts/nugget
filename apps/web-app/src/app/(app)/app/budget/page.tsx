'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import {
  Calendar,
  DollarSign,
  GraduationCap,
  Heart,
  Home,
  Plus,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { BottomNav } from '~/app/(app)/app/_components/bottom-nav';
import { Header } from '~/app/(app)/app/_components/header';

type Tab = 'overview' | 'expenses' | 'planning' | 'savings';

export default function BudgetPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs = [
    { icon: DollarSign, id: 'overview' as Tab, label: 'Overview' },
    { icon: ShoppingCart, id: 'expenses' as Tab, label: 'Expenses' },
    { icon: Calendar, id: 'planning' as Tab, label: 'Planning' },
    { icon: TrendingUp, id: 'savings' as Tab, label: 'Savings' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="px-4 pt-20 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-balance">
              Budget & Finance
            </h1>
            <p className="text-muted-foreground mt-1">
              Track expenses and plan for your baby's future
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  className="flex items-center gap-2 whitespace-nowrap"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'expenses' && <ExpensesTab />}
          {activeTab === 'planning' && <PlanningTab />}
          {activeTab === 'savings' && <SavingsTab />}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function OverviewTab() {
  const monthlyBudget = 1200;
  const spent = 875;
  const remaining = monthlyBudget - spent;
  const percentSpent = (spent / monthlyBudget) * 100;

  const categories = [
    {
      budget: 200,
      color: 'bg-primary',
      icon: ShoppingCart,
      name: 'Diapers & Wipes',
      spent: 180,
    },
    {
      budget: 300,
      color: 'bg-secondary',
      icon: Heart,
      name: 'Formula/Food',
      spent: 250,
    },
    {
      budget: 500,
      color: 'bg-accent',
      icon: Home,
      name: 'Childcare',
      spent: 400,
    },
    {
      budget: 100,
      color: 'bg-chart-4',
      icon: ShoppingCart,
      name: 'Clothing',
      spent: 45,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Monthly Summary */}
      <Card className="p-6 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">This Month</p>
            <h2 className="text-3xl font-bold">${spent.toLocaleString()}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              of ${monthlyBudget.toLocaleString()} budget
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="text-2xl font-bold text-primary">
              ${remaining.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Budget Used</span>
            <span className="font-medium">{percentSpent.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${percentSpent}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <p className="text-sm text-muted-foreground">Avg Monthly</p>
          </div>
          <p className="text-2xl font-bold">$950</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <p className="text-sm text-muted-foreground">Over Budget</p>
          </div>
          <p className="text-2xl font-bold">$0</p>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div>
        <h3 className="font-semibold mb-3">Category Breakdown</h3>
        <div className="space-y-3">
          {categories.map((category) => {
            const percentUsed = (category.spent / category.budget) * 100;
            const Icon = category.icon;
            return (
              <Card className="p-4" key={category.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${category.color}/10`}>
                      <Icon
                        className={`h-4 w-4 ${category.color.replace('bg-', 'text-')}`}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${category.spent} / ${category.budget}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    {percentUsed.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${category.color} rounded-full transition-all`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ExpensesTab() {
  const expenses = [
    {
      amount: 45,
      category: 'Diapers & Wipes',
      date: '2024-03-15',
      item: 'Pampers Size 2',
      recurring: true,
    },
    {
      amount: 85,
      category: 'Formula/Food',
      date: '2024-03-14',
      item: 'Similac Formula',
      recurring: true,
    },
    {
      amount: 25,
      category: 'Clothing',
      date: '2024-03-12',
      item: 'Onesies 3-pack',
      recurring: false,
    },
    {
      amount: 30,
      category: 'Healthcare',
      date: '2024-03-10',
      item: 'Pediatrician Visit',
      recurring: false,
    },
    {
      amount: 400,
      category: 'Childcare',
      date: '2024-03-08',
      item: 'Daycare - Week 1',
      recurring: true,
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-primary/10 border-primary/20">
        <div className="flex items-start gap-3">
          <ShoppingCart className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-semibold text-primary">Track Every Expense</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Stay on top of your baby budget
            </p>
          </div>
        </div>
      </Card>

      <Button className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Expense
      </Button>

      <div>
        <h3 className="font-semibold mb-3">Recent Expenses</h3>
        <div className="space-y-2">
          {expenses.map((expense) => (
            <Card className="p-4" key={`${expense.item}-${expense.date}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{expense.item}</p>
                  <p className="text-sm text-muted-foreground">
                    {expense.category}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {expense.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">${expense.amount}</p>
                  {expense.recurring && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Recurring
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanningTab() {
  const upcomingExpenses = [
    {
      amount: 500,
      category: 'Childcare',
      dueDate: '2024-04-01',
      item: 'Daycare Deposit',
    },
    {
      amount: 30,
      category: 'Healthcare',
      dueDate: '2024-04-15',
      item: '6-Month Checkup',
    },
    {
      amount: 150,
      category: 'Clothing',
      dueDate: '2024-05-01',
      item: 'Summer Clothes',
    },
  ];

  const yearlyProjection = [
    { category: 'Diapers & Wipes', monthly: 200, yearly: 2400 },
    { category: 'Formula/Food', monthly: 300, yearly: 3600 },
    { category: 'Childcare', monthly: 500, yearly: 6000 },
    { category: 'Healthcare', monthly: 100, yearly: 1200 },
    { category: 'Clothing', monthly: 100, yearly: 1200 },
    { category: 'Toys & Books', monthly: 50, yearly: 600 },
  ];

  const totalYearly = yearlyProjection.reduce(
    (sum, item) => sum + item.yearly,
    0,
  );

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/20">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Projected First Year Cost
          </p>
          <h2 className="text-4xl font-bold mt-2">
            ${totalYearly.toLocaleString()}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            ${(totalYearly / 12).toLocaleString()}/month average
          </p>
        </div>
      </Card>

      <div>
        <h3 className="font-semibold mb-3">Upcoming Expenses</h3>
        <div className="space-y-2">
          {upcomingExpenses.map((expense) => (
            <Card className="p-4" key={`${expense.item}-${expense.dueDate}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{expense.item}</p>
                  <p className="text-sm text-muted-foreground">
                    {expense.category}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Due: {expense.dueDate}
                  </p>
                </div>
                <p className="text-lg font-bold">${expense.amount}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Yearly Projection</h3>
        <div className="space-y-2">
          {yearlyProjection.map((item) => (
            <Card className="p-4" key={item.category}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.category}</p>
                  <p className="text-sm text-muted-foreground">
                    ${item.monthly}/month
                  </p>
                </div>
                <p className="text-lg font-bold">
                  ${item.yearly.toLocaleString()}/year
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-2">Maternity/Paternity Leave</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Plan your finances during parental leave
        </p>
        <div className="space-y-3">
          <div>
            <Label>Leave Duration (weeks)</Label>
            <Input className="mt-1" placeholder="12" type="number" />
          </div>
          <div>
            <Label>Paid Leave Percentage</Label>
            <Input className="mt-1" placeholder="60" type="number" />
          </div>
          <Button
            className="w-full mt-2 bg-transparent"
            size="sm"
            variant="outline"
          >
            Calculate Leave Budget
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SavingsTab() {
  const savingsGoals = [
    {
      color: 'bg-primary',
      current: 2500,
      goal: 5000,
      icon: Heart,
      name: 'Emergency Fund',
    },
    {
      color: 'bg-secondary',
      current: 1200,
      goal: 50000,
      icon: GraduationCap,
      name: 'College Fund (529)',
    },
    {
      color: 'bg-accent',
      current: 800,
      goal: 2000,
      icon: Home,
      name: 'Childcare Reserve',
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-primary/10 border-primary/20">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-semibold text-primary">
              Build Your Baby's Future
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Set savings goals and track progress
            </p>
          </div>
        </div>
      </Card>

      {savingsGoals.map((goal) => {
        const percentComplete = (goal.current / goal.goal) * 100;
        const Icon = goal.icon;
        return (
          <Card className="p-4" key={goal.name}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${goal.color}/10`}>
                  <Icon
                    className={`h-5 w-5 ${goal.color.replace('bg-', 'text-')}`}
                  />
                </div>
                <div>
                  <p className="font-semibold">{goal.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ${goal.current.toLocaleString()} / $
                    {goal.goal.toLocaleString()}
                  </p>
                </div>
              </div>
              <span className="text-sm font-medium">
                {percentComplete.toFixed(0)}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${goal.color} rounded-full transition-all`}
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </Card>
        );
      })}

      <Button className="w-full bg-transparent" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Savings Goal
      </Button>

      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-2">529 College Savings Plan</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Start saving early for your child's education. Even small monthly
          contributions can grow significantly over 18 years.
        </p>
        <div className="space-y-3">
          <div>
            <Label>Monthly Contribution</Label>
            <Input className="mt-1" placeholder="100" type="number" />
          </div>
          <div>
            <Label>Expected Annual Return (%)</Label>
            <Input className="mt-1" placeholder="7" type="number" />
          </div>
          <Button
            className="w-full mt-2 bg-transparent"
            size="sm"
            variant="outline"
          >
            Calculate 18-Year Projection
          </Button>
        </div>
      </Card>

      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-2">Tax Benefits</h3>
        <p className="text-sm text-muted-foreground">
          Don't forget to claim tax deductions for childcare expenses, dependent
          care FSA, and child tax credits.
        </p>
      </Card>
    </div>
  );
}
