/**
 * Debug utilities for Project Chimera
 */

/**
 * Enhanced error logging with stack trace
 * @param {string} message - The error message
 * @param {Error} [error] - Optional error object
 */
function logErrorDetails(message, error) {
	console.error(`Error: ${message}`);

	if (error && error.stack) {
		console.error('Stack trace:', error.stack);
	} else {
		// Create a new error to capture the current stack trace
		const stackError = new Error();
		console.error('Current stack:', stackError.stack);
	}
}

/**
 * Check if the DOM elements needed for content injection exist
 */
function validateDOMElements() {
	const requiredElements = [
		'summary-text',
		'tone-bias',
		'highlight-vague-claims',
		'counterpoints',
		'sentiment-detection',
		'intent-summary',
		'fact-contrast'
	];

	console.log('Validating required DOM elements...');

	const missingElements = [];

	requiredElements.forEach(id => {
		const element = document.getElementById(id);
		if (!element) {
			missingElements.push(id);
		}
	});

	if (missingElements.length > 0) {
		console.error('Missing required DOM elements:', missingElements);
		return false;
	}

	console.log('All required DOM elements are present');
	return true;
}

// Export functions for use in other modules
if (typeof module !== 'undefined') {
	module.exports = {
		logErrorDetails,
		validateDOMElements
	};
}
