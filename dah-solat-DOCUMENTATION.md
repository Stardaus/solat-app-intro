# Dah Solat — PWA Implementation Guide

**Date:** February 18, 2026
**Version:** 1.0.0

## 1. Project Overview
Dah Solat is a gamified prayer tracking Progressive Web App (PWA) for Muslim families. Parents manage child profiles and rewards, while children complete daily solat quests and optional custom chores to earn points and redeem rewards. The app operates fully offline with local-first data storage.

### Core Tech Stack
| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS + Framer Motion (Animations & Gestures) |
| **State Management** | Zustand (with Persistence) |
| **Local Database** | IndexedDB (via `idb-keyval`) |
| **PWA** | `vite-plugin-pwa` (Workbox) |
| **Icons** | Lucide React |

---

## 2. Progressive Web App (PWA) Implementation

The app is configured as an "Offline-First" PWA. It caches assets and logic to function without internet and installs on mobile devices like a native app.

### 2.1 Configuration (`vite.config.ts`)
Using `vite-plugin-pwa` to generate the Service Worker and Web Manifest.

- **Strategy:** `generateSW` (Auto-generates the service worker).
- **Register Type:** `prompt` (User chooses when to reload for updates).
- **Caching:**
  - Assets: JS, CSS, HTML, ICO, PNG, SVG files.
  - Limit: 10MB max cache size.
- **Behaviour:**
  - `cleanupOutdatedCaches`: true
  - `clientsClaim` & `skipWaiting`: true

### 2.2 Asset Generation
PWA assets (icons, splash screens) generated using `pwa-asset-generator`.
- **Manifest:** `manifest.webmanifest`
- **Icons:** 192×192, 512×512, and maskable variants

### 2.3 Update Logic (`src/components/ReloadPrompt.tsx`)
Uses the `useRegisterSW` hook from `virtual:pwa-register/react` to manage updates.
- **Trigger:** Checks for updates every hour and on page visibility change.
- **UX:** Shows a toast notification when a new version is available — user can "Update Now" or "Later".
- **Offline Ready:** Notifies when the app is cached for offline use.

### 2.4 Data Persistence
To prevent browser data eviction:
1. **IndexedDB** via custom Zustand storage adapter using `idb-keyval`.
2. **Durable Storage** requested via `navigator.storage.persist()` in `main.tsx` on boot.

---

## 3. Core Feature Implementation

### 3.1 Daily Prayer Quest System

The app centers around 5 fixed daily prayers. Unlike ChoreQuest's configurable chore bank, Dah Solat uses a **hardcoded set of 5 prayers** with parent-configurable point values.

#### Quest Generation (Daily Refresh)
```typescript
const PRAYERS = ['subuh', 'zohor', 'asar', 'maghrib', 'isyak'] as const;

function refreshDailyQuests(childId: string, allQuests: Quest[], prayerConfig: PrayerConfig[]): Quest[] {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const childQuests = allQuests.filter(q => q.childId === childId);
  const todayDailyQuests = childQuests.filter(q => q.date === today && q.frequency === 'daily');

  if (todayDailyQuests.length > 0) return allQuests; // Already generated for today

  // Preserve pending approvals (completed but not yet approved/rejected)
  const pendingApprovals = childQuests.filter(
    q => q.completed && !q.approved && !q.rejected
  );

  // Remove all other previous quests for this child
  const otherChildrenQuests = allQuests.filter(q => q.childId !== childId);

  // Generate fresh prayer quests with configured points
  const getPoints = (prayer: string) =>
    prayerConfig.find(p => p.prayer === prayer)?.points ?? 10;

  const newPrayerQuests: Quest[] = PRAYERS.map(prayer => ({
    id: `${childId}-${today}-${prayer}`,
    childId,
    type: 'prayer' as const,
    prayer,
    date: today,
    frequency: 'daily' as const,
    completed: false,
    approved: false,
    rejected: false,
    points: getPoints(prayer),
  }));

  return [...otherChildrenQuests, ...pendingApprovals, ...newPrayerQuests];
}
```

> **Pending approvals survive resets:** Completed-but-not-approved quests are preserved across daily and weekly resets. They remain in the Approval Queue until the parent takes action. All other old quests (approved, rejected, untouched) are deleted.

#### Quest Lifecycle
```
Active → Child swipes → Pending Approval → Parent approves → Approved (points awarded)
                                          → Parent rejects → Active (reset)
```

### 3.2 Custom Chores (Parent-Defined)

Parents can create **up to 3 custom chores** to complement the fixed prayers.

#### Configuration
- **Title**: Free text (e.g., "Fasting", "Read Quran", "Tadarus")
- **Points**: Parent-defined per chore
- **Frequency**: `daily` (resets every day) or `weekly` (resets based on `weeklyResetDay`)
- **Weekly Reset Day**: For weekly chores — which day of the week triggers the reset (e.g., Monday)

#### Weekly Refresh Logic
```typescript
function shouldRefreshWeeklyQuest(quest: Quest, chore: CustomChore): boolean {
  const today = new Date();
  const questDate = new Date(quest.date);
  const resetDay = chore.weeklyResetDay ?? 'monday';

  // Find the most recent reset day boundary
  const currentWeekStart = getMostRecentDay(today, resetDay);
  return questDate < currentWeekStart; // Quest is from a previous week
}
```

### 3.3 Points & Leveling
- Each approved prayer: **10 points / 10 XP** (default, configurable by parent)
- Base daily earnings from prayers: **50 points** (5 × 10)
- Additional points from custom chores
- Level formula: `floor(totalXP / 100) + 1`
- Points are a **spendable currency** (reduced on redemption)
- XP is a **permanent counter** (never decreases)

### 3.4 Approval Queue
- Parent dashboard shows all pending completions (prayers + chores) grouped by child.
- **Pending items persist across daily/weekly resets** — never auto-deleted.
- Each entry shows: child name, quest name, time completed.
- Actions: ✅ Approve (awards points) or ❌ Reject (resets to active if within current period).

### 3.5 Reward System
- Parents define rewards: Title, optional Description, Point Cost.
- Children browse the Reward Shop and redeem when they have enough points.
- Redemption immediately deducts points and creates a log entry.

---

## 4. Authentication & Security

### 4.1 Parent PIN
- **Storage:** `parentPin` in Zustand store (persisted to IndexedDB).
- **Default:** `0000`.
- **Guard:** `ParentDashboard.tsx` checks `isAuthenticated` local state; renders `ParentAuth` if false.

### 4.2 Recovery (Math Challenge)
If a parent forgets their PIN:
- A complex randomised arithmetic challenge (e.g., `23 × 45 + 87`) must be solved.
- Correct answer triggers PIN reset flow.

**Flow:**
`Forgot PIN?` → `Solve Math Challenge` → `Set New PIN` → `Unlock Dashboard`

---

## 5. State Management (Zustand)

Global state is centralised in `src/store/useStore.ts`.

### Key Entities
| Entity | Description |
|--------|-------------|
| `profiles` | Child identities with Points, XP, Level |
| `quests` | Daily prayer + chore completion records (unified model) |
| `customChores` | Parent-defined chore templates (max 3) |
| `prayerConfig` | Per-prayer point values (default: 10 each) |
| `rewards` | Parent-defined prizes |
| `redemptions` | Point redemption history |

### Persistence Engine
Custom storage adapter bridging Zustand with IndexedDB:

```typescript
const storage: StateStorage = {
  getItem: async (name) => (await get(name)) || null,
  setItem: async (name, value) => await set(name, value),
  removeItem: async (name) => await del(name),
};
```

### Important: Quest Cleanup
Old prayer quests (older than 30 days) should be periodically pruned to prevent IndexedDB from growing indefinitely. This can be done on app boot via a `cleanupOldQuests()` action.

---

## 6. UI/UX Design Notes

### Theme
- Islamic-inspired colour palette: deep greens, golds, warm whites
- Clean, minimal, child-friendly typography
- Prayer-specific iconography (mosque, prayer mat, crescent motifs)

### Swipe Interaction
- Uses Framer Motion's `drag` + `onDragEnd` API
- Swipe threshold: 50% of card width to trigger completion
- Visual feedback: card slides, colour shifts from neutral → green
- Haptic feedback (where supported via `navigator.vibrate`)

### Responsive Design
- Mobile-first (primary use case: parent's phone)
- Tablet-friendly layout
- Max content width: 480px (phone-optimised)

---

## 7. Development & Build

### Prerequisites
- Node.js (v18+) & npm

### Commands
| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Run local dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

### Environment Setup
1. Clone the repository
2. Run `npm install`
3. Run `npm run dev`
4. Open `http://localhost:5173` in your browser

### PWA Testing
- Use Chrome DevTools → Application → Service Workers to verify registration
- Test offline by toggling Network → Offline in DevTools
- Test install prompt via the browser's address bar install icon

---

## 8. Key Differences from ChoreQuest

| Feature | ChoreQuest | Dah Solat |
|---------|-----------|-----------|
| Quest source | Configurable Chore Bank (unlimited) | Fixed 5 daily prayers + up to 3 custom chores |
| Quest reset | Manual / frequency-based | Auto daily reset (prayers + daily chores), auto weekly reset (weekly chores) |
| Pending approvals | Cleared on reset | **Preserved** across resets until parent acts |
| Profiles | Freemium (1 free, unlimited premium) | Unlimited (no paywall) |
| Rewards | Freemium (3 free, unlimited premium) | Unlimited (no paywall) |
| Tags & Bulk Assign | Yes | No |
| Monetisation | Freemium tiers | None (fully free) |
| Avatar evolution | Yes (level-based) | Deferred to future |
| Chore frequency | One-time / Daily / Weekly | Daily (prayers + chores) / Weekly (chores only) |
| Approval | Configurable per chore | All quests require approval |
| Default points | Varies per chore | 10 per prayer (configurable) |
