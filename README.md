# Stabiliser Price Simulator

A React application for simulating stabiliser pricing with material cost analysis, built with modern tools and libraries.

## Features

- **Interactive Price Simulation**: Adjust material prices and see real-time cost calculations
- **Material Substitution**: Model copper-to-aluminium substitution with configurable ratios
- **Scenario Comparison**: Save and compare different pricing scenarios
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Charts & Analytics**: Visualize price trends and cost breakdowns with Recharts
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality accessible components
- **Radix UI** - Headless UI primitives
- **Framer Motion** - Smooth animations
- **Recharts** - Responsive charts and data visualization

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn package manager

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5173` to see the application

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   └── ui/           # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── slider.tsx
│       ├── switch.tsx
│       └── tabs.tsx
├── lib/
│   └── utils.ts      # Utility functions
├── App.tsx           # Root component
├── main.tsx          # Application entry point
├── StabiliserSimulator.tsx  # Main simulator component
└── index.css         # Global styles and Tailwind imports
```

## Customization

### Adding New Materials

Edit the `MATERIALS` constant in `StabiliserSimulator.tsx`:

```typescript
const MATERIALS = {
  M_CUSTOM: { name: "Custom Material", uom: "KG", latestPrice: 100 },
  // ... existing materials
};
```

### Modifying BOM (Bill of Materials)

Update the `BOM` constant to reflect your product specifications:

```typescript
const BOM: Record<string, { materialId: keyof typeof MATERIALS; qty: number; uom: string }[]> = {
  P100: [
    { materialId: "M_COPPER", qty: 2.5, uom: "KG" },
    // ... other materials
  ],
};
```

### Styling

- Modify `tailwind.config.js` for theme customization
- Update CSS variables in `src/index.css` for color schemes
- Customize component styles in individual component files

## Features in Detail

### Price Shock Simulation
- Adjust material prices by ±30% using interactive sliders
- See real-time impact on total cost and margins
- Visual indicators for price changes

### Material Substitution
- Model copper-to-aluminium substitution with 1:1.6 ratio
- Configurable substitution percentage (up to 40% cap)
- Automatic BOM quantity adjustments

### Scenario Management
- Save current settings as named scenarios
- Compare multiple scenarios side-by-side
- Visual charts showing margin and cost differences

### Cost Breakdown
- Detailed component-wise cost analysis
- Overhead calculations (labor, energy, freight, warranty)
- Target margin vs actual margin comparison

## Browser Support

- Chrome/Chromium 90+
- Firefox 90+
- Safari 14+
- Edge 90+


## SAP BTP Cloud Foundry Deployment

### Prerequisites
- Install the Cloud Foundry CLI: https://docs.cloudfoundry.org/cf-cli/install-go-cli.html
- Ensure you have access to SAP BTP CF and have logged in using `cf login`.

### Build and Deploy
1. Build the app:
  ```powershell
  npm run build
  ```
2. Push to Cloud Foundry:
  ```powershell
  cf push
  ```

Your app will be deployed using the staticfile buildpack and served from the `dist` directory.

### Environment Variables
You can set environment variables in `manifest.yml` under the `env` section.

## License

MIT License - feel free to use this project for your business needs.

## Support

For questions or issues, please refer to the component documentation or create an issue in your project repository.
