# AIPageSummarizer SidePanel: Project Chimera

This document outlines the rebirth of AIPageSummarizer as a Chrome sidePanel extension, codenamed "Project Chimera." We're stitching together the best parts of the existing extension with the streamlined architecture of the sidePanel API.

## I. Core Essence: Must-Have Features

### A. Summarization Alchemies

-   [ ] **Transmutation:** Summarize entire webpage content into concise insights.
-   [ ] **Selective Extraction:** Summarize highlighted text with surgical precision.
-   [ ] **Format Shifting:** Offer multiple summary formats:
    -   [ ] Bullet-Point Barrage: Rapid-fire key points.
    -   [ ] Academic Deconstruction: Formal, in-depth analysis.
    -   [ ] Professional Briefing: Polished, executive summary.
    -   [ ] Simplified Synopsis: Easy-to-understand overview.
-   [ ] **Length Control:** Fine-tune summary length (brief/detailed).
-   [ ] **Memory Recall:** Remember the last-used format and length.
-   [ ] **Markdown Purge:** Ensure summaries are free of Markdown formatting.
-   [ ] **Action Trigger:** "Summarize Page" button for instant results.
-   [ ] **Contextual Activation:** Right-click context menu for text selection.
-   [ ] **Keystroke Summoning:** Keyboard shortcut (Alt+S) for lightning-fast summaries.

### B. Echoes of the Past: History Vault

-   [ ] **Chronicle Binding:** Save summaries with URL and timestamp.
-   [ ] **Archive Browsing:** Browse previous summaries with ease.
-   [ ] **Lore Search:** Implement robust search within history.
-   [ ] **Record Purge:** Delete individual or all history items.
-   [ ] **Metadata Display:** Show format/length information in history.
-   [ ] **Temporal Shift:** "Back" button to return to the main panel.

### C. Voice of the AI: Sonic Summaries

-   [ ] **Vocal Incantation:** Text-to-speech readout of summaries.
-   [ ] **Playback Mastery:** Playback controls (play/pause/stop).
-   [ ] **Tempo Adjustment:** Speed adjustment options for comfortable listening.
-   [ ] **Voice Selection:** Choose from a variety of AI voices.

## II. User Interface: A Seamless Integration

### A. Foundation

-   [ ] **SidePanel Sanctum:** Implement a clean sidePanel using Chrome's API.
-   [ ] **Tabbed Grimoire:** Tab navigation between summary, history, settings.
-   [ ] **Progress Runes:** Loading indicators during API calls.
-   [ ] **Copy Artifact:** Copy to clipboard functionality.
-   [ ] **Chromatic Harmony:** Dark/light mode toggle with system preference detection.
-   [ ] **Font of Power:** Consistent font (Outfit) throughout the UI.
-   [ ] **Stylistic Consistency:** Harmonized heading styles.
-   [ ] **Enchanted Hints:** Tooltips for button clarity.

### B. Settings Chamber

-   [ ] **Content Script Toggle:** Enable/disable content script.
-   [ ] **Thematic Selection:** Theme selection (light, dark, system).
-   [ ] **API Key Repository:** Secure API key input.

### C. Whispers of the System: Notifications

-   [ ] **Subtle Alerts:** Non-invasive notifications for errors and confirmations.

## III. Worldly Interactions: Site Compatibility

### A. Exclusionary Wards

-   [ ] **Hardcoded Ban:** Minimal hardcoded blacklist (banking sites, email).
-   [ ] **User-Defined Rejection:** User-managed blacklist.
-   [ ] **Neutral Territory:** No automatic content detection heuristics.

## IV. Technical Underpinnings: The Engine of Creation

-   [ ] **SidePanel Invocation:** Proper Chrome sidePanel API integration.
-   [ ] **Background Guardian:** Service worker for background processes.
-   [ ] **Token Economy:** Efficient token usage for API calls.
-   [ ] **Secure Vault:** Secure API key storage.
-   [ ] **Accessibility Charms:** Full accessibility compliance.

## V. Bug Extermination: Cleansing the Code

The sidePanel implementation must eradicate:

-   [ ] DOM conflicts with complex websites.
-   [ ] Z-index nightmares with the floating button.
-   [ ] CSS bleeding from page to extension UI.
-   [ ] Icon rendering inconsistencies.
-   [ ] Unnecessary heuristic-based site filtering.
-   [ ] "Summarize Selection" applying inside the sidepanel.
-   [ ] Inconsistent font sizes.
-   [ ] Unclear copy/playback behavior.
-   [ ] Navigation labyrinths between panels.

## VI. Future Paths: Beyond the Horizon

-   [ ] **Notepad Integration:** A built-in notepad for quick notes.
-   [ ] **Calculator Module:** A handy calculator for research and calculations.
-   [ ] **Bookmark Management:** Quick access to bookmarks.
-   [ ] **Social Media Sharing:** Share summaries directly to social media.
-   [ ] **Multi-Language Support:** Expand language options for translations.
-   [ ] **AI-Powered Recommendations:** Suggest related articles based on summaries.
        I w
