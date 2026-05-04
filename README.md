# HCI Driven Interface & Design

A full‑stack event operations platform designed for organizers, vendors, staff, and attendees. It enables end‑to‑end event lifecycle management – from planning and vendor coordination to task assignment, registration, and feedback – all within a role‑based, interactive, and accessible interface.

The project was developed as an **Applied Human‑Computer Interaction (AHCI)** undergraduate capstone, applying HCI principles throughout the user experience.

---

## Features

- **Multi‑role dashboards** – Organizer, Vendor, Staff, Attendee
- **Event management** – Create, edit, publish, cancel events (multi‑step wizard with auto‑save)
- **Venue management** – Add, edit, delete venues with capacity, address, amenities
- **Vendor proposals** – Vendors submit proposals; organizers approve/reject with comments (undo supported)
- **Task management** – Organizers assign tasks to staff with priority & deadline; staff update status
- **Issue reporting** – Staff report operational issues with descriptions
- **Attendee registration** – Register for published events
- **Feedback system** – Attendees submit ratings and comments for attended events
- **Real‑time search** – Global search palette (Ctrl+K) across all modules
- **Keyboard shortcuts** – Ctrl+S, Ctrl+N, Esc, ? (help modal)
- **Role‑based theming** – Distinct background gradients for each role (blue, green, amber, purple)
- **Interactive UI** – Glowing buttons, card hover effects, toast notifications, confirmation dialogs

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.2.4 | React framework (App Router) |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling & theming |
| Lucide React | 0.475.x | Icons |
| Sonner | 1.7.x | Toast notifications |
| React Hook Form | 7.54.x | Form handling & validation |
| Zod | 3.24.x | Schema validation |
| Radix UI | – | Accessible Dialog, Tooltip components |
| cmdk | – | Command palette (search) |
| react-hotkeys-hook | – | Keyboard shortcuts |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 22.x | Runtime |
| Next.js API Routes | – | Backend endpoints |
| Oracle Database | 21c XE | Relational database |
| node-oracledb | 6.7.x | Oracle driver |
| bcrypt | 5.1.x | Password hashing |
| jsonwebtoken | 9.0.x | JWT authentication |

### Database Schema (Oracle)
- Users (organizer, vendor, staff, attendee)
- Events
- Venues
- Vendor_Registrations
- Tasks
- Attendee_Registrations
- Feedback
- Issues

---

## 🧠 Applied HCI Principles (Fully Implemented)

| Principle | Implementation |
|-----------|----------------|
| **Effectiveness** | Role‑specific dashboards – each user sees only relevant actions and data. |
| **Efficiency** | One‑click approve/reject for vendor proposals; global search (Ctrl+K); keyboard shortcuts. |
| **Predictability** | Consistent layout across all dashboards (sidebar → main content). |
| **Familiarity** | Standard icons (trash = delete, pencil = edit, eye = view). |
| **Consistency** | Same button styles, card designs, and form behaviors across all pages. |
| **Observability** | Breadcrumbs show current location; progress bars in multi‑step forms. |
| **Recoverability** | Undo toast after proposal submission (10s window); confirmation dialog before delete. |
| **Responsiveness** | Loading spinners during API calls; auto‑save drafts in localStorage. |
| **Task Conformance** | Step‑by‑step wizard for event creation; logical task flows (register → feedback). |
| **Error Prevention** | Inline form validation; confirmation dialogs for destructive actions. |
| **Informative Feedback** | Toast notifications for every CRUD action (success/error/warning). |
| **Hover Feedback** | Buttons glow, cards lift, links underline on hover (role‑specific colors). |
| **Keyboard Accessibility** | Full keyboard navigation (Tab, Enter, Esc) plus shortcuts (Ctrl+S, Ctrl+N, ?, Ctrl+K). |
| **Aesthetic Design** | Role‑based gradients (blue/organizer, green/vendor, amber/staff, purple/attendee). |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ and npm
- Oracle Database 21c XE (or later)
- Oracle SQL Developer Extension for VS Code (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/eventops.git
   cd eventops
