import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
// OPTIMIZATION 1: Using CommonModule for tree-shakable imports and isPlatformBrowser for SSR compatibility
import { CommonModule, isPlatformBrowser } from '@angular/common';
// OPTIMIZATION 2: Using RxJS for efficient reactive programming
import { interval, Subscription } from 'rxjs';


interface OptimizedImage {
  url: string;
  webpUrl?: string;
  avifUrl?: string;
  alt: string;
  caption: string;
}

@Component({
  // OPTIMIZATION 3: Using standalone components for better tree-shaking
  selector: 'app-image-scroller',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-scroller.component.html',
  styleUrl: './image-scroller.component.scss'
})
export class ImageScrollerComponent implements OnInit, OnDestroy {
  // OPTIMIZATION 4: Pre-optimized image URLs with size, format and quality parameters
  images: OptimizedImage[] = [
    { 
      url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&h=600&q=80', 
      webpUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&h=600&q=80&fm=webp',
      avifUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&h=600&q=80&fm=avif',
      alt: 'Task Management', 
      caption: 'Stay organized with our task management system'
    },
    { 
      url: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=800&h=600&q=80', 
      webpUrl: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=800&h=600&q=80&fm=webp',
      avifUrl: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=800&h=600&q=80&fm=avif',
      alt: 'Productivity', 
      caption: 'Boost your productivity with smart task scheduling'
    },
    { 
      url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&h=600&q=80', 
      webpUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&h=600&q=80&fm=webp',
      avifUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&h=600&q=80&fm=avif',
      alt: 'Team Collaboration', 
      caption: 'Collaborate effectively with your team'
    },
    { 
      url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&h=600&q=80', 
      webpUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&h=600&q=80&fm=webp',
      avifUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&h=600&q=80&fm=avif',
      alt: 'Time Management', 
      caption: 'Manage your time efficiently'
    }
  ];
  
  currentIndex = 0;
  private autoScrollSubscription?: Subscription;
  // OPTIMIZATION 5: Flag for SSR compatibility
  private isBrowser: boolean;
  
  // OPTIMIZATION 6: Platform detection for SSR compatibility 
  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }
  
  // OPTIMIZATION 7: Conditional browser-only execution
  ngOnInit() {
    if (this.isBrowser) {
      this.setupAutoScroll();
    }
  }
  
  // OPTIMIZATION 8: Proper cleanup to prevent memory leaks
  ngOnDestroy() {
    if (this.autoScrollSubscription) {
      this.autoScrollSubscription.unsubscribe();
    }
  }
  
  // OPTIMIZATION 9: Efficient timing with RxJS intervals
  private setupAutoScroll() {
    this.autoScrollSubscription = interval(5000).subscribe(() => {
      this.nextImage();
    });
  }
  
  // OPTIMIZATION 10: Efficient navigation methods using modulo arithmetic
  nextImage() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }
  
  prevImage() {
    this.currentIndex = this.currentIndex === 0 
      ? this.images.length - 1 
      : this.currentIndex - 1;
  }
  
  setImage(index: number) {
    this.currentIndex = index;
  }
  
  getNextIndex(): number {
    return (this.currentIndex + 1) % this.images.length;
  }
  
  getPrevIndex(): number {
    return this.currentIndex === 0 ? this.images.length - 1 : this.currentIndex - 1;
  }
  
  // OPTIMIZATION 11: Image error handling with fallback
  handleImageError(event: Event) {
    console.error('Image failed to load:', (event.target as HTMLImageElement).src);
    // Use a fallback image from Unsplash
    (event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=800&h=600&q=60';
  }
}