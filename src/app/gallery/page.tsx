'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { X, ZoomIn, Lock } from 'lucide-react'

interface GalleryItem {
  id: string
  src: string
  category: string
  title: string
  description: string
}

export default function GalleryPage() {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])

  useEffect(() => {
    checkAuthStatus()
  }, [])

  useEffect(() => {
    if (user) fetchGallery()
  }, [user])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        router.push('/login?redirect=/gallery')
        return
      }
    } catch (error) {
      router.push('/login?redirect=/gallery')
      return
    } finally {
      setLoading(false)
    }
  }

  const fetchGallery = async () => {
    try {
      const res = await fetch(`/api/gallery?limit=100`)
      const data = await res.json()
      if (data.success) {
        setGalleryItems(data.data.map((item: any) => ({
          id: item.id,
          src: item.imageUrl,
          category: item.category || 'general',
          title: item.title,
          description: item.description || ''
        })))
      }
    } catch (error) {}
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground">Loading gallery...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="h-8 w-8 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold">Login Required</h1>
            <p className="text-muted-foreground">
              Please login to access the gallery
            </p>
            <Button asChild>
              <a href="/login?redirect=/gallery">Login Now</a>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const handleImageClick = (item: GalleryItem) => {
    setSelectedImage(item)
  }

  const handlePrevious = () => {
    if (!selectedImage) return
    const currentIndex = galleryItems.findIndex(item => item.id === selectedImage.id)
    const previousIndex = currentIndex === 0 ? galleryItems.length - 1 : currentIndex - 1
    setSelectedImage(galleryItems[previousIndex])
  }

  const handleNext = () => {
    if (!selectedImage) return
    const currentIndex = galleryItems.findIndex(item => item.id === selectedImage.id)
    const nextIndex = currentIndex === galleryItems.length - 1 ? 0 : currentIndex + 1
    setSelectedImage(galleryItems[nextIndex])
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1920&q=80")',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Badge className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20">
              Gallery
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Explore Our
              <span className="block mt-2 bg-gradient-to-r from-amber-200 to-pink-200 bg-clip-text text-transparent">
                Premium Collection
              </span>
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Discover stunning visuals crafted by professionals for your creative projects
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {galleryItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">No images found in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {galleryItems.map((item, index) => (
                <Card
                  key={item.id}
                  className="group overflow-hidden cursor-pointer border-2 hover:border-primary transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:shadow-[0_0_40px_rgba(220,38,38,0.6)]"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleImageClick(item)}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={item.src}
                      alt={item.title}
                      className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-125 group-hover:rotate-2"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.8)] transform scale-0 group-hover:scale-100 transition-all duration-500 delay-100">
                        <ZoomIn className="h-8 w-8 text-white animate-pulse" />
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 transform translate-x-20 group-hover:translate-x-0 transition-transform duration-500">
                      <Badge variant="secondary" className="bg-primary text-white shadow-lg">
                        {item.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 space-y-2 bg-card group-hover:bg-accent/50 transition-colors duration-500">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-300">{item.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-foreground transition-colors duration-300">{item.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl w-full p-0 overflow-hidden bg-background/95 backdrop-blur-sm">
          <VisuallyHidden.Root><DialogTitle>{selectedImage?.title}</DialogTitle></VisuallyHidden.Root>
          {selectedImage && (
            <div className="relative">
              {/* Close Button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Navigation Buttons */}
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
              >
                ←
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
              >
                →
              </button>

              {/* Image */}
              <div className="relative aspect-video max-h-[80vh]">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <h3 className="text-2xl font-bold mb-2">{selectedImage.title}</h3>
                    <p className="text-white/80">{selectedImage.description}</p>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                    {selectedImage.category}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
