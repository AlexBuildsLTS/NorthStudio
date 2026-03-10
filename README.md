# 🎨 North Studio — Next-Gen AI Merchandise Mockup SaaS

<div align="center">

[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-000000.svg?style=flat-square&logo=apple)](https://expo.dev)
[![Framework](https://img.shields.io/badge/Framework-React%20Native%200.83-61DAFB.svg?style=flat-square&logo=react)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK%2055-000020.svg?style=flat-square&logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Engine](https://img.shields.io/badge/Graphics-Skia%202.4-FF4081.svg?style=flat-square)](https://shopify.github.io/react-native-skia/)
[![Backend](https://img.shields.io/badge/Backend-Supabase-3ECF8E.svg?style=flat-square&logo=supabase)](https://supabase.com)

</div>

---

## 🌟 Intelligent Design, Rendered Instantly

**North Studio** is a production-grade, cross-platform SaaS application that empowers creators to generate hyper-realistic merchandise mockups using Artificial Intelligence. Built with a **Deep Dark Mode** aesthetic and **Bento Box** glassmorphism interfaces, it provides an ultra-premium workspace for modern brands.

By combining **React Native Skia** for the interactive canvas, **Reanimated v4** for 120fps fluid interactions, and **Supabase Deno Edge Functions** for secure AI processing, North Studio delivers a desktop-class editing experience seamlessly across iOS, Android, and the Web.

---

## ✨ Enterprise-Grade Features

### 🎨 **Ultra-Modern UI/UX Architecture**

- **Bento-Grid Layouts**: High-density, visually stunning asset and gallery management using **NativeWind v5** (Tailwind CSS v4 engine).
- **Liquid Glassmorphism**: Immersive frosted glass cards utilizing `expo-blur` with custom neon/cyber gradient accents (Electric Purple → Hot Pink/Cyan).
- **Universal Routing**: A responsive, unified shell powered by **Expo Router v55** that intelligently switches between a mobile bottom-tab bar and a desktop/tablet sidebar.

### ⚡ **Advanced Studio Canvas & Animations**

- **Skia Graphics Engine**: Real-time manipulation of layers, blending modes, and shadows using `@shopify/react-native-skia`.
- **Multi-Touch Gestures**: Seamless dragging, scaling, and rotating of logos over product bases using `react-native-gesture-handler` and `useSharedValue`.
- **120fps Feedback**: Haptic-integrated micro-interactions and stagger-fade-in animations that never drop a frame on the UI thread.

### 🛡️ **Hardened Backend & AI Integration**

- **Edge AI Processing**: Zero-trust architecture. Client apps communicate exclusively with Supabase Deno Edge Functions to protect AI provider API keys and manage user credit systems.
- **Strict Row-Level Security (RLS)**: Bulletproof PostgreSQL policies ensuring total data isolation between user assets, profiles, and generated mockups.
- **Optimized Storage**: Direct, secure asset uploading using `expo-image` caching and Supabase Storage buckets.

---

## 🛠️ Technical Architecture

### **Core Frontend Stack**

- **Framework**: React Native 0.83.2 (New Architecture Ready)
- **SDK**: Expo 55.0.5 (Managed Workflow)
- **Navigation**: Expo Router (File-based, Type-safe routing)
- **Graphics & Animation**: React Native Skia + Reanimated v4 + Gesture Handler
- **Styling**: NativeWind v5 (`react-native-css-interop`)
- **State Management**: Zustand v5 (Global) + TanStack Query v5 (Server State)

### **Cloud & Database**

- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (JWT-based persistent sessions)
- **Logic Runtime**: Supabase Edge Functions (Deno / TypeScript)
- **Storage**: Multi-bucket architecture for raw assets and AI outputs

---

## 📁 Project Structure

```text
└── 📁app                  # Expo Router file-based navigation
    ├── 📁(app)            # Protected routes (Dashboard, Assets, Studio, Gallery)
    └── 📁(auth)           # Public routes (Login, Register)
└── 📁components           # Modular, reusable UI components
    ├── 📁bento            # Grid and layout components
    ├── 📁navigation       # TopBar, Sidebar, BottomTabBar
    ├── 📁studio           # Advanced Skia Canvas and Layer Managers
    └── 📁ui               # Base components (Buttons, GlassCards, Avatars)
└── 📁hooks                # Custom React hooks (useMockupGestures, etc.)
└── 📁lib                  # Core configurations (Supabase client)
└── 📁store                # Zustand state slices (Auth, Canvas, User)
└── 📁supabase             # Database schemas, migrations, and Edge Functions
```

---

```
🚀  Prerequisites
🚀 Node.js 20+
🚀 Expo CLI
🚀 Supabase CLI (for local backend development)
```

---
