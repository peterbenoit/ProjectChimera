/**
 * Word Definition Tooltip Handler for Sidepanel
 * Shows dictionary definitions for highlighted words in summary content
 */

import { getWordDefinition } from '../shared/api.js';

let tooltip = null;
let timeoutId = null;
let isShowingTooltip = false;

/**
 * Initialize word definition functionality for sidepanel
 */
export function initSidepanelWordDefinition() {
	document.addEventListener('mouseup', handleTextSelection);
	document.addEventListener('scroll', hideTooltip);
	document.addEventListener('resize', hideTooltip);

	// Prevent text selection from interfering
	document.addEventListener('selectstart', (e) => {
		if (isShowingTooltip && tooltip) {
			e.preventDefault();
		}
	});
}

/**
 * Handle text selection events
 */
async function handleTextSelection(event) {
	// Don't process if we're clicking on the tooltip
	if (tooltip && tooltip.contains(event.target)) {
		return;
	}

	const selection = window.getSelection();
	const selectedText = selection.toString().trim();

	// Only process single word selections
	if (!selectedText || selectedText.includes(' ') || selectedText.length < 2) {
		if (!isShowingTooltip) hideTooltip();
		return;
	}

	// Only work within the summary-text element
	const summaryText = document.querySelector('#summary-text');
	if (!summaryText) {
		hideTooltip();
		return;
	}

	// Check if the selection is within the summary-text element
	try {
		const range = selection.getRangeAt(0);
		if (!summaryText.contains(range.commonAncestorContainer)) {
			hideTooltip();
			return;
		}
	} catch (e) {
		hideTooltip();
		return;
	}

	// Check if selection is a single word (no spaces, reasonable length)
	if (selectedText.split(/\s+/).length === 1 && selectedText.length <= 30) {
		// Clear any existing timeout
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}

		// Show definition immediately
		await showWordDefinition(selectedText, event.clientX, event.clientY);
	} else {
		if (!isShowingTooltip) hideTooltip();
	}
}

/**
 * Show word definition tooltip
 */
async function showWordDefinition(word, x, y) {
	try {
		isShowingTooltip = true;
		hideTooltip(); // Hide any existing tooltip

		// Show loading tooltip
		showLoadingTooltip(x, y);

		const definition = await getWordDefinition(word);

		// Hide loading and show definition
		hideTooltip();
		showDefinitionTooltip(word, definition, x, y);

	} catch (error) {
		// Silently hide tooltip for words not found
		isShowingTooltip = false;
		hideTooltip();
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
	if (!definition || !definition.meanings || definition.meanings.length === 0) {
		isShowingTooltip = false;
		hideTooltip();
		return;
	}

	tooltip = createTooltipElement();

	const firstMeaning = definition.meanings[0];
	const firstDefinition = firstMeaning.definitions[0];
	const phonetic = definition.phonetic || '';
	const partOfSpeech = firstMeaning.partOfSpeech || '';

	tooltip.innerHTML = `
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

	// Auto-hide after 15 seconds
	timeoutId = setTimeout(() => {
		isShowingTooltip = false;
		hideTooltip();
	}, 15000);
}

/**
 * Create tooltip element with styles optimized for sidepanel
 */
function createTooltipElement() {
	const tooltip = document.createElement('div');
	tooltip.className = 'chimera-word-tooltip';
	tooltip.style.cssText = `
		position: fixed;
		z-index: 10000;
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

	// Add click-to-dismiss functionality
	tooltip.addEventListener('click', () => {
		isShowingTooltip = false;
		hideTooltip();
	});

	// Trigger animation
	setTimeout(() => {
		tooltip.style.opacity = '1';
		tooltip.style.transform = 'translateY(0) scale(1)';
	}, 10);

	return tooltip;
}

/**
 * Position tooltip within sidepanel bounds
 */
function positionTooltip(tooltip, x, y) {
	// Get sidepanel dimensions
	const sidepanel = document.querySelector('.sidepanel, body');
	const sidepanelRect = sidepanel.getBoundingClientRect();
	const tooltipRect = tooltip.getBoundingClientRect();

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

	tooltip.style.left = `${left}px`;
	tooltip.style.top = `${top}px`;
}

/**
 * Hide tooltip with animation
 */
function hideTooltip() {
	if (tooltip) {
		tooltip.style.opacity = '0';
		tooltip.style.transform = 'translateY(10px) scale(0.95)';
		setTimeout(() => {
			if (tooltip && tooltip.parentNode) {
				tooltip.parentNode.removeChild(tooltip);
			}
			tooltip = null;
		}, 250);
	}

	if (timeoutId) {
		clearTimeout(timeoutId);
		timeoutId = null;
	}
}

// Add CSS for tooltip styling in sidepanel
const style = document.createElement('style');
style.textContent = `
	.chimera-word-tooltip {
		user-select: none;
		cursor: pointer;
	}

	.chimera-word-tooltip .chimera-tooltip-word {
		font-weight: 600;
		margin-bottom: 6px;
		font-size: 16px;
		color: var(--text-primary, #333);
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

	.chimera-word-tooltip:hover {
		box-shadow: 0 12px 40px rgba(0,0,0,0.18);
		transform: translateY(-2px) scale(1.02);
	}
`;
document.head.appendChild(style);
