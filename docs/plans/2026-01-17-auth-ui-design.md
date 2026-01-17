# Glass & Glow Auth UI Design Document

**Date**: 2026-01-17
**Status**: Draft

## Overview
This document outlines the design and architectural plan for the new "Glass & Glow" authentication UI for the BHC Markets platform. The goal is to create a high-end, futuristic fintech aesthetic that instills confidence and creates a premium user experience immediately upon entry.

## Visual Direction
The "Glass & Glow" aesthetic is defined by:
- **Deep Dark Backgrounds**: Using rich, dark shades (almost black/navy) to provide high contrast.
- **Glassmorphism**: Translucent surfaces with background blur (backdrop-filter), subtle white borders, and noise textures to create depth.
- **Neon Accents**: Strategic use of bright, glowing colors (specifically `#58A6FF` and related cyan/blue hues) for active states, primary actions, and success indicators.
- **Typography**: Clean, modern sans-serif fonts with generous tracking for headers.

## Architecture

### Layout Strategy
We will utilize a split-pane layout to balance visual impact with functional clarity.

*   **`AuthLayout` Component**:
    *   **Left Pane (Visual)**: Dedicated to brand storytelling. Features dynamic abstract 3D elements or market data visualizations (splines/particles) floating in dark space.
    *   **Right Pane (Form)**: The functional area containing the authentication forms, centered vertically.

### Core Components

#### 1. `GlassCard`
The foundational container for the authentication forms.
*   **Visuals**: Highly translucent dark background (e.g., `rgba(20, 20, 30, 0.6)`), strong blur (`backdrop-filter: blur(20px)`), and a subtle 1px gradient border.
*   **Usage**: Wraps the Login, Register, and MFA forms.

#### 2. `GlassInput`
A specialized input field designed for high usability and aesthetics.
*   **Features**:
    *   Floating labels that transition smoothly on focus.
    *   Integrated iconography (user, lock, eye) in a glowing accent color when active.
    *   Clear validation states (Error: Red glow, Success: Green glow).
    *   Background transparency to blend with the `GlassCard`.

#### 3. `NeonButton`
The primary call-to-action component.
*   **Visuals**:
    *   **Default**: Solid or gradient fill utilizing `#58A6FF`.
    *   **Hover**: intense outer glow (box-shadow) to simulate neon light.
    *   **Active**: subtle scale down.
*   **Variants**: Primary (Filled), Secondary (Outlined/Glass).

## Security UI
Security is paramount for a trading platform; the UI must reflect this visually.
*   **Secure Connection Indicators**: A "Shield" icon or "Secure SSL" badge subtly integrated into the footer or header of the auth card.
*   **IP Protection**: Visual feedback during login (e.g., "Verifying device..." animation).

## Component Specifications

| Component | Props | Description |
| :--- | :--- | :--- |
| `AuthLayout` | `children`: ReactNode, `title`: string | Main wrapper handling the split screen. |
| `GlassCard` | `children`: ReactNode, `className`: string | The blurry container for content. |
| `GlassInput` | `label`: string, `type`: string, `error`: string | Styled input with floating label support. |
| `NeonButton` | `variant`: 'primary' \| 'secondary', `loading`: boolean | Primary action button with glow effects. |
