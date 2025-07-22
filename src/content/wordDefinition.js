/**
 * Word Definition Tooltip Handler
 * Shows dictionary definitions for highlighted words
 */

import { getWordDefinition } from '../shared/api.js';

let tooltip = null;
let timeoutId = null;

/**
 * Initialize word definition functionality
 */
export function initWordDefinition() {
	document.addEventListener('mouseup', handleTextSelection);
	document.addEventListener('mousedown', hideTooltip);
	document.addEventListener('scroll', hideTooltip);
	document.addEventListener('resize', hideTooltip);
}

/**
 * Handle text selection events
 */
async function handleTextSelection(event) {
	const selection = window.getSelection();
	const selectedText = selection.toString().trim();

	// Only process single word selections
	if (!selectedText || selectedText.includes(' ') || selectedText.length < 2) {
		hideTooltip();
		return;
	}

	// Check if selection is a single word (no spaces, reasonable length)
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
	try {
		hideTooltip(); // Hide any existing tooltip

		// Show loading tooltip
		showLoadingTooltip(x, y);

		const definition = await getWordDefinition(word);
		hideTooltip(); // Hide loading tooltip

		if (definition && definition.meanings && definition.meanings.length > 0) {
			showDefinitionTooltip(word, definition, x, y);
		}

	} catch (error) {
		hideTooltip();
		console.log('Definition not found for:', word);
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

	// Auto-hide after 5 seconds
	timeoutId = setTimeout(hideTooltip, 5000);
}

/**
 * Create tooltip element with styles
 */
function createTooltipElement() {
	const tooltip = document.createElement('div');
	tooltip.className = 'chimera-word-tooltip';
	tooltip.style.cssText = `
		position: fixed;
		z-index: 10000;
		background: #fff;
		border: 1px solid #ccc;
		border-radius: 6px;
		padding: 12px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 14px;
		line-height: 1.4;
		max-width: 300px;
		pointer-events: none;
		opacity: 0;
		transform: translateY(5px);
		transition: opacity 0.2s ease, transform 0.2s ease;
	`;

	// Trigger animation
	setTimeout(() => {
		tooltip.style.opacity = '1';
		tooltip.style.transform = 'translateY(0)';
	}, 10);

	return tooltip;
}

/**
 * Position tooltip near cursor but keep it on screen
 */
function positionTooltip(tooltip, x, y) {
	const rect = tooltip.getBoundingClientRect();
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;

	let left = x + 10;
	let top = y - rect.height - 10;

	// Adjust horizontal position if tooltip would go off screen
	if (left + rect.width > viewportWidth) {
		left = x - rect.width - 10;
	}

	// Adjust vertical position if tooltip would go off screen
	if (top < 0) {
		top = y + 20;
	}

	tooltip.style.left = `${left}px`;
	tooltip.style.top = `${top}px`;
}

/**
 * Hide tooltip
 */
function hideTooltip() {
	if (tooltip) {
		tooltip.style.opacity = '0';
		tooltip.style.transform = 'translateY(5px)';
		setTimeout(() => {
			if (tooltip && tooltip.parentNode) {
				tooltip.parentNode.removeChild(tooltip);
			}
			tooltip = null;
		}, 200);
	}

	if (timeoutId) {
		clearTimeout(timeoutId);
		timeoutId = null;
	}
}

// Add CSS for tooltip styling
const style = document.createElement('style');
style.textContent = `
	.chimera-word-tooltip .chimera-tooltip-word {
		font-weight: 600;
		margin-bottom: 4px;
	}

	.chimera-word-tooltip .chimera-tooltip-phonetic {
		font-weight: normal;
		color: #666;
		margin-left: 8px;
		font-size: 13px;
	}

	.chimera-word-tooltip .chimera-tooltip-pos {
		font-style: italic;
		color: #888;
		font-size: 12px;
		margin-bottom: 6px;
	}

	.chimera-word-tooltip .chimera-tooltip-definition {
		margin-bottom: 6px;
	}

	.chimera-word-tooltip .chimera-tooltip-example {
		font-size: 12px;
		color: #666;
	}

	.chimera-word-tooltip .chimera-tooltip-loading {
		color: #666;
		font-style: italic;
	}
`;
document.head.appendChild(style);
