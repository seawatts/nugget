'use client';

import { Badge } from '@nugget/ui/badge';
import { Button } from '@nugget/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nugget/ui/card';
import { Checkbox } from '@nugget/ui/checkbox';
import { Icons } from '@nugget/ui/custom/icons';
import { toast } from '@nugget/ui/sonner';
import { Clock, Lightbulb } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  completeTaskAction,
  getPersonalizedTasksAction,
  getTodaysTasksAction,
  type ParentTask,
  uncompleteTaskAction,
} from './parent-tasks/actions';

interface ParentTasksCardProps {
  userId: string;
}

export function ParentTasksCard({ userId }: ParentTasksCardProps) {
  const [tasks, setTasks] = useState<ParentTask[]>([]);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadTodaysTasks = useCallback(async () => {
    setIsLoading(true);
    const result = await getTodaysTasksAction({ userId });
    if (result.data) {
      setTasks(result.data);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    loadTodaysTasks();
  }, [loadTodaysTasks]);

  const handleGenerateNewTasks = async () => {
    setIsGenerating(true);
    const timeOfDay =
      new Date().getHours() < 12
        ? 'morning'
        : new Date().getHours() < 17
          ? 'afternoon'
          : 'evening';

    const result = await getPersonalizedTasksAction({
      timeOfDay: timeOfDay as 'morning' | 'afternoon' | 'evening',
      userId,
    });

    if (result.data) {
      setTasks(result.data.tasks);
      setMotivationalMessage(result.data.motivationalMessage);
      toast.success('New tasks generated!');
    } else {
      toast.error('Failed to generate tasks.');
    }
    setIsGenerating(false);
  };

  const handleToggleTask = async (task: ParentTask) => {
    if (!task.id) return;

    const optimisticTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, completed: !t.completed } : t,
    );
    setTasks(optimisticTasks);

    const result = task.completed
      ? await uncompleteTaskAction({ taskId: task.id })
      : await completeTaskAction({ taskId: task.id });

    if (!result.data?.success) {
      // Revert on error
      setTasks(tasks);
      toast.error('Failed to update task.');
    }
  };

  const categoryColors: Record<ParentTask['category'], string> = {
    baby_care: 'bg-blue-100 text-blue-800',
    household: 'bg-amber-100 text-amber-800',
    preparation: 'bg-purple-100 text-purple-800',
    relationship: 'bg-pink-100 text-pink-800',
    self_care: 'bg-green-100 text-green-800',
  };

  const priorityIcon: Record<ParentTask['priority'], string> = {
    high: '❗',
    low: '💡',
    medium: '⚡',
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Tasks</CardTitle>
          <CardDescription>Loading your personalized tasks...</CardDescription>
        </CardHeader>
        <CardContent>
          <Icons.Spinner className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Today's Tasks</CardTitle>
            <CardDescription>
              {motivationalMessage || 'Your personalized tasks for the day'}
            </CardDescription>
          </div>
          <Button
            disabled={isGenerating}
            onClick={handleGenerateNewTasks}
            size="sm"
            variant="outline"
          >
            {isGenerating ? (
              <Icons.Spinner className="size-4 animate-spin" />
            ) : (
              <Lightbulb className="size-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No tasks yet for today</p>
            <Button onClick={handleGenerateNewTasks} size="sm">
              Generate Tasks
            </Button>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              key={task.id}
            >
              <Checkbox
                checked={task.completed}
                className="mt-1"
                onCheckedChange={() => handleToggleTask(task)}
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {task.taskText}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs">
                      {priorityIcon[task.priority]}
                    </span>
                    <Badge
                      className={categoryColors[task.category]}
                      variant="secondary"
                    >
                      {task.category.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {task.whyItMatters && !task.completed && (
                  <p className="text-xs text-muted-foreground italic">
                    {task.whyItMatters}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {task.estimatedMinutes} min
                  </div>
                  <span>•</span>
                  <span>{task.suggestedTime}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
