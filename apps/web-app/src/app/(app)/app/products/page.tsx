import { Badge } from '@nugget/ui/badge';
import { Button } from '@nugget/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nugget/ui/card';
import { Package, ShoppingBag, Star, TrendingUp } from 'lucide-react';

export default function ProductsPage() {
  const productCategories = [
    {
      description: "Everything for your baby's room",
      icon: Package,
      id: 'nursery',
      itemCount: 24,
      title: 'Nursery Essentials',
    },
    {
      description: 'Bottles, pumps, and more',
      icon: Package,
      id: 'feeding',
      itemCount: 18,
      title: 'Feeding & Nursing',
    },
    {
      description: 'Keep your baby safe and sound',
      icon: Package,
      id: 'safety',
      itemCount: 12,
      title: 'Safety & Monitors',
    },
    {
      description: 'Comfortable and cute outfits',
      icon: Package,
      id: 'clothing',
      itemCount: 45,
      title: 'Baby Clothing',
    },
  ];

  const featuredProducts = [
    {
      badge: 'Trending',
      id: 1,
      image: '/baby-monitor.jpg',
      name: 'Smart Baby Monitor',
      price: '$199.99',
      rating: 4.8,
      reviews: 234,
    },
    {
      badge: 'Best Seller',
      id: 2,
      image: '/baby-onesies.jpg',
      name: 'Organic Cotton Onesies Set',
      price: '$34.99',
      rating: 4.9,
      reviews: 567,
    },
    {
      badge: 'Top Rated',
      id: 3,
      image: '/cozy-baby-crib.png',
      name: 'Convertible Crib',
      price: '$349.99',
      rating: 4.7,
      reviews: 189,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-balance">Products</h1>
              <p className="text-muted-foreground">
                Curated essentials for your baby journey
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Categories */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Shop by Category</h2>
          <div className="grid grid-cols-2 gap-4">
            {productCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  key={category.id}
                >
                  <CardHeader className="pb-3">
                    <div className="p-2 bg-primary/10 rounded-xl w-fit mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">
                      {category.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {category.itemCount} items
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Featured Products */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Featured Products</h2>
            <Button size="sm" variant="ghost">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {featuredProducts.map((product) => (
              <Card className="overflow-hidden" key={product.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-xl overflow-hidden">
                      <img
                        alt={product.name}
                        className="w-full h-full object-cover"
                        src={product.image || '/placeholder.svg'}
                      />
                      <Badge className="absolute top-2 left-2 text-xs">
                        {product.badge}
                      </Badge>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-sm mb-1">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">
                              {product.rating}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({product.reviews} reviews)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                          {product.price}
                        </span>
                        <Button size="sm">Add to Cart</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Trending Products */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Trending This Week</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <Card className="overflow-hidden" key={item}>
                <div className="aspect-square bg-muted">
                  <img
                    alt={`Trending product ${item}`}
                    className="w-full h-full object-cover"
                    src={`/baby-product-.jpg?height=200&width=200&query=baby product ${item}`}
                  />
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium mb-1 line-clamp-2">
                    Baby Product Name {item}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">
                      $29.99
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">4.5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
