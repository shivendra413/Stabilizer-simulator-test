# Stabiliser Price Simulator

## Overview

The Stabiliser Price Simulator is a React-based web application designed for simulating and analyzing pricing scenarios for electrical stabiliser products. The application provides real-time cost calculations, material substitution modeling (particularly copper-to-aluminium substitution), and comprehensive scenario comparison capabilities. It features an interactive dashboard with charts, analytics, and material cost breakdowns to help users make informed pricing decisions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18 with TypeScript**: Modern React application using functional components with hooks for state management
- **Vite Build Tool**: Fast development server and optimized production builds with hot module replacement
- **Component-Based Design**: Modular architecture with reusable UI components organized in a clear directory structure

### UI Framework and Styling
- **shadcn/ui + Radix UI**: High-quality, accessible headless UI components for form controls, navigation, and interactive elements
- **Tailwind CSS**: Utility-first CSS framework with custom design system integration
- **Framer Motion**: Animation library for smooth transitions and interactive feedback
- **CSS Variables**: Custom design tokens for consistent theming and dark mode support

### Data Visualization
- **Recharts**: React charting library for rendering bar charts, line charts, and pie charts
- **Responsive Design**: Charts and layouts that adapt to different screen sizes and devices

### State Management
- **React Hooks**: Local component state using useState and useMemo for performance optimization
- **No External State Library**: Simple application state kept in React components without Redux or Zustand

### Development Tooling
- **TypeScript**: Type safety throughout the application with strict compiler options
- **ESLint**: Code quality and consistency enforcement
- **Path Mapping**: Alias configuration for clean imports (@/, @components/, @lib/)

### Material Cost Modeling
- **Material Interface**: Structured data model for tracking material properties including prices, inventory, and BOM quantities
- **Real-time Calculations**: Dynamic cost computation based on material price changes and substitution ratios
- **Scenario Management**: Ability to save and compare different pricing scenarios

### Code Organization
- **Component Library**: Reusable UI components in `/src/components/ui/`
- **Utility Functions**: Helper functions and utilities in `/src/lib/`
- **Type Safety**: Strong TypeScript interfaces for material data and component props

## External Dependencies

### Core React Ecosystem
- **React 18**: Latest React version with concurrent features
- **React DOM**: DOM rendering for web browsers

### UI Component Libraries
- **Radix UI**: Headless UI primitives for accessible components
  - @radix-ui/react-label
  - @radix-ui/react-select
  - @radix-ui/react-slider
  - @radix-ui/react-slot
  - @radix-ui/react-switch
  - @radix-ui/react-tabs

### Styling and Animation
- **Tailwind CSS**: Utility-first CSS framework with autoprefixer
- **Framer Motion**: Animation and gesture library
- **class-variance-authority**: Component variant management
- **clsx & tailwind-merge**: Conditional CSS class utilities

### Data Visualization
- **Recharts**: Chart library for React applications

### Icons and Assets
- **Lucide React**: Modern icon library for React

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type checking and enhanced development experience
- **ESLint**: Code linting and quality assurance
- **PostCSS**: CSS processing for Tailwind

### Production Deployment
- **Serve**: Static file server for production builds

Note: The application is entirely client-side with no backend dependencies, database connections, or external API integrations. All data is managed in-memory through React state.