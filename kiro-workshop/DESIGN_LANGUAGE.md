# Micro Blogging App Design Language

## Overview

The Micro Blogging App design language is built around a **modern, social media-inspired aesthetic** that prioritizes user engagement and content discovery. The system uses a clean purple and white theme with rounded elements for a friendly, approachable experience.

## 🎨 Design Philosophy

### Core Principles
- **Social-First**: Interface optimized for content sharing and user interaction
- **Modern & Friendly**: Purple accent colors with rounded corners for approachability
- **Content-Focused**: Clean layouts that highlight posts and user-generated content
- **Responsive Design**: Seamless experience across mobile, tablet, and desktop
- **Performance-Optimized**: Lightweight styling for fast loading and smooth interactions
- **Accessibility-Aware**: Good contrast ratios and clear visual hierarchy

### Visual Identity
- **Clean & Engaging**: Suitable for social interaction and content consumption
- **Modern**: Contemporary design patterns that feel current and fresh
- **Focused**: Minimal visual distractions to highlight posts and user interactions
- **Scalable**: Design system that works across different screen sizes and contexts

## 🌈 Color System

### Primary Theme

#### **Light Theme** (Default)
- **Primary Palette**: White backgrounds with purple accents and dark text
- **Accent Color**: Purple (#8b5cf6) for buttons, links, and interactive elements
- **Background**: Light gray (#f5f8fa) for app background, white (#ffffff) for cards
- **Text Hierarchy**: Dark gray (#14171a) for primary text, lighter grays for secondary
- **Personality**: Clean, modern, social media-inspired
- **Use Case**: All users - provides optimal readability and engagement

### Color Tokens

```css
/* CSS Variables */
:root {
  --primary-color: #8b5cf6;        /* Purple accent */
  --secondary-color: #14171a;      /* Dark text */
  --background-color: #ffffff;     /* Card backgrounds */
  --app-background: #f5f8fa;       /* App background */
  --text-color: #14171a;           /* Primary text */
  --border-color: #e1e8ed;         /* Borders and dividers */
  --error-color: #e0245e;          /* Error states */
  --success-color: #17bf63;        /* Success states */
}

/* Text Colors */
--text-primary: #14171a;          /* Main content */
--text-secondary: #657786;        /* Supporting text */
--text-muted: #8899a6;           /* Less important content */
--text-disabled: #aab8c2;        /* Inactive elements */

/* Interactive Elements */
--button-primary: #8b5cf6;        /* Primary buttons */
--button-hover: #7c3aed;          /* Button hover state */
--button-disabled: #c4b5fd;       /* Disabled buttons */
--link-color: #8b5cf6;            /* Links */

/* Semantic Colors */
--like-color: #e0245e;            /* Like button active */
--follow-color: #8b5cf6;          /* Follow button */
--warning-color: #ffad1f;         /* Warnings */
--info-color: #1da1f2;           /* Information */
```

### Color Usage Guidelines

#### **Application Background**
- **App Background**: Light gray (#f5f8fa) for overall app background
- **Card Background**: Pure white (#ffffff) for posts, profiles, and content cards
- **Consistency**: White cards on light gray background throughout the app

#### **Text Hierarchy**
- **Primary Text**: Dark gray (#14171a) for headings and main content
- **Secondary Text**: Medium gray (#657786) for timestamps, metadata
- **Muted Text**: Light gray (#8899a6) for less important information
- **Disabled Text**: Very light gray (#aab8c2) for inactive elements

#### **Interactive Elements**
- **Primary Buttons**: Purple background (#8b5cf6) with white text
- **Button Hover**: Darker purple (#7c3aed) for hover states
- **Links**: Purple color (#8b5cf6) matching primary color
- **Borders**: Light gray (#e1e8ed) for subtle separation

## 📝 Typography System

### Font Families
```css
/* System Font Stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;

/* Alternative (from index.css) */
font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
```

### Type Scale
```css
/* Font Sizes */
xs: 12px     /* Small labels, API display */
sm: 14px     /* Secondary text, timestamps */
base: 16px   /* Body text, default size */
lg: 18px     /* Emphasized content */
xl: 20px     /* Small headings */
2xl: 24px    /* Section headings */
3xl: 30px    /* Page titles */
```

### Font Weights
```css
normal: 400    /* Body text */
medium: 500    /* Labels, emphasized text */
semibold: 600  /* Buttons, important text */
bold: 700      /* User names, strong emphasis */
```

### Typography Usage

#### **System Fonts**
- **Purpose**: All text content, UI elements, buttons
- **Characteristics**: Highly legible, native feel, cross-platform
- **Usage**: Entire application uses system font stack for consistency

#### **Text Hierarchy**
- **Headings**: Bold weight (700) for user names and important titles
- **Body Text**: Normal weight (400) for post content and descriptions
- **Labels**: Medium weight (500) for form labels and UI text
- **Buttons**: Semibold weight (600) for interactive elements

## 📏 Spacing System

### Spacing Scale
```css
/* Spacing Values */
xs: 4px      /* Tight spacing, borders */
sm: 8px      /* Small gaps, padding */
md: 16px     /* Standard spacing */
lg: 24px     /* Section spacing */
xl: 32px     /* Large gaps */
2xl: 48px    /* Major sections */
3xl: 64px    /* Page sections */
```

### Spacing Usage Guidelines
- **xs (4px)**: Border radius for rounded corners
- **sm (8px)**: Small padding, tight element spacing
- **md (16px)**: Standard component padding, form spacing, card padding
- **lg (24px)**: Section spacing, large component gaps
- **xl (32px)**: Major layout sections
- **2xl+ (48px+)**: Page-level spacing, hero areas

## 🧩 Component System

### Button System
```css
/* Base Button */
.button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 9999px;        /* Fully rounded */
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

/* Button States */
.button:hover {
  background-color: var(--button-hover);
}

.button:disabled {
  background-color: var(--button-disabled);
  cursor: not-allowed;
}

/* Button Variants */
.like-button {
  background: none;
  border: none;
  color: var(--text-secondary);
  padding: 0;
  font-size: 0.875rem;
  font-weight: normal;
}

.like-button.liked {
  color: var(--like-color);
}

.follow-button.following {
  background-color: #fff;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}
```

### Card System
```css
/* Post Cards */
.post-card {
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
}

/* Profile Cards */
.profile-header {
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

/* Create Post Card */
.create-post {
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
}
```

### Form Elements
```css
/* Form Groups */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

/* Input Fields */
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
}

/* Select Elements */
.sort-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: white;
}
```

### Layout System
```css
/* App Layout */
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Header */
.app-header {
  background-color: var(--background-color);
  border-bottom: 1px solid var(--border-color);
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

/* Content Area */
.content {
  flex: 1;
  display: flex;
  width: 100%;
  padding: 1rem;
}

/* Feed Layout */
.feed-layout {
  display: flex;
  width: 100%;
  gap: 2rem;
  min-height: 0;
}

.feed-main {
  flex: 1;
  min-width: 0;
}

.feed-sidebar {
  width: 50%;
  display: none;
}
```

## 📱 Responsive Design System

### Breakpoints
```css
/* Mobile First Approach */
/* Mobile: Default styles (up to 768px) */
/* Tablet: 769px - 1024px */
/* Desktop: 1025px+ */
/* Large Desktop: 1200px+ */
```

### Mobile Layout (≤768px)
```css
@media (max-width: 768px) {
  .content {
    padding: 1rem;
  }
  
  .feed-layout {
    flex-direction: column;
    gap: 0;
  }
  
  .feed-main {
    width: 100%;
    max-width: none;
  }
  
  .feed-sidebar {
    display: none;
  }
  
  .app-header {
    flex-direction: column;
    gap: 1rem;
  }
}
```

### Desktop Layout (≥769px)
```css
@media (min-width: 769px) {
  .content {
    padding: 1rem 2rem;
    max-width: none;
  }
  
  .feed-main {
    width: 50%;
    flex: none;
    max-width: 50%;
  }
  
  .feed-sidebar {
    display: block;
    padding-left: 1rem;
    border-left: 1px solid var(--border-color);
    flex: 1;
  }
}
```

### Large Desktop Layout (≥1200px)
```css
@media (min-width: 1200px) {
  .content {
    padding: 1rem 3rem;
  }
  
  .feed-layout {
    gap: 3rem;
  }
}
```

## 🎯 Component Specifications

### Navigation
- **Header Height**: Auto-sizing with 0.5rem vertical padding
- **Sticky Position**: Fixed to top with z-index 100
- **Border**: Bottom border using --border-color
- **Background**: White background matching cards

### Posts
- **Card Padding**: 1rem for standard posts
- **Border Radius**: 8px for rounded corners
- **Border**: 1px solid --border-color
- **Spacing**: 1rem gap between posts in feed

### Buttons
- **Border Radius**: 9999px for fully rounded buttons
- **Padding**: 0.5rem horizontal, 1rem vertical
- **Font Weight**: 600 (semibold)
- **Transition**: 0.2s background-color for smooth hover

### Forms
- **Input Padding**: 0.75rem for comfortable touch targets
- **Border Radius**: 4px for subtle rounding
- **Label Weight**: 500 (medium) for clear hierarchy

## 🔧 Utility Classes

### Spacing Utilities
```css
/* Margins */
.mb-1 { margin-bottom: 0.5rem; }
.mb-2 { margin-bottom: 1rem; }
.mt-2 { margin-top: 2rem; }

/* Padding */
.p-1 { padding: 1rem; }
.p-2 { padding: 2rem; }

/* Gaps */
.gap-1 { gap: 0.5rem; }
.gap-2 { gap: 1rem; }
```

### Layout Utilities
```css
/* Flexbox */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.justify-between { justify-content: space-between; }
.align-center { align-items: center; }

/* Sizing */
.w-full { width: 100%; }
.max-w-400 { max-width: 400px; }
.max-w-600 { max-width: 600px; }
```

### Text Utilities
```css
/* Alignment */
.text-center { text-align: center; }
.text-right { text-align: right; }

/* Colors */
.text-secondary { color: var(--text-secondary); }
.text-muted { color: var(--text-muted); }

/* Weights */
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
```

## 🎨 Design Patterns

### Social Media Patterns
- **User Links**: Bold font weight (700) with hover underline
- **Timestamps**: Secondary text color with small font size (0.875rem)
- **Like Buttons**: Transparent background, colored when active
- **Follow Buttons**: Primary color, inverted when following

### Content Hierarchy
- **Post Content**: Pre-wrap white-space for proper line breaks
- **Character Counts**: Right-aligned, secondary text color
- **Error Messages**: Light red background with error color text
- **Loading States**: Centered text with secondary color

### Interactive States
- **Hover Effects**: Darker shades of primary colors
- **Disabled States**: Light purple for disabled buttons
- **Focus States**: Browser default focus indicators
- **Active States**: Color changes for liked/followed items

## 🔄 Implementation Guidelines

### Development Workflow
- **CSS Variables**: Use CSS custom properties for consistent theming
- **Component-First**: Build reusable components with consistent styling
- **Mobile-First**: Start with mobile styles, enhance for larger screens
- **Performance**: Minimize CSS bundle size, use efficient selectors

### Accessibility Considerations
- **Color Contrast**: Ensure sufficient contrast ratios for text
- **Touch Targets**: Minimum 44px for interactive elements
- **Focus Indicators**: Maintain visible focus states for keyboard navigation
- **Semantic HTML**: Use proper HTML elements for screen readers

### Browser Support
- **Modern Browsers**: Target current versions of Chrome, Firefox, Safari, Edge
- **CSS Features**: Use CSS Grid, Flexbox, CSS Variables
- **Fallbacks**: Provide fallbacks for older browsers where necessary

---

**Design Language Version**: 1.0  
**Last Updated**: 2025-01-27  
**Status**: Active and Implemented