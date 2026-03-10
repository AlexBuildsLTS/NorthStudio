# ⚡ North Studio — Next-Gen AI Merchandise Mockup SaaS

<div align="center">

[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-000000.svg?style=flat-square&logo=apple)](https://expo.dev)
[![Framework](https://img.shields.io/badge/Framework-React%20Native%200.74+-61DAFB.svg?style=flat-square&logo=react)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK%2055-000020.svg?style=flat-square&logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Engine](https://img.shields.io/badge/Graphics-Skia%20Engine-FF4081.svg?style=flat-square)](https://shopify.github.io/react-native-skia/)
[![Backend](https://img.shields.io/badge/Backend-Supabase-3ECF8E.svg?style=flat-square&logo=supabase)](https://supabase.com)

**Hyper-realistic, multi-modal AI compositing engineered for modern creators.**

</div>

---

## 🌌 System Overview

**North Studio** is an enterprise-grade, cross-platform SaaS platform designed to revolutionize merchandise rendering. By bridging advanced hardware-accelerated graphics with edge-computed Artificial Intelligence, the studio empowers brands to generate hyper-realistic, perspective-perfect mockups in milliseconds.

The frontend is a masterclass in modern React Native architecture, utilizing **Expo Router v55** for universal routing, **NativeWind v5** for tailwind-driven glassmorphism, and **Reanimated 3/4** for 120fps physics-based interactions.

---

## 🏗️ Technical Architecture

### **1. The Rendering Engine (Frontend)**

- **Framework:** React Native + Expo (Managed Workflow, New Architecture ready).
- **Canvas:** `@shopify/react-native-skia` for 2D hardware-accelerated rendering, layer blending, and real-time shadow computation.
- **Gestures & Physics:** `react-native-gesture-handler` + `react-native-reanimated` for multi-touch logo manipulation (scale, rotate, translate) without blocking the JS thread.
- **Styling:** NativeWind v5 (`react-native-css-interop`) implementing a custom **Deep Dark** design system with Bento-box layouts and frosted glass (`expo-blur`).
- **State Management:** `Zustand` (Global UI/Canvas State) + `TanStack Query v5` (Asynchronous Server State & Cache).

### **2. The Zero-Trust Pipeline (Backend & AI)**

- **Database (BaaS):** Supabase PostgreSQL with strict **Row Level Security (RLS)** ensuring multi-tenant data isolation.
- **Edge Compute (Deno):** Supabase Edge Functions act as a zero-trust proxy. The client app never holds AI API keys. The app requests a mockup generation -> Edge Function validates Auth Token -> Edge Function calls AI Model -> Saves to Storage -> Returns URL.
- **Asset Vault:** Supabase Storage with dedicated buckets for raw assets, logos, and high-resolution generated 4K mockups.

---

## 📁 System Topology

```text
└── 📁 NorthMS
    ├── 📁 app                  # Expo Router Universal Navigation
    │   ├── 📁 (app)            # Protected Workspace (Dashboard, Assets, Studio, Gallery)
    │   ├── 📁 (auth)           # Public Gateway (Login, Register with Semver Shields)
    │   ├── _layout.tsx         # Global Root Provider & Gesture Handler
    │   └── +html.tsx           # Web-specific HTML shell & script injections
    ├── 📁 components           # Modular, Memoized UI Architecture
    │   ├── 📁 bento            # Responsive Grid Systems
    │   ├── 📁 navigation       # Adaptive Sidebar (Desktop) / BottomTabs (Mobile)
    │   ├── 📁 studio           # Skia Canvas & Layer Management Controllers
    │   └── 📁 ui               # Base Primitives (GlassCard, Interactive Buttons)
    ├── 📁 hooks                # Reusable Logic (useMockupGestures, useSupabaseQuery)
    ├── 📁 lib                  # Core Infrastructure
    │   └── 📁 supabase         # Client Initialization & Type Bridging
    ├── 📁 store                # Zustand State Slices
    │   ├── useAuthStore.ts     # Client-side session memory
    │   └── useCanvasStore.ts   # Real-time mockup coordinate tracking
    ├── 📁 supabase             # Backend Infrastructure as Code
    │   └── 📁 functions        # Deno Edge Functions for AI Image Generation
    └── 📁 types                # Strict TypeScript Definitions
        └── database.types.ts   # Auto-generated Supabase PostgreSQL schema types
---
```
