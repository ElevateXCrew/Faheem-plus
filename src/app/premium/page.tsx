'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Lock, Crown, ArrowRight, Image as ImageIcon, Video, Play, Eye, X, Heart } from 'lucide-react'

interface UserData {
  hasActiveSubscription: boolean
  currentSubscription: { status: string; plan: { name: string } } | null
}

interface GalleryItem {
  id: string
  title: string
  description?: string
  imageUrl: string
  thumbnailUrl?: string
  category: string
  contentType?: string
  isPremium?: boolean
  displayOrder: number
  views: number
  likes: number
  createdAt: string
}

type ContentType = 'images' | 'videos'

const categories = [
  { id: 'all', name: 'All', emoji: '✨' },
  { id: 'solo', name: 'Solo', emoji: '💃' },
  { id: 'roleplay', name: 'Roleplay', emoji: '🎭' },
  { id: 'bathroom', name: 'Bathroom', emoji: '🛁' },
  { id: 'bedroom', name: 'Bedroom', emoji: '🛏️' },
  { id: 'lingerie', name: 'Lingerie', emoji: '👙' },
  { id: 'outdoor', name: 'Outdoor', emoji: '🌳' },
  { id: 'intimate', name: 'Intimate', emoji: '💋' },
  { id: 'dance', name: 'Dance', emoji: '💃' },
  { id: 'cosplay', name: 'Cosplay', emoji: '🎀' },
  { id: 'bts', name: 'Behind the Scenes', emoji: '🎬' },
  { id: 'shower', name: 'Shower', emoji: '🚿' },
  { id: 'mirror', name: 'Mirror Selfie', emoji: '🪞' },
  { id: 'fitness', name: 'Fitness', emoji: '💪' },
  { id: 'pool', name: 'Pool/Beach', emoji: '🏖️' },
  { id: 'nightout', name: 'Night Out', emoji: '🌙' },
  { id: 'morning', name: 'Morning Vibes', emoji: '☀️' },
  { id: 'cooking', name: 'Cooking', emoji: '👩‍🍳' },
  { id: 'office', name: 'Office', emoji: '💼' },
  { id: 'travel', name: 'Travel', emoji: '✈️' },
  { id: 'special', name: 'Special Requests', emoji: '⭐' },
]

export default function PremiumPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contentType, setContentType] = useState<ContentType>('images')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({})
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({})

  useEffect(() => { fetchUser() }, [])

  useEffect(() => {
    if (user?.hasActiveSubscription) fetchGalleryItems()
  }, [user, selectedCategory, contentType])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) throw new Error('Not authenticated')
      const data = await res.json()
      setUser(data.user)
    } catch (err: any) {
      setError(err.message)
      if (err.message === 'Not authenticated') router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchGalleryItems = async () => {
    setGalleryLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100', premium: 'true' })
      if (selectedCategory !== 'all') params.set('category', selectedCategory)
      params.set('contentType', contentType === 'videos' ? 'video' : 'image')
      const res = await fetch(`/api/gallery?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setGalleryItems(data.data)
      const likes: Record<string, number> = {}
      const views: Record<string, number> = {}
      const liked: Record<string, boolean> = {}
      data.data.forEach((item: GalleryItem & { liked?: boolean }) => {
        likes[item.id] = item.likes || 0
        views[item.id] = item.views || 0
        liked[item.id] = item.liked || false
      })
      setLikeCounts(likes)
      setViewCounts(views)
      setLikedItems(liked)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGalleryLoading(false)
    }
  }

  const trackView = async (item: GalleryItem) => {
    setSelectedItem(item)
    if (!item.isPremium) return
    try {
      await fetch(`/api/gallery/${item.id}`, { method: 'POST' })
      setViewCounts(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))
    } catch {}
  }

  const toggleLike = async (e: React.MouseEvent, item: GalleryItem) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/gallery/${item.id}`, { method: 'PATCH' })
      const data = await res.json()
      if (data.success) {
        setLikedItems(prev => ({ ...prev, [item.id]: data.liked }))
        setLikeCounts(prev => ({ ...prev, [item.id]: data.likes }))
      }
    } catch {}
  }

  const renderGrid = () => {
    if (galleryLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-[3/4] bg-muted animate-pulse" />
              <CardContent className="p-3">
                <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (galleryItems.length === 0) {
      return (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No content found</h3>
          <p className="text-muted-foreground">No {contentType} available in this category yet</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {galleryItems.map((item) => (
          <Card key={item.id} onClick={() => trackView(item)} className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="relative aspect-[3/4] overflow-hidden">
              {item.contentType === 'video' ? (
                <>
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <Video className="h-12 w-12 text-gray-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-black/60 rounded-full flex items-center justify-center group-hover:bg-primary/80 transition-colors">
                      <Play className="h-7 w-7 text-white ml-1" />
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={item.thumbnailUrl || item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="text-xs">
                  {categories.find(c => c.id === item.category)?.emoji || '✨'}
                </Badge>
              </div>
            </div>
            <CardContent className="p-3">
              <h3 className="font-medium text-sm mb-2 line-clamp-2">{item.title}</h3>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {viewCounts[item.id] ?? 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className={`h-3 w-3 ${likedItems[item.id] ? 'text-red-500 fill-red-500' : ''}`} />
                    {likeCounts[item.id] ?? 0}
                  </div>
                </div>
                <button
                  onClick={(e) => toggleLike(e, item)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                    likedItems[item.id]
                      ? 'bg-red-500/20 text-red-500'
                      : 'bg-muted hover:bg-red-500/20 hover:text-red-500'
                  }`}
                >
                  <Heart className={`h-3 w-3 ${likedItems[item.id] ? 'fill-red-500' : ''}`} />
                  {likedItems[item.id] ? 'Liked' : 'Like'}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1920&q=80")' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        </div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Badge className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20">Premium Content</Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Exclusive & Premium
              <span className="block mt-2 bg-gradient-to-r from-amber-200 to-pink-200 bg-clip-text text-transparent">VIP Collection</span>
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">Unlock access to our most exclusive content and premium features</p>
          </div>
        </div>
      </section>

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading premium content...</p>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="max-w-md mx-auto">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && !user?.hasActiveSubscription && (
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle>Premium Access Required</CardTitle>
                <CardDescription>You need an active subscription to access premium content</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <Button asChild size="lg">
                  <Link href="/pricing"><Crown className="h-5 w-5 mr-2" />View Subscription Plans</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && !error && user?.hasActiveSubscription && (
            <>
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  <Crown className="h-4 w-4" />
                  Premium Member
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold">Premium Content</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">Exclusive content across 20 different categories</p>
              </div>

              <Tabs defaultValue="images" className="w-full" onValueChange={(v) => { setContentType(v as ContentType); setSelectedCategory('all') }}>
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                  <TabsTrigger value="images" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />Images
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="flex items-center gap-2">
                    <Video className="h-4 w-4" />Videos
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  <div className="flex gap-2 overflow-x-auto pb-4">
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className="flex items-center gap-2 whitespace-nowrap"
                      >
                        <span>{category.emoji}</span>
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <TabsContent value="images" className="mt-6">{renderGrid()}</TabsContent>
                <TabsContent value="videos" className="mt-6">{renderGrid()}</TabsContent>
              </Tabs>

              <div className="text-center pt-8">
                <Button variant="outline" asChild>
                  <Link href="/dashboard">
                    <ArrowRight className="h-4 w-4 mr-2 rotate-180" />Back to Dashboard
                  </Link>
                </Button>
              </div>

              {selectedItem && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
                  <button className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2" onClick={() => setSelectedItem(null)}>
                    <X className="h-6 w-6" />
                  </button>
                  <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                    {selectedItem.contentType === 'video' ? (
                      <video src={selectedItem.imageUrl} poster={selectedItem.thumbnailUrl} controls autoPlay className="w-full max-h-[80vh] rounded-lg" />
                    ) : (
                      <img src={selectedItem.imageUrl} alt={selectedItem.title} className="w-full max-h-[80vh] object-contain rounded-lg" />
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-white font-medium">{selectedItem.title}</p>
                      <div className="flex items-center gap-4 text-white/70 text-sm">
                        <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{viewCounts[selectedItem.id] ?? 0}</span>
                        <span className="flex items-center gap-1"><Heart className={`h-4 w-4 ${likedItems[selectedItem.id] ? 'fill-red-500 text-red-500' : ''}`} />{likeCounts[selectedItem.id] ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
