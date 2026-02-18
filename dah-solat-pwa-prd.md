# Product Requirements Document (PRD)

## Product Name
**Dah Solat** — _"Have you prayed?"_

---

## 1. Problem Statement
Many Muslim parents find it challenging to consistently motivate their children to perform the five daily prayers (solat). Verbal reminders often lead to nagging, and children lack a sense of achievement for completing their prayers. There is a need for a **parent-controlled, child-friendly, offline-first gamified system** that transforms daily solat into engaging quests, rewarding children for building a consistent prayer habit.

---

## 2. Target Users

### Primary Users
- Muslim parents with children aged **5–12 years**

### Secondary Users
- Children who respond positively to visual progress, rewards, and game-like interactions

---

## 3. Goals & Success Metrics

### Product Goals
- Build consistent prayer habits in children through positive reinforcement
- Give parents a simple tool to track and reward solat completion
- Reduce friction/nagging around daily prayers
- Operate fully offline without accounts or internet dependency

### Success Metrics
- Number of solat completed per child per day/week
- Daily active usage per child profile
- Reward redemption frequency
- Parent retention (continued use over 4+ weeks)

---

## 4. Core Product Concept
Dah Solat is a **Progressive Web App (PWA)** where parents manage child profiles and rewards, while children interact with a quest-based interface. Completing each solat earns points, contributing toward leveling up and redeeming parent-defined rewards.

The app supports **multiple child profiles**, a **fixed set of 5 daily prayer quests** (Subuh, Zohor, Asar, Maghrib, Isyak), up to **3 custom parent-defined chores** (e.g., fasting, Quran reading), and a **reward redemption system** fully controlled by parents.

> **Mini Scope:** This is a focused version. The 5 daily solat are permanent and always present. Parents can additionally create up to 3 custom chores with daily or weekly frequency. No freemium tiers — everything is free.

---

## 5. Key Features Overview

- Multi-child profile system (no limit)
- Fixed 5 daily prayer quests (Subuh, Zohor, Asar, Maghrib, Isyak) — always present, configurable points
- Up to **3 custom chores** defined by parents (daily or weekly frequency)
- Smart quest refresh: daily chores reset daily, weekly chores reset weekly
- Pending approvals persist across resets (never deleted until resolved)
- Parent approval flow for solat and chore completion
- Points & leveling system (100 XP per level)
- Parent-defined reward bank
- Reward redemption with point deduction
- Offline-first architecture with IndexedDB persistence
- Parent PIN-protected dashboard
- Swipe-to-complete gesture for children

---

## 6. User Stories

### Parent User Stories

**Profile Management**
- As a parent, I want to **create profiles for each of my children** so each child has their own quest tracker.
- As a parent, I want to **edit or delete** a child's profile.

**Solat Configuration**
- As a parent, I want to **adjust the point value per prayer** so I can weight certain prayers differently.

**Custom Chores**
- As a parent, I want to **add up to 3 custom chores** (e.g., fasting, Quran reading) with a title, points, and frequency (daily/weekly).
- As a parent, I want to **edit or delete custom chores** as my child's routine changes.

**Approval**
- As a parent, I want to **approve solat and chore completions** so I can verify my child actually did them.
- As a parent, I want to see a **list of pending approvals** so I can quickly verify at the end of the day.

**Reward Management**
- As a parent, I want to **create, edit, and delete rewards** (e.g., "30 minutes iPad time", "Ice cream trip") with a point cost.
- As a parent, I want to **control what rewards are available** so I can adjust based on my child's behaviour.

**Settings & Security**
- As a parent, I want to **set a PIN** to protect the parent dashboard from my children.
- As a parent, I want to **reset points** or **reset all data** for a fresh start.

---

### Child User Stories

- As a child, I want to **see today's prayer quests and any custom chores** so I know what I need to do.
- As a child, I want to **swipe to complete a quest** because it feels fun and satisfying.
- As a child, I want to see **which quests are waiting for my parent's approval** vs. already approved.
- As a child, I want to see **my points, level, and progress** so I feel motivated.
- As a child, I want to **browse and redeem rewards** using my earned points.

---

## 7. Page Flow Summary

1. **Home Screen** — Profile Selection ("Who's praying today?")
2. **Child Dashboard**
   - Quests Tab (Today's 5 prayer quests + custom chores — active & completed)
   - Rewards Shop Tab (Browse & redeem rewards)
3. **Parent Dashboard** (PIN Protected)
   - Profiles Management (Add/edit/delete children)
   - Solat Settings (Configure point values per prayer)
   - Custom Chores (Add/edit/delete up to 3 custom chores)
   - Reward Bank (Create/edit/delete rewards)
   - Approval Queue (Verify pending solat & chore completions)
   - Settings (PIN, Data Reset)

---

## 8. Functional Requirements

### 8.1 Multi-Profile System
- Unlimited child profiles.
- Each profile tracks: name, avatar, points, XP, level.

---

### 8.2 Prayer Quests (Fixed Set)
- **5 daily prayers**, permanently present and cannot be deleted:
  | # | Prayer | Default Points |
  |---|--------|----------------|
  | 1 | Subuh  | 10             |
  | 2 | Zohor  | 10             |
  | 3 | Asar   | 10             |
  | 4 | Maghrib| 10             |
  | 5 | Isyak  | 10             |

- Parents can **configure point values** per prayer from the Parent Dashboard.
- The 5 prayers are **always present** — they cannot be added or removed, only adjusted.
- All prayers **require parent approval** before points are awarded.

#### Daily Reset Rules (Prayers)
- On a new day, the app **auto-generates a fresh set** of 5 prayer quests.
- **Completed & approved** quests from the previous day are deleted.
- **Completed but pending approval** quests are **preserved** — they remain visible in the Approval Queue until the parent approves or rejects them.
- **Incomplete (untouched)** quests from the previous day are deleted.

---

### 8.3 Custom Chores (Parent-Defined)
- Parents can create **up to 3 custom chores** (e.g., fasting, Quran reading, tadarus).
- Each custom chore has: **Title**, **Points**, **Frequency** (daily or weekly), and **Requires Approval** (always true).
- Custom chores appear alongside prayer quests in the child's quest list.

#### Frequency & Refresh Logic
| Frequency | Refresh Behaviour |
|-----------|------------------|
| **Daily** | Resets every day, same rules as prayer quests (pending approvals preserved) |
| **Weekly** | Resets once per week. Options: fixed day (e.g., every Monday), or 7 days after the chore was first assigned, or custom date set by parent |

---

### 8.4 Quest Completion (Child View)
- **SwipeableQuestCard**: Swipe left-to-right to mark a prayer or chore as done.
- Visual states:
  - 🟢 **Active** — Not yet completed
  - 🟡 **Pending Approval** — Child swiped, waiting for parent
  - ✅ **Approved** — Parent confirmed, points awarded

---

### 8.5 Points, XP & Leveling
- Each approved prayer/chore awards its configured points (default: 10 per prayer).
- 1 XP = 1 Point.
- Level = `floor(XP / 100) + 1`.
- Base prayer points per day: **50** (5 prayers × 10 points). Additional points from custom chores.

---

### 8.6 Rewards System
- Parents define rewards with: Title, Description (optional), Point Cost.
- Children browse reward shop and redeem using accumulated points.
- Redemption deducts points immediately and creates a redemption record.
- No limit on number of rewards.

---

### 8.7 Approval Queue
- Parent dashboard shows all pending prayer and chore completions across all children.
- Pending items **persist across daily/weekly resets** — they are never auto-deleted.
- Parent can approve or reject each entry.
- Rejected entries reset the quest back to active (if still within the current period).

---

### 8.8 Security
- **PIN**: 4-digit numeric code to protect parent dashboard.
- **Default PIN**: `0000`.
- PIN recovery via **math challenge** (adult-proof arithmetic, e.g., `34 × 21 + 87`).

---

## 9. Non-Functional Requirements

- Fully offline-first (no internet required after initial install)
- Fast load time (<2 seconds)
- Touch-friendly, child-safe UI with Islamic-themed design
- No ads, no third-party tracking
- Data stored locally on device (IndexedDB)
- Installable as PWA on mobile devices

---

## 10. Technical Architecture (High Level)

### Frontend
- **React 19** + TypeScript
- **Vite** (Build tool)
- **Tailwind CSS** (Styling)
- **Framer Motion** (Animations & Gestures)
- **Lucide React** (Icons)

### State Management & Persistence
- **Zustand** (Global state)
- **IndexedDB via idb-keyval** (Persistence)
- **Custom JSON storage bridge** for Zustand persistence middleware

### PWA
- **vite-plugin-pwa** (Service Worker & Manifest generation)

---

## 11. Data Model

### Child Profile
```typescript
{
  id: string;
  name: string;
  avatar: string;        // emoji or identifier
  points: number;
  xp: number;
  level: number;
  createdAt: string;     // ISO date
}
```

### Quest (Daily/Weekly Instance)
```typescript
{
  id: string;
  childId: string;
  type: 'prayer' | 'chore';              // distinguishes fixed prayers from custom chores
  prayer?: 'subuh' | 'zohor' | 'asar' | 'maghrib' | 'isyak'; // only for type='prayer'
  choreId?: string;                       // only for type='chore', references CustomChore.id
  date: string;                           // YYYY-MM-DD (date quest was generated for)
  frequency: 'daily' | 'weekly';
  completed: boolean;
  completedAt?: string;                   // ISO datetime
  approved: boolean;
  approvedAt?: string;                    // ISO datetime
  rejected: boolean;
  points: number;                         // points to award on approval
}
```

### Custom Chore (Parent-Defined Template)
```typescript
{
  id: string;
  title: string;
  points: number;
  frequency: 'daily' | 'weekly';
  weeklyResetDay?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'; // for weekly chores
  status: 'active' | 'archived';
  createdAt: string;                      // ISO date
}
```

### Prayer Config (Parent-Adjustable)
```typescript
{
  prayer: 'subuh' | 'zohor' | 'asar' | 'maghrib' | 'isyak';
  points: number;                         // default: 10
}
```

### Reward
```typescript
{
  id: string;
  title: string;
  description?: string;
  cost: number;
  status: 'active' | 'archived';
}
```

### Redemption
```typescript
{
  id: string;
  rewardId: string;
  childId: string;
  redeemedAt: string;   // ISO datetime
}
```

---

## 12. Risks & Constraints

- Over-reliance on extrinsic rewards may undermine intrinsic motivation for prayer
- Parent inconsistency in approvals can discourage children
- Device-only data — risk of data loss if device is reset (mitigate with future export)
- Daily reset logic depends on local device date/time accuracy

---

## 13. MVP Scope

### Included
- Offline-first PWA with IndexedDB
- Unlimited child profiles
- Fixed 5 daily prayer quests with auto-reset
- Configurable point values per prayer (default: 10)
- Up to 3 custom parent-defined chores (daily/weekly frequency)
- Smart refresh: daily resets daily, weekly resets weekly
- Pending approvals persist across resets
- Parent approval for all prayers and chores
- Points and leveling (100 XP/level)
- Reward bank and redemption shop
- PIN-protected Parent Dashboard with math challenge recovery
- Swipe-to-complete interactions
- Islamic/prayer-themed UI

### Excluded (Future Enhancements)
- Cloud sync / cross-device backup
- Streak tracking and streak-based bonus points
- Achievement badges (e.g., "7-day streak!", "All 5 in one day!")
- Jemaah (congregation) bonus points
- Sunat prayer tracking
- Notifications / prayer time reminders
- Multi-language support (Malay, English, Arabic)
- Data export/import
- More than 3 custom chores

---

## 14. Open Questions

- Should we track **prayer times** (i.e., was Subuh done before Zohor time?) or is simple daily tracking sufficient for MVP?
- Should there be a **streak bonus** in MVP or is that deferred?
- What avatar style to use? (Emoji, cartoon characters, Islamic-themed illustrations?)
