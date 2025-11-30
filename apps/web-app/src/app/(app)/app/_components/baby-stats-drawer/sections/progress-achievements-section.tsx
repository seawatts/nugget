import { Badge } from '@nugget/ui/badge';
import { Card } from '@nugget/ui/card';
import { Target } from 'lucide-react';
import type { Achievement, Streaks } from '../types';

interface ProgressAchievementsSectionProps {
  level: { level: number; name: string };
  totalActivities: number;
  achievements: Array<Achievement>;
  streaks: Streaks;
}

export function ProgressAchievementsSection({
  level,
  totalActivities,
  achievements,
  streaks,
}: ProgressAchievementsSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Progress & Achievements
        </h3>
      </div>

      {/* Level Card */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground">
          Your Level
        </h4>
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Level {level.level}
              </div>
              <div className="text-2xl font-bold text-foreground">
                {level.name}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {totalActivities} activities logged
              </div>
            </div>
            <div className="text-4xl">🏅</div>
          </div>
        </Card>
      </div>

      {/* Achievement Badges */}
      {achievements.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground">
            Achievements
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {achievements.map((achievement) => (
              <Card
                className={`p-3 ${
                  achievement.earned
                    ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20'
                    : 'opacity-60'
                }`}
                key={achievement.id}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{achievement.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {achievement.name}
                    </div>
                    {!achievement.earned && (
                      <div className="text-xs text-muted-foreground">
                        {Math.round(achievement.progress)}% complete
                      </div>
                    )}
                    {achievement.earned && (
                      <Badge className="text-xs mt-1" variant="secondary">
                        Earned
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Streaks */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground">Streaks</h4>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">
              Feeding Streak
            </div>
            <div className="text-2xl font-bold text-foreground">
              {streaks.feeding.current} days
            </div>
            {streaks.feeding.longest > streaks.feeding.current && (
              <div className="text-xs text-muted-foreground mt-1">
                Best: {streaks.feeding.longest} days
              </div>
            )}
            {streaks.feeding.current >= 7 && (
              <div className="text-xs text-primary mt-1">🔥 On fire!</div>
            )}
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">
              Diaper Streak
            </div>
            <div className="text-2xl font-bold text-foreground">
              {streaks.diaper.current} days
            </div>
            {streaks.diaper.longest > streaks.diaper.current && (
              <div className="text-xs text-muted-foreground mt-1">
                Best: {streaks.diaper.longest} days
              </div>
            )}
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">
              Sleep Streak
            </div>
            <div className="text-2xl font-bold text-foreground">
              {streaks.sleep.current} days
            </div>
            {streaks.sleep.longest > streaks.sleep.current && (
              <div className="text-xs text-muted-foreground mt-1">
                Best: {streaks.sleep.longest} days
              </div>
            )}
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">
              Perfect Day Streak
            </div>
            <div className="text-2xl font-bold text-foreground">
              {streaks.perfectDay.current} days
            </div>
            {streaks.perfectDay.longest > streaks.perfectDay.current && (
              <div className="text-xs text-muted-foreground mt-1">
                Best: {streaks.perfectDay.longest} days
              </div>
            )}
            {streaks.perfectDay.current >= 3 && (
              <div className="text-xs text-primary mt-1">⭐ Perfect!</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
