/**
 * Word Definition Tooltip Handler for Sidepanel
 * Shows dictionary definitions for highlighted words in summary content
 */

import { getWordDefinition } from '../shared/api.js';

let tooltip = null;
let isShowingTooltip = false;

/**
 * Initialize word definition functionality for sidepanel
 */
export function initSidepanelWordDefinition() {
	const summaryTextEl = document.querySelector('#summary-text');
	if (summaryTextEl) {
		summaryTextEl.addEventListener('mouseup', handleTextSelection);
	}

	// Global listeners to hide the tooltip
	document.addEventListener('mousedown', handleGlobalClick, true);
	document.addEventListener('scroll', hideTooltip, true);
	document.addEventListener('resize', hideTooltip, true);
}

/**
 * Hide tooltip if a click occurs outside of it.
 */
function handleGlobalClick(event) {
	if (tooltip && !tooltip.contains(event.target)) {
		hideTooltip();
	}
}

/**
 * Handle text selection events within the #summary-text element.
 */
async function handleTextSelection(event) {
	// We don't want clicks inside the tooltip to bubble up and close it.
	event.stopPropagation();

	const selection = window.getSelection();
	const selectedText = selection.toString().trim();

	// Only process single word selections
	if (!selectedText || selectedText.includes(' ') || selectedText.length < 2) {
		hideTooltip();
		return;
	}

	// Check if selection is a single word
	if (selectedText.split(/\s+/).length === 1 && selectedText.length <= 30) {
		await showWordDefinition(selectedText, event.clientX, event.clientY);
	} else {
		hideTooltip();
	}
}

/**
 * Show word definition tooltip
 */
async function showWordDefinition(word, x, y) {
	// Hide any existing tooltip to ensure only one is open
	hideTooltip();
	isShowingTooltip = true;

	try {
		// Show loading tooltip
		showLoadingTooltip(x, y);

		const definition = await getWordDefinition(word);

		// Hide loading tooltip before showing definition
		hideTooltip();

		if (definition && definition.meanings && definition.meanings.length > 0) {
			showDefinitionTooltip(word, definition, x, y);
		} else {
			isShowingTooltip = false;
		}

	} catch (error) {
		// Silently hide tooltip for words not found
		isShowingTooltip = false;
		hideTooltip();
		console.error('Error fetching definition:', error);
	}
}

/**
 * Show loading tooltip
 */
function showLoadingTooltip(x, y) {
	tooltip = createTooltipElement();
	tooltip.innerHTML = `
		<div class="chimera-tooltip-content">
			<div class="chimera-tooltip-loading">Looking up definition...</div>
		</div>
	`;

	document.body.appendChild(tooltip);
	positionTooltip(tooltip, x, y);
}

/**
 * Show definition tooltip
 */
function showDefinitionTooltip(word, definition, x, y) {
	tooltip = createTooltipElement();

	const firstMeaning = definition.meanings[0];
	const firstDefinition = firstMeaning.definitions[0];
	const phonetic = definition.phonetic || '';
	const partOfSpeech = firstMeaning.partOfSpeech || '';

	tooltip.innerHTML = `
        <button class="chimera-tooltip-close">&times;</button>
		<div class="chimera-tooltip-content">
			<div class="chimera-tooltip-word">
				<strong>${word}</strong>
				${phonetic ? `<span class="chimera-tooltip-phonetic">${phonetic}</span>` : ''}
			</div>
			${partOfSpeech ? `<div class="chimera-tooltip-pos">${partOfSpeech}</div>` : ''}
			<div class="chimera-tooltip-definition">${firstDefinition.definition}</div>
			${firstDefinition.example ? `<div class="chimera-tooltip-example"><em>Example: ${firstDefinition.example}</em></div>` : ''}
		</div>
	`;

	document.body.appendChild(tooltip);
	positionTooltip(tooltip, x, y);

	// Add event listener for the close button
	const closeButton = tooltip.querySelector('.chimera-tooltip-close');
	closeButton.addEventListener('click', hideTooltip);
}

/**
 * Create tooltip element with styles optimized for sidepanel
 */
function createTooltipElement() {
	// Ensure no old tooltips are lingering
	hideTooltip();

	const newTooltip = document.createElement('div');
	newTooltip.className = 'chimera-word-tooltip';
	newTooltip.style.cssText = `
		position: fixed;
		z-index: 10001; /* Ensure it's above other elements */
		background: var(--bg-primary, #fff);
		border: 1px solid var(--border-color, #ccc);
		border-radius: 8px;
		padding: 16px;
		box-shadow: 0 8px 32px rgba(0,0,0,0.12);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 14px;
		line-height: 1.5;
		max-width: 280px;
		min-width: 200px;
		pointer-events: auto;
		opacity: 0;
		transform: translateY(10px) scale(0.95);
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		color: var(--text-primary, #333);
		backdrop-filter: blur(10px);
	`;

	// Trigger animation
	setTimeout(() => {
		newTooltip.style.opacity = '1';
		newTooltip.style.transform = 'translateY(0) scale(1)';
	}, 10);

	return newTooltip;
}

/**
 * Position tooltip within sidepanel bounds
 */
function positionTooltip(tooltipEl, x, y) {
	const sidepanel = document.querySelector('.sidepanel, body');
	if (!sidepanel) return;

	const sidepanelRect = sidepanel.getBoundingClientRect();
	const tooltipRect = tooltipEl.getBoundingClientRect();

	let left = x + 15;
	let top = y - tooltipRect.height - 15;

	// Keep tooltip within sidepanel bounds
	if (left + tooltipRect.width > sidepanelRect.right - 20) {
		left = x - tooltipRect.width - 15;
	}
	if (left < sidepanelRect.left + 20) {
		left = sidepanelRect.left + 20;
	}
	if (top < sidepanelRect.top + 20) {
		top = y + 25;
	}
	if (top + tooltipRect.height > sidepanelRect.bottom - 20) {
		top = sidepanelRect.bottom - tooltipRect.height - 20;
	}

	tooltipEl.style.left = `${left}px`;
	tooltipEl.style.top = `${top}px`;
}

/**
 * Hide and remove tooltip from the DOM
 */
function hideTooltip() {
	if (tooltip) {
		const currentTooltip = tooltip;
		tooltip = null; // Clear reference immediately

		currentTooltip.style.opacity = '0';
		currentTooltip.style.transform = 'translateY(10px) scale(0.95)';
		setTimeout(() => {
			if (currentTooltip.parentNode) {
				currentTooltip.parentNode.removeChild(currentTooltip);
			}
		}, 250); // Match transition duration
	}
	isShowingTooltip = false;
}

// Add CSS for tooltip styling in sidepanel
const style = document.createElement('style');
style.textContent = `
	.chimera-word-tooltip {
		user-select: none;
	}

    .chimera-tooltip-close {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        font-size: 20px;
        line-height: 1;
        color: var(--text-secondary, #666);
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    }

    .chimera-tooltip-close:hover {
        color: var(--text-primary, #333);
        background-color: var(--bg-secondary, #f0f0f0);
    }

	.chimera-word-tooltip .chimera-tooltip-word {
		font-weight: 600;
		margin-bottom: 6px;
		font-size: 16px;
		color: var(--text-primary, #333);
        padding-right: 24px; /* Space for close button */
	}

	.chimera-word-tooltip .chimera-tooltip-phonetic {
		font-weight: normal;
		color: var(--text-secondary, #666);
		margin-left: 8px;
		font-size: 13px;
	}

	.chimera-word-tooltip .chimera-tooltip-pos {
		font-style: italic;
		color: var(--accent-color, #0066cc);
		font-size: 12px;
		margin-bottom: 8px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.chimera-word-tooltip .chimera-tooltip-definition {
		margin-bottom: 8px;
		line-height: 1.5;
	}

	.chimera-word-tooltip .chimera-tooltip-example {
		font-size: 12px;
		color: var(--text-secondary, #666);
		padding-left: 12px;
		border-left: 2px solid var(--border-color, #eee);
		font-style: italic;
	}

	.chimera-word-tooltip .chimera-tooltip-loading {
		color: var(--text-secondary, #666);
		font-style: italic;
		text-align: center;
		padding: 8px 0;
	}
`;
document.head.appendChild(style);
