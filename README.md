# ReactiveFormsNgrxW4d1

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

# Angular Todo App with Performance Optimizations

A high-performance Angular application demonstrating advanced optimization techniques for modern web applications. This project includes a Todo management system and an image gallery with best-in-class performance practices.

## Table of Contents
- [Features](#features)
- [Performance Optimizations](#performance-optimizations)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Performance Metrics](#performance-metrics)
- [License](#license)

## Features

### Todo Management
- Create, complete, and delete tasks
- Filter tasks by status (All, Active, Completed)
- Reset all tasks
- Persistent storage

### Image Gallery
- Optimized image loading with next-gen formats (AVIF, WebP)
- Responsive image display
- Smooth navigation controls
- Server-side rendering compatible

## Performance Optimizations

### 1. Lazy Loading
- Route-based lazy loading for all feature modules
- Standalone components for better tree-shaking
- Dynamic imports to reduce initial bundle size

### 2. Image Optimizations
- Modern image formats (AVIF/WebP) with appropriate fallbacks
- Native browser lazy loading with `loading="lazy"`
- Fetch priority optimization with `fetchpriority="high"`
- Explicit image dimensions to prevent layout shifts
- Conditional rendering to minimize DOM elements

### 3. Caching Strategies
- Multi-level caching system (memory → localStorage → network)
- Service worker implementation for offline support
- HTTP cache headers with appropriate cache control directives
- Efficient cache invalidation strategies
- Request deduplication for concurrent API calls

## Installation
```sh
# Clone the repository
git clone https://github.com/Raghad-Alahmadie/w4d1
cd angular-todo-app

# Install dependencies
npm install

# Start the development server
npm start
```

## Usage

### Development Server
```sh
ng serve
```
Navigate to [http://localhost:4200/](http://localhost:4200/) in your browser.

### Building for Production
```sh
ng build --configuration=production
```
The optimized production build will be available in the `dist/` directory.

### Running Tests
```sh
ng test
```

## Project Structure
```
/angular-todo-app
│── src/
│   ├── app/
│   │   ├── components/
│   │   ├── services/
│   │   ├── models/
│   │   ├── pages/
│   │   ├── app.module.ts
│   │   ├── app.component.ts
│   ├── assets/
│   ├── environments/
│── angular.json
│── package.json
│── README.md
```

## Technologies Used
- **Angular 17+**: Modern Angular with standalone components
- **RxJS**: Reactive programming for efficient state management
- **Angular Service Worker**: For PWA support and offline caching
- **TypeScript**: Type-safe JavaScript superset
- **SCSS**: Advanced styling with variables and mixins


