import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap, shareReplay, finalize } from 'rxjs/operators';
import { Task } from '../state/list.reducer';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

@Injectable({
  providedIn: 'root'
})
export class TodoApiService {
  private apiUrl = 'https://jsonplaceholder.typicode.com/todos';
  private cache = new Map<string, CacheEntry<any>>();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes
  private pendingRequests = new Map<string, Observable<any>>();
  private maxCachedItems = 100;
  private readonly CACHE_KEY = 'todo_api_cache';
  private localStorageAvailable = typeof localStorage !== 'undefined';
  
  constructor(private http: HttpClient) {
    // Load cache from storage on initialization
    this.loadCacheFromStorage();
    
    // Set up event listener to save cache before page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.saveCacheToStorage();
      });
    }
  }

  getTodos(page = 1, limit = 20): Observable<Task[]> {
    const cacheKey = `todos_${page}_${limit}`;
    
    // Check memory cache first (fastest)
    const cachedData = this.getFromCache<Task[]>(cacheKey);
    if (cachedData) {
      console.log('Returning cached data for', cacheKey);
      return of(cachedData);
    }
    
    // Check if there's a pending request for this resource
    if (this.pendingRequests.has(cacheKey)) {
      console.log('Returning pending request for', cacheKey);
      return this.pendingRequests.get(cacheKey)!;
    }
    
    // Parameters for pagination
    const params = new HttpParams()
      .set('_page', page.toString())
      .set('_limit', limit.toString());
    
    // Headers for better caching
    const headers = new HttpHeaders({
      'Cache-Control': 'max-age=300'
    });
    
    // Create new request with proper error handling and caching
    const request = this.http.get<any[]>(this.apiUrl, { params, headers })
      .pipe(
        map(todos => todos.map(todo => ({
          id: todo.id.toString(),
          name: todo.title,
          complete: todo.completed
        }))),
        tap(data => {
          console.log('Fetched data from API for', cacheKey);
          this.setCache(cacheKey, data);
        }),
        catchError(this.handleError<Task[]>('getTodos', [])),
        // Share the same response with multiple subscribers
        shareReplay(1),
        finalize(() => {
          // Remove from pending requests when completed
          this.pendingRequests.delete(cacheKey);
        })
      );
      
    // Store the pending request
    this.pendingRequests.set(cacheKey, request);
      
    return request;
  }

addTodo(task: Omit<Task, 'id'>): Observable<Task> {
  // Invalidate cache for todos
  this.invalidateCache('todos');
  
  return this.http.post<any>(this.apiUrl, {
    title: task.name,
    completed: task.complete,
    userId: 1
  }).pipe(
    map(response => ({
      id: `server-${Date.now()}`, 
      name: response.title || task.name,
      complete: response.completed || task.complete
    })),
    catchError(this.handleError<Task>('addTodo'))
  );
}

  updateTodo(task: Task): Observable<Task> {
    // Invalidate specific cache entries
    this.invalidateCacheItem(`todo_${task.id}`);
    this.invalidateCache('todos');
    
    return this.http.put<any>(`${this.apiUrl}/${task.id}`, {
      title: task.name,
      completed: task.complete,
      userId: 1
    }).pipe(
      map(response => ({
        id: response.id.toString(),
        name: response.title || '',
        complete: response.completed || false
      })),
      catchError(this.handleError<Task>('updateTodo'))
    );
  }

  deleteTodo(id: string): Observable<void> {
    // Invalidate specific cache entries
    this.invalidateCacheItem(`todo_${id}`);
    this.invalidateCache('todos');
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError<void>('deleteTodo'))
      );
  }
  getTodo(id: string): Observable<Task> {
    const cacheKey = `todo_${id}`;
    
    // Check cache first
    const cachedData = this.getFromCache<Task>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }
    
    // Headers for better caching
    const headers = new HttpHeaders({
      'Cache-Control': 'max-age=300'
    });
    
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers })
      .pipe(
        map(todo => ({
          id: todo.id.toString(),
          name: todo.title,
          complete: todo.completed
        })),
        tap(data => this.setCache(cacheKey, data)),
        catchError(this.handleError<Task>('getTodo'))
      );
  }

  // Cache management methods
  private getFromCache<T>(key: string): T | null {
    if (!this.cache.has(key)) return null;
    
    const entry = this.cache.get(key)!;
    const now = Date.now();
    
    // Check if entry has expired
    if (now > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  private setCache<T>(key: string, data: T): void {
    // Check cache size and purge oldest entries if needed
    if (this.cache.size >= this.maxCachedItems) {
      // More efficient way to get the oldest key (first item in map)
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
    
    // Set new cache entry with expiry
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.cacheDuration
    });
    
    // Debounce storage save to prevent excessive writes
    this.debouncedSaveToStorage();
  }
  
  private invalidateCache(prefix: string): void {
    let hasDeleted = false;
    // Remove all cache entries that start with this prefix
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        hasDeleted = true;
      }
    }
    
    // Only save to storage if we actually deleted something
    if (hasDeleted) {
      this.debouncedSaveToStorage();
    }
  }
  
  private invalidateCacheItem(key: string): void {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.debouncedSaveToStorage();
    }
  }
  
  // Debounce storage saving
  private saveTimeout: any;
  private debouncedSaveToStorage(delay: number = 1000): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.saveCacheToStorage();
    }, delay);
  }
  
  // Storage persistence for offline support
  private saveCacheToStorage(): void {
    if (!this.localStorageAvailable) {
      console.warn('localStorage is not available');
      return;
    }

    try {
      // Only save if we have items to save
      if (this.cache.size === 0) {
        localStorage.removeItem(this.CACHE_KEY);
        return;
      }
      
      // Convert cache to array of entries
      const cacheData = Array.from(this.cache.entries());
      
      // Use more efficient serialization by batching items
      const serializedData = JSON.stringify(cacheData);
      localStorage.setItem(this.CACHE_KEY, serializedData);
    } catch (e) {
      console.error('Error saving cache to storage:', e);
      
      // If we hit storage limits, clear and try again with fewer items
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        this.pruneCache();
        this.saveCacheToStorage();
      }
    }
  }
  
  private pruneCache(): void {
    // Keep only half of the items if we hit storage limits
    const itemsToKeep = Math.floor(this.cache.size / 2);
    const keys = Array.from(this.cache.keys());
    
    for (let i = 0; i < keys.length - itemsToKeep; i++) {
      this.cache.delete(keys[i]);
    }
  }
  
  private loadCacheFromStorage(): void {
    if (!this.localStorageAvailable) {
      console.warn('localStorage is not available');
      return;
    }

    try {
      const storedCache = localStorage.getItem(this.CACHE_KEY);
      if (!storedCache) return;
      
      const cacheData = JSON.parse(storedCache) as [string, CacheEntry<any>][];
      this.cache = new Map(cacheData);
      
      // Clean expired entries
      const now = Date.now();
      let hasExpired = false;
      
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiry) {
          this.cache.delete(key);
          hasExpired = true;
        }
      }
      
      if (hasExpired) {
        this.debouncedSaveToStorage(0);
      }
    } catch (e) {
      console.error('Error loading cache from storage:', e);
      // Clear potentially corrupt cache
      if (this.localStorageAvailable) {
        localStorage.removeItem(this.CACHE_KEY);
      }
      this.cache = new Map();
    }
  }

  // Error handling
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error.message);
      
      if (error.status) {
        console.error(`HTTP Status: ${error.status}`);
      }
      
      return of(result as T);
    };
  }
  
  // Clear all cache 
  public clearCache(): void {
    this.cache.clear();
    if (this.localStorageAvailable) {
      localStorage.removeItem(this.CACHE_KEY);
    }
    this.pendingRequests.clear();
  }
}