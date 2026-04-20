# Project Rules and Locked Features

## Locked Features

### 1. Player Positions (LOCKED)
- **Status**: COMPLETED & LOCKED.
- **Rule**: Do NOT modify the positioning logic or CSS classes for player slots in `GameTable.tsx` (e.g., `containerClasses`, `PlayerSlot` placement, or table margins/padding related to player visibility) in any future request.
- **Unlocking**: This feature can ONLY be modified if the user explicitly sends a request stating "Unlock player positions" first.

## Project Context
- This is a Domino game with real-time multiplayer capabilities.
- The UI uses Tailwind CSS and Framer Motion.
- The table layout is designed to keep players at the edges, completely outside the green playing area.
