Role: You are a Principal UI/UX & Product Designer specializing in next-generation, high-end digital storefronts and enterprise-grade operational dashboards.

Project Objective: Design a modern, ultra-clean digital e-commerce platform featuring a fluid user catalog, flexible payment structures (Full vs. Partial), secure authentication, and a high-control Admin Command Center built specifically for hybrid web-to-Discord fulfillment pipelines.

Visual Style & Fluid UI System:

Aesthetic: Ultra-minimalist, dark-mode first design system (premium, modern cyber-professional style). Use dynamic macro-interactions, micro-gestures, glassmorphism overlays, and generous, intentional whitespace.

Design System: Built entirely on a responsive 12-column grid system featuring native Light/Dark mode toggles for all interfaces.

Typography: Clean, high-readability pairings—using a modern sans-serif (e.g., Inter) for the general UI and a precise monospace font (e.g., JetBrains Mono) for Order IDs, keys, and transaction logs.

Color Palette: Deep Slate/Zinc neutrals, stark dark canvases, and a vibrant Electric Violet (#6366F1) or Neo-Mint as the singular high-contrast action color for CTAs.

Phase 1: Next-Gen Customer Storefront & Checkout (Digital Focus)
Dynamic Infinite Catalog: A seamless grid/list layout showcasing digital products, licenses, software, or service tiers. Hover states must reveal dynamic details and a fluid "Quick Buy" floating interface. Replace traditional shipping markers with explicit digital delivery tags (e.g., "Instant Delivery" or "Fulfilled via Discord").

Flexible Checkout Screen: A single-page fluid checkout featuring:

Payment Splitter UI: A prominent, beautifully animated toggle allowing users to select either Full Payment or Partial/Deposit Payment (clearly displaying the down-payment due immediately and calculating the remaining balance).

Discord Integration Hook: An elegant form field requiring users to input their Discord Username/ID (User#0000) during checkout to seamlessly link their purchase to your Discord ecosystem.

Order Confirmation & Invoicing: A post-purchase success screen displaying a Generated Unique Order ID (formatted in clean monospace, e.g., #ORD-2026-89XN) along with a sleek mockup of an automated HTML/PDF Bill Invoice that is simultaneously dispatched to the user’s email.

Smart User Authentication & Hub: Sleek, frictionless login/registration utilizing Magic Links, Biometrics, and Social OAuth. Includes a "My Account" hub showing their unique user ID, tied Discord tag, and a live, visual Order Lifecycle Pipeline.

Phase 2: Hyper-Advanced Admin Command Center (Privileged Access)
Granular Role-Based Access Control (RBAC): An initial admin configuration screen mapping distinct permissions for varying user roles (e.g., Super Admin, Store Manager, Discord Support Agent).

Smart Inventory & Digital Product Builder:

An advanced inventory table supporting bulk inline editing and custom product tagging.

A multi-step "Add/Edit Product" fly-out modal featuring multi-variant builders (e.g., managing tier levels or subscription lengths with independent pricing per variant) and secure digital asset/link configuration fields.

Advanced Discount Logic & Campaign Engine: A dedicated interface to configure coupon matrices (percentage-based, fixed-amount, or promotional tiers) with strict activation schedulers and minimum order thresholds.

Hybrid Orders Data Table & Fulfillment Center: A robust master list tracking all sales. Each row must distinctly feature:

Unique Order ID & Discord Handle: Clean, copy-pasteable text elements for rapid cross-referencing between the website and Discord chat.

Payment Status Badges: Color-coded indicators showing Paid (Full), Partial (Deposit), or Balance Due.

Granular Digital Order Status Dropdown: A manual state selector allowing the admin to transition the order lifecycle as it is manually processed: [Pending Approval ➔ Processing via Discord ➔ Active/Delivered ➔ Cancelled/Refunded].

Discord Sync & Order Detail Panel: A dedicated sidebar/detail view showing the customer's full transaction details, custom admin notepad sections to log manual Discord verification steps, and manual payment status overrides (e.g., an [Approve Manual Payment Update] button to transition an order from Partial to Fully Paid after receiving offline funds).

Manual & Automated Communication Hub: Action blocks on each order row to quickly [Resend Invoice Email], view email logs, or preview the automated system emails before dispatch.

Real-Time Analytics & Business Intelligence: Minimalist dashboard cards capturing Total Revenue, Conversion Rates, Outstanding Balances (from partial payments), and Active Order Volume, visualized via sleek line graphs.

Phase 3: Database Mapping, Interaction, & Edge States
Asynchronous Toast Systems: Subtle micro-notification toasts confirming real-time database state changes: "Database Updated", "Payment Status Overridden", or "Invoice Dispatched Successfully".

Form Validation Architecture: Exhaustive field validation design—such as warning states if an admin tries to mark an order as "Active/Delivered" while the system still detects a "Partial Payment" status without an override approval.

Fluid Micro-Animations: All panel changes, sidebar slide-outs, modal transitions, and payment selection toggles must utilize smooth, modern ease-in-out transitions. Include loading skeletons for heavy data tables to maintain high perceived application performance.