# PattayaPal Redesign Context

## Product Summary

PattayaPal is a community hub and marketplace for creators, freelancers, and clients.

The platform combines:

- portfolio discovery
- creator profiles
- client hiring
- community feed
- jobs and workflow management
- wallet, coin, gas, rank, quests, and notifications
- messenger and social interactions

The redesign should make PattayaPal feel less like a generic portfolio website and more like a living creator ecosystem.

## Core Users

### Freelancers / Creators

Creators need to show their work, receive job requests, build reputation, earn rewards, and communicate with clients.

Key needs:

- publish work
- be discovered
- show skills and rank
- manage jobs
- receive coins/rewards
- message clients

### Clients / Hirers

Clients need to find trustworthy creators, compare portfolios, post jobs, and start conversations.

Key needs:

- search creators
- review works
- compare profiles
- post job requests
- track job status
- message freelancers

### Admin / Operators

Admin users need clarity, control, and operational speed.

Key needs:

- manage users and works
- review withdrawals
- track jobs and system activity
- monitor platform health

## Design Objectives

The winning redesign should:

- make the product feel memorable
- support Thai and English text well
- make creator portfolios visually appealing
- keep dashboards and operational pages readable
- make coin, gas, rank, and quests feel native to the UI
- work on mobile without horizontal overflow
- reduce visual noise compared with the current futuristic/glass style

## Shared Product Language

Use these product metaphors consistently:

- Creator Guild
- Portfolio Cartridge
- Mission / Quest
- Coin Flow
- Rank Badge
- Hiring Board
- Community Feed
- Creator HUD

## Visual Constraints

- Avoid heavy glassmorphism.
- Avoid blurry futuristic orbs as the main visual language.
- Avoid excessive gradients.
- Avoid too many competing accent colors on one screen.
- Do not use pixel styling so heavily that Thai text becomes hard to read.
- Do not make dashboard pages look like landing pages.

## Technical Context

- Frontend framework: React + Vite
- Existing app path: `Production/src`
- Routing: React Router
- Icons: `react-icons`
- Animation: `framer-motion`
- Existing app has many production pages and should not be replaced during demo work.