# 🌤️ Meteoid — Svelte Edition

### Prakiraan Cuaca Indonesia (Official BMKG Data)

Meteoid is a premium, mobile-first weather application providing accurate and real-time weather forecasts for over **91,000 administrative regions** (villages and districts) across Indonesia. This version represents a complete migration and modernization from the original Next.js project to **Svelte 5**.

![Meteoid Logo](/logo.svg)

---

## ✨ Features

- **🎯 Hyper-Local Accuracy**: Search and pinpoint weather data down to the village/kelurahan level.
- **📡 Official Data Source**: Direct integration with the **BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)** open data API.
- **📍 Geolocation Support**: Automatically detect your current administrative region for instant local updates.
- **💎 Premium Aesthetic**: Modern dark-mode interface powered by **OKLCH** color tokens and **Glassmorphism**.
- **📱 Mobile First**: Fully responsive design optimized for a seamless mobile experience.
- **⚡ Svelte 5 Powered**: Leveraging the latest **Runes** and **Snippets** for high performance and reactivity.
- **📦 PWA Ready**: Includes manifest and icon configurations for installability.

---

## 🚀 Tech Stack

- **[SvelteKit](https://kit.svelte.dev/)** & **[Svelte 5](https://svelte.dev/)** (Runes, snippets)
- **[Tailwind CSS v4](https://tailwindcss.com/)** (Modern styling with OKLCH support)
- **[Lucide Svelte](https://lucide.dev/)** (Icon library)
- **TypeScript** (Robust type safety)
- **Vite** (Next-gen frontend tooling)

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js** (v20 or later recommended)
- **pnpm** (preferred package manager)

### Installation

1.  Clone the repository and navigate to the `svelte` directory:

    ```bash
    cd svelte
    ```

2.  Install dependencies:

    ```bash
    pnpm install
    ```

3.  Start the development server:

    ```bash
    pnpm dev
    ```

4.  Build for production:
    ```bash
    pnpm build
    ```

---

## 📁 Project Structure

- `src/lib/components/`: Modular UI components (Layout, UI, Weather, Location).
- `src/lib/stores/`: Reactive states using Svelte 5 runes (e.g., `regions.svelte.ts`).
- `src/routes/`: File-based routing and API endpoints (`/api/geocode`, `/api/regions`).
- `static/`: Global assets like `logo.svg`, `favicon.ico`, and `manifest.json`.

---

## 🎨 Design System

Meteoid uses a custom design system defined in `src/app.css`:

- **Colors**: Pure **OKLCH** for high-vibrancy and consistent dark-mode perception.
- **Effects**: `.glass` utility for sophisticated backdrop-blur and translucency.
- **Typography**: **Inter** variable font for maximum readability.

---

## 📝 Credentials

- **Creators**: Ferdy Indra & [Dimas Angkasa](https://asaa.dev)
- **Data Source**: [BMKG Open Data](https://data.bmkg.go.id/)

---

## ⚖️ License

Not for commercial use. This project is intended for educational and personal informational purposes using public data from BMKG.
