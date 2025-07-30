# Smart Digest - Sharing Feature Implementation Plan

## Overview

Add sharing functionality to Smart Digest that allows users to share page
summaries across different social media platforms and communication channels
with platform-optimized formatting.

## Feature Description

A smart sharing system that generates platform-specific versions of summaries,
optimized for character limits, tone, and formatting conventions of each
platform.

## Core Approach: Smart Share Modal

### User Interface

- **Share Button**: Added to summary-actions div alongside existing Copy and
  Speak buttons
- **Share Modal**: Tabbed interface with platform-specific options
- **One-Click Copy**: Each platform tab includes a copy button for easy
  clipboard access

### Supported Platforms

#### Twitter/X

- **Character Limit**: ~200 characters maximum
- **Style**: Clean, professional, no emojis
- **Format**: "Key insight from [Article Title]: [1-2 main points]. Source:
  [URL]"
- **Focus**: Most compelling finding from the summary

#### LinkedIn

- **Character Limit**: Generous (up to 3,000 characters)
- **Style**: Professional with engagement-friendly emojis
- **Format**:
  - Professional opener: "Just read an insightful article about..."
  - 3-4 key insights in bullet format with emojis
  - Relevant professional hashtags
  - Complete attribution block
- **Tone**: Professional but engaging

#### Facebook

- **Character Limit**: Very generous (60,000+ characters)
- **Style**: Conversational and casual
- **Format**:
  - Casual opener: "Found this interesting..."
  - 2-3 key takeaways in accessible language
  - Source link at the end
- **Tone**: Friendly and approachable

#### Email

- **Character Limit**: No practical limit
- **Style**: Professional and comprehensive
- **Format**:
  - Subject line suggestion
  - Full summary with professional formatting
  - Complete metadata (title, URL, date, summary settings)
  - "Thought you might find this interesting" template
- **Use Case**: Sharing with colleagues, friends, or saving for later

#### General/Clipboard

- **Character Limit**: No limit
- **Style**: Clean and neutral
- **Format**: Basic summary with standard attribution
- **Use Case**: Manual sharing on any other platform or service

## Attribution Requirements

All shared content must include:

- Original article title
- Source URL
- "Summarized with Smart Digest" credit
- Timestamp (for email format)

## Technical Implementation

### New Components

1. **Share Button**: SVG icon button in summary-actions
2. **Share Modal**: Overlay modal with tabbed interface
3. **Platform Generators**: Functions to create platform-specific content
4. **Copy Functionality**: Clipboard API integration for each platform tab

### File Modifications

- `src/sidepanel/index.html`: Add share button and modal HTML
- `src/sidepanel/js/main.js`: Add sharing functionality and modal logic
- `src/sidepanel/css/main.css`: Add modal and sharing UI styles

### User Experience Flow

1. User generates summary as normal
2. User clicks "Share" button next to Copy/Speak buttons
3. Share modal opens with platform tabs
4. User selects desired platform tab
5. User reviews auto-generated, platform-optimized content
6. User clicks "Copy" button for that platform
7. User pastes content into their chosen platform
8. Modal can be closed or user can switch to another platform tab

## Content Generation Logic

### Content Optimization Strategy

- **Extract Key Points**: Identify 2-4 most important insights from summary
- **Platform Adaptation**: Adjust tone, length, and formatting per platform
- **Attribution Integration**: Seamlessly include source information
- **Character Management**: Ensure content fits within platform limits
- **Engagement Optimization**: Use platform-appropriate language and formatting

### Error Handling

- Handle cases where summary is too short for meaningful sharing
- Graceful fallback if platform-specific generation fails
- Clear user feedback for copy operations

## Settings Integration

- Optional: Add toggle in settings to enable/disable sharing feature
- Respect existing user preferences for summary format and length
- Maintain consistency with extension's privacy approach

## Privacy Considerations

- All sharing is clipboard-based (no direct API integrations)
- No data sent to external services beyond existing OpenAI API usage
- User maintains full control over what gets shared and where
- No tracking of sharing activity

## Implementation Priority

1. Core modal UI and share button
2. Platform-specific content generators
3. Copy functionality and user feedback
4. CSS styling and responsive design
5. Testing across different summary types and lengths
