# Project Chimera: Design Document

This document outlines the design approach for building the AIPageSummarizer sidePanel extension using Manifest V3.

## Contents

1. [Extension Architecture](#1-extension-architecture)
2. [File Structure](#2-file-structure)
3. [Build System](#3-build-system)
4. [Key Components](#4-key-components)
5. [State Management](#5-state-management)
6. [API Integration](#6-api-integration)
7. [Chrome API Usage](#7-chrome-api-usage)
8. [UI Implementation Strategy](#8-ui-implementation-strategy)
9. [Development Workflow](#9-development-workflow)

## 1. Extension Architecture

The extension will follow a modular architecture with these primary components:

-   **Service Worker**: Background script handling API calls, storage operations, and extension lifecycle
-   **SidePanel UI**: The main user interface rendered in the Chrome sidePanel
-   **Content Scripts**: Limited scripts that run in the page context to extract content and handle selected text
-   **Shared Utilities**: Common functions and helpers used across components

The architecture will use a message-passing system to enable communication between these isolated contexts.

## 2. File Structure

```
project-chimera/
├── src/
│   ├── manifest.json
│   ├── background/
│   │   └── serviceWorker.js
│   ├── sidepanel/
│   │   ├── index.html
│   │   ├── js/
│   │   │   ├── main.js
│   │   │   ├── components/
│   │   │   ├── tabs/
│   │   │   └── utils/
│   │   └── css/
│   │       ├── main.css
│   │       ├── themes/
│   │       └── components/
│   ├── content/
│   │   └── content-script.js
│   ├── shared/
│   │   ├── api.js
│   │   ├── storage.js
│   │   └── utils.js
│   └── assets/
│       ├── icons/
│       └── fonts/
├── dist/                   # Built extension files
├── config/                 # Build configuration
├── tests/
├── package.json
├── README.md
└── .gitignore
```

## 3. Build System

We'll use **Webpack** as our build system with:

-   **Entry points**: Multiple entry points for service worker, sidePanel, and content script
-   **Loaders**: For handling CSS, fonts, and images
-   **Plugins**: To manage HTML files, copy assets, and optimize output
-   **Environment configurations**: Development and production settings

Key packages:

-   `webpack` and `webpack-cli`
-   `css-loader` and `style-loader`
-   `html-webpack-plugin`
-   `copy-webpack-plugin`
-   `babel-loader` for JavaScript transpilation
-   `mini-css-extract-plugin` for CSS extraction
-   `webpack-merge` for config management

## 4. Key Components

### Service Worker (Background)

Will handle:

-   API call orchestration
-   Storage operations
-   SidePanel registration
-   Context menu creation
-   Message handling from UI and content scripts

### SidePanel UI

Organized into tab components:

1. **Summary Tab**: Controls for format, length, and summarization triggers
2. **History Tab**: Listing, searching, and managing past summaries
3. **Settings Tab**: Configuration options for the extension

### Content Scripts

Minimalist approach:

-   Text extraction from the current page
-   Handling text selection events
-   Communication with the service worker

### Shared Utilities

-   **API Client**: Wrapper for summarization API calls
-   **Storage Manager**: Interface for Chrome storage API
-   **Message Bus**: Standardized communication between components
-   **Analytics**: Optional usage tracking

## 5. State Management

We'll implement a lightweight state management approach:

-   **Chrome Storage API**: For persistent data (settings, history)
-   **Memory Store**: For ephemeral UI state
-   **Message-based Synchronization**: To keep UI and background state in sync

No external state management libraries needed to keep the bundle size small.

## 6. API Integration

The extension will need to connect to an external AI service for summarization:

-   **Abstraction Layer**: Create a service that can be adapted to different AI providers
-   **Rate Limiting**: Implement controls to prevent excessive API usage
-   **Caching**: Store results for previously summarized pages
-   **Error Handling**: Graceful degradation when API is unavailable

## 7. Chrome API Usage

Key Chrome APIs we'll leverage:

-   `chrome.sidePanel`: For creating and managing the side panel
-   `chrome.storage`: For storing user preferences and summary history
-   `chrome.contextMenus`: For the right-click summarization option
-   `chrome.commands`: For keyboard shortcuts
-   `chrome.tabs`: For accessing tab information and URL
-   `chrome.runtime`: For messaging between contexts

## 8. UI Implementation Strategy

We'll use a vanilla JavaScript approach with:

-   **Custom Web Components**: For reusable UI elements
-   **CSS Variables**: For theming support
-   **CSS Grid/Flexbox**: For responsive layouts
-   **Media Queries**: For adapting to the sidePanel's width
-   **Accessibility**: ARIA attributes and keyboard navigation

The UI will follow a component-based architecture without using a framework to keep it lightweight.

## 9. Development Workflow

1. **Setup**: Configure build system and development environment
2. **Core Infrastructure**: Implement service worker, storage, and messaging
3. **SidePanel Foundation**: Create the basic UI shell with tabs
4. **Feature Implementation**: Work through the features outlined in project.md
5. **Testing**: Implement unit and integration tests
6. **Optimization**: Performance tuning and bug fixing
7. **Packaging**: Prepare for Chrome Web Store submission

Each feature can be tackled as a separate task, allowing for incremental development and testing.

## 10. Feature Implementation Strategy

Based on the project requirements, we'll implement features in this priority order:

### Phase 1: Core Infrastructure

-   SidePanel integration
-   Service worker setup
-   Basic UI framework
-   API connection

### Phase 2: Essential Features

-   Basic summarization functionality
-   Format and length controls
-   Context menu integration
-   Keyboard shortcuts

### Phase 3: UI & History

-   History storage and management
-   Theme implementation
-   Copy functionality
-   Loading indicators

### Phase 4: Advanced Features

-   Text-to-speech functionality
-   User settings
-   Site blacklisting
-   Notifications

### Phase 5: Testing & Optimization

-   Console logging and debugging for easier development
-   Potential performance profiling
