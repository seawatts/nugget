'use client';

import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { cn } from '@nugget/ui/lib/utils';
import { Filter, Heart, Search, Sparkles, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';
import { BottomNav } from '~/app/(app)/app/_components/bottom-nav';
import { Header } from '~/app/(app)/app/_components/header';

const tabs = [
  { id: 'discover', label: 'Discover' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'compare', label: 'Compare' },
];

const popularNames = [
  {
    favorited: false,
    gender: 'Girl',
    meaning: 'Olive tree',
    name: 'Olivia',
    origin: 'Latin',
    popularity: 1,
    syllables: 4,
    trend: 'stable',
  },
  {
    favorited: false,
    gender: 'Boy',
    meaning: 'Strong-willed warrior',
    name: 'Liam',
    origin: 'Irish',
    popularity: 1,
    syllables: 2,
    trend: 'up',
  },
  {
    favorited: true,
    gender: 'Girl',
    meaning: 'Universal',
    name: 'Emma',
    origin: 'German',
    popularity: 2,
    syllables: 2,
    trend: 'down',
  },
  {
    favorited: false,
    gender: 'Boy',
    meaning: 'Rest, comfort',
    name: 'Noah',
    origin: 'Hebrew',
    popularity: 2,
    syllables: 2,
    trend: 'stable',
  },
  {
    favorited: true,
    gender: 'Girl',
    meaning: 'Life',
    name: 'Ava',
    origin: 'Latin',
    popularity: 3,
    syllables: 2,
    trend: 'up',
  },
  {
    favorited: false,
    gender: 'Boy',
    meaning: 'My God is Yahweh',
    name: 'Elijah',
    origin: 'Hebrew',
    popularity: 4,
    syllables: 3,
    trend: 'up',
  },
];

export default function NamesPage() {
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<'all' | 'boy' | 'girl'>(
    'all',
  );
  const [names, setNames] = useState(popularNames);

  const toggleFavorite = (nameName: string) => {
    setNames((prev) =>
      prev.map((n) =>
        n.name === nameName ? { ...n, favorited: !n.favorited } : n,
      ),
    );
  };

  const filteredNames = names.filter((name) => {
    const matchesSearch = name.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesGender =
      selectedGender === 'all' || name.gender.toLowerCase() === selectedGender;
    return matchesSearch && matchesGender;
  });

  const favorites = names.filter((n) => n.favorited);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="px-4 pt-20 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Baby Name Picker
            </h1>
            <p className="text-muted-foreground">
              Find the perfect name for your little one
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <Button
                className="whitespace-nowrap"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'default' : 'outline'}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Discover Tab */}
          {activeTab === 'discover' && (
            <div className="space-y-4">
              <Card className="p-6 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">
                    Name Generator
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Get personalized name suggestions based on your preferences
                </p>
                <Button className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Names
                </Button>
              </Card>

              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    className="w-full bg-muted rounded-lg pl-10 pr-4 py-3 text-foreground border border-border"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search names..."
                    type="text"
                    value={searchQuery}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedGender('all')}
                    size="sm"
                    variant={selectedGender === 'all' ? 'default' : 'outline'}
                  >
                    All
                  </Button>
                  <Button
                    onClick={() => setSelectedGender('boy')}
                    size="sm"
                    variant={selectedGender === 'boy' ? 'default' : 'outline'}
                  >
                    Boy
                  </Button>
                  <Button
                    onClick={() => setSelectedGender('girl')}
                    size="sm"
                    variant={selectedGender === 'girl' ? 'default' : 'outline'}
                  >
                    Girl
                  </Button>
                  <Button
                    className="ml-auto bg-transparent"
                    size="sm"
                    variant="outline"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>

              {/* Name Cards */}
              <div className="space-y-3">
                {filteredNames.map((name) => (
                  <Card className="p-6" key={name.name}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-foreground">
                            {name.name}
                          </h3>
                          <span
                            className={cn(
                              'text-xs px-2 py-1 rounded',
                              name.gender === 'Boy'
                                ? 'bg-primary/20 text-primary'
                                : 'bg-accent/20 text-accent',
                            )}
                          >
                            {name.gender}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          <span className="font-medium">Origin:</span>{' '}
                          {name.origin}
                        </p>
                        <p className="text-sm text-foreground mb-3">
                          <span className="font-medium">Meaning:</span>{' '}
                          {name.meaning}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            <span>#{name.popularity} in popularity</span>
                          </div>
                          <span>{name.syllables} syllables</span>
                        </div>
                      </div>
                      <Button
                        className={cn(name.favorited && 'text-red-500')}
                        onClick={() => toggleFavorite(name.name)}
                        size="icon"
                        variant="ghost"
                      >
                        <Heart
                          className={cn(
                            'h-6 w-6',
                            name.favorited && 'fill-current',
                          )}
                        />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div className="space-y-4">
              {favorites.length === 0 ? (
                <Card className="p-12 text-center">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No favorites yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start adding names to your favorites to see them here
                  </p>
                  <Button onClick={() => setActiveTab('discover')}>
                    Discover Names
                  </Button>
                </Card>
              ) : (
                <>
                  <Card className="p-6 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30">
                    <div className="flex items-center gap-3">
                      <Heart className="h-6 w-6 text-primary fill-current" />
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">
                          Your Favorites
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {favorites.length} name
                          {favorites.length !== 1 ? 's' : ''} saved
                        </p>
                      </div>
                    </div>
                  </Card>

                  {favorites.map((name) => (
                    <Card className="p-6" key={name.name}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-foreground">
                              {name.name}
                            </h3>
                            <span
                              className={cn(
                                'text-xs px-2 py-1 rounded',
                                name.gender === 'Boy'
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-accent/20 text-accent',
                              )}
                            >
                              {name.gender}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            <span className="font-medium">Origin:</span>{' '}
                            {name.origin}
                          </p>
                          <p className="text-sm text-foreground mb-3">
                            <span className="font-medium">Meaning:</span>{' '}
                            {name.meaning}
                          </p>
                        </div>
                        <Button
                          className="text-red-500"
                          onClick={() => toggleFavorite(name.name)}
                          size="icon"
                          variant="ghost"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Compare Tab */}
          {activeTab === 'compare' && (
            <div className="space-y-4">
              <Card className="p-6 bg-gradient-to-br from-accent/20 to-primary/20 border-accent/30">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Compare Names
                </h2>
                <p className="text-sm text-muted-foreground">
                  Select names from your favorites to compare side by side
                </p>
              </Card>

              {favorites.length < 2 ? (
                <Card className="p-12 text-center">
                  <div className="text-muted-foreground mb-4">
                    <div className="flex justify-center gap-2 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <Heart className="h-8 w-8" />
                      </div>
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <Heart className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Add more favorites to compare
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You need at least 2 favorite names to use the comparison
                    feature
                  </p>
                  <Button onClick={() => setActiveTab('discover')}>
                    Discover Names
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {favorites.slice(0, 2).map((name) => (
                    <Card className="p-4" key={name.name}>
                      <h3 className="text-xl font-bold text-foreground mb-3 text-center">
                        {name.name}
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Gender</p>
                          <p className="text-foreground font-medium">
                            {name.gender}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Origin</p>
                          <p className="text-foreground font-medium">
                            {name.origin}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Meaning</p>
                          <p className="text-foreground font-medium">
                            {name.meaning}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Popularity</p>
                          <p className="text-foreground font-medium">
                            #{name.popularity}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Syllables</p>
                          <p className="text-foreground font-medium">
                            {name.syllables}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
