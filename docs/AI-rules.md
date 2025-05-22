# AI Collaboration Guidelines for Project Chimera

This document establishes the ground rules and best practices for AI-assisted development on Project Chimera.

## Communication Guidelines

-   **Clear Requests**: When requesting assistance, provide specific context and expectations
-   **Iterative Feedback**: Feel free to refine and redirect AI output through follow-up prompts
-   **Contextual References**: Reference specific files using `#filename` notation for clarity
-   **Code Block Clarity**: When discussing code, specify the file location and language

## AI Assistance Scope

### Encouraged Use Cases

-   Code generation for new components and features
-   Refactoring suggestions for existing code
-   Documentation drafting and enhancement
-   Testing strategies and test case generation
-   Bug analysis and troubleshooting
-   Architecture and design discussions
-   Research on Chrome extension best practices

### Boundaries

-   AI will not make direct commitments to project timelines
-   AI will not introduce third-party libraries without explicit approval
-   AI should prioritize vanilla JS solutions over frameworks unless specified
-   AI will not modify critical files without confirmation

## Code Generation Protocols

-   **Consistent Style**: Generated code should follow the project's established patterns
-   **Progressive Complexity**: Start with minimal implementations, then enhance based on feedback
-   **File Path Annotations**: Always specify intended file paths for code snippets
-   **Context Awareness**: Generated code should integrate with existing project architecture
-   **Accessibility Focus**: All UI component suggestions should prioritize accessibility

## Documentation Standards

-   **Markdown Format**: All documentation should use proper Markdown formatting
-   **Technical Precision**: Documentation should be technically accurate and precise
-   **Clarity Over Brevity**: Prioritize clear explanations over concise but ambiguous ones
-   **Structured Approach**: Use consistent heading hierarchies and organization

## Review Process

-   **Focused Reviews**: When requesting code review, specify the areas of concern
-   **Improvement Iterations**: AI suggestions will provide incremental improvements
-   **Security Consciousness**: Reviews will highlight potential security concerns in Chrome extensions
-   **Performance Considerations**: Suggestions will account for extension performance best practices

## Project-Specific Guidelines

-   **Manifest V3 Compliance**: All suggestions must align with Chrome's Manifest V3 requirements
-   **SidePanel Optimization**: UI components should be optimized for the Chrome side panel context
-   **Service Worker Awareness**: Background script suggestions should work within service worker limitations
-   **Storage Practices**: Follow established patterns for Chrome storage API usage

## Change Management

-   **Incremental Changes**: Prefer smaller, focused changes over large refactorings
-   **Clear Delineation**: Explicitly indicate what is being added, modified, or removed
-   **Change Justification**: Provide reasoning for non-trivial changes
-   **Step-by-Step Approach**: For complex changes, break down into sequential steps
-   **Before/After Context**: When modifying existing code, show both states clearly
-   **Single Responsibility**: Each change should focus on one aspect or feature at a time
-   **Verification Steps**: Include ways to verify the change works as expected

## Continuous Improvement

-   This document should evolve as the project progresses
-   When patterns emerge that could improve our collaboration, they should be documented here
-   Regularly review these guidelines to ensure they still serve the project's needs
