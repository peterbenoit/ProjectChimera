/**
 * Content Script for Project Chimera
 *
 * Responsible for extracting content from web pages and
 * handling communication with the service worker.
 */

console.log('Content script loaded');

/**
 * Extracts the main content from the current webpage
 * using a multi-stage approach based on semantic HTML elements.
 *
 * @returns {string} The extracted page content
 */
function extractPageContent() {
	// Start with higher-priority semantic elements
	const mainElements = document.querySelectorAll('article, main, [role="main"]');
	if (mainElements.length > 0) {
		// Use the first main element's content
		return Array.from(mainElements)
			.map(el => el.innerText)
			.join('\n\n');
	}

	// Fallback to body content, but try to filter out navigation/footers
	const bodyContent = document.body.innerText;
	return bodyContent;
}

/**
 * Gets the page title and metadata
 *
 * @returns {object} Page metadata
 */
function getPageMetadata() {
	return {
		title: document.title,
		url: window.location.href,
		timestamp: new Date().toISOString(),
	};
}

/**
 * Sends the full page content to the service worker for summarization
 */
function summarizeFullPage() {
	const content = extractPageContent();
	const metadata = getPageMetadata();

	chrome.runtime.sendMessage({
		action: "summarizeFullPage",
		content: content,
		metadata: metadata
	});
}

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log("Content script received message:", message);

	if (message.action === 'extractPageContent') {
		// Simple content extraction for now
		const content = document.body.innerText;
		const title = document.title;
		const url = window.location.href;

		sendResponse({
			content: content,
			metadata: {
				title: title,
				url: url,
				timestamp: new Date().toISOString()
			}
		});
	}

	// Return true to indicate we'll send a response asynchronously
	return true;
});

// This will be expanded with more sophisticated content extraction in the future
console.log("Project Chimera content script loaded");
