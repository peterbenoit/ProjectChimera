/**
 * Main JavaScript for Project Chimera SidePanel
 */

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');
const summarizeBtn = document.getElementById('summarize-btn');
const copyBtn = document.getElementById('copy-btn');
const speakBtn = document.getElementById('speak-btn');
const formatSelect = document.getElementById('format-select');
const lengthSelect = document.getElementById('length-select');
const loadingIndicator = document.getElementById('loading-indicator');
const summaryContent = document.getElementById('summary-content');
const summaryText = document.getElementById('summary-text');
const errorMessage = document.getElementById('error-message');
const saveSettingsBtn = document.getElementById('save-settings');
const apiKeyInput = document.getElementById('api-key');
const themeSelect = document.getElementById('theme-select');

/**
 * Initialize the sidepanel UI
 */
function initialize() {
	// Set up tab navigation
	setupTabNavigation();

	// Set up event listeners
	setupEventListeners();

	// Load user preferences
	loadUserPreferences();

	// Check for any pending messages (e.g., from context menu selection)
	checkForPendingMessages();

	// Check if API key exists, redirect to settings if not
	checkApiKeyAndRedirect();

	console.log('Project Chimera sidepanel initialized');
}

/**
 * Set up tab navigation functionality
 */
function setupTabNavigation() {
	tabButtons.forEach(button => {
		button.addEventListener('click', () => {
			const tabName = button.getAttribute('data-tab');

			// Update active button
			tabButtons.forEach(btn => {
				btn.classList.remove('active');
			});
			button.classList.add('active');

			// Update active panel
			tabPanels.forEach(panel => {
				panel.classList.remove('active');
				panel.classList.add('hidden');
			});

			const activePanel = document.getElementById(`${tabName}-tab`);
			activePanel.classList.add('active');
			activePanel.classList.remove('hidden');
		});
	});
}

/**
 * Set up other event listeners
 */
function setupEventListeners() {
	// Summarize button click
	if (summarizeBtn) {
		summarizeBtn.addEventListener('click', handleSummarizeClick);
	}

	// Copy button click
	if (copyBtn) {
		copyBtn.addEventListener('click', handleCopyClick);
	}

	// Speak button click
	if (speakBtn) {
		speakBtn.addEventListener('click', handleSpeakClick);
	}

	// Save settings button click
	if (saveSettingsBtn) {
		saveSettingsBtn.addEventListener('click', handleSaveSettings);
	}

	// Theme select change
	if (themeSelect) {
		themeSelect.addEventListener('change', handleThemeChange);
	}
}

/**
 * Handle summarize button click
 */
async function handleSummarizeClick() {
	try {
		showLoading(true);

		// Get the format and length preferences
		const format = formatSelect.value;
		const length = lengthSelect.value;

		// Request the page content from the content script
		const pageContent = await requestPageContent();

		// Once we have the page content, we'll send it for summarization
		// For now, we'll just show a dummy summary
		setTimeout(() => {
			const dummySummary = `This is a placeholder summary in ${format} format with ${length} length.

In the next phase, we'll implement the actual API call to OpenAI for generating summaries.`;

			displaySummary(dummySummary);
			showLoading(false);

			// Save the format and length preferences
			saveFormatAndLengthPreferences(format, length);
		}, 1500);
	} catch (error) {
		console.error('Error summarizing page:', error);
		showError();
	}
}

/**
 * Request page content from the content script
 * @returns {Promise<Object>} The page content and metadata
 */
function requestPageContent() {
	return new Promise((resolve, reject) => {
		chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
			if (!tabs[0]) {
				reject(new Error('No active tab found'));
				return;
			}

			chrome.tabs.sendMessage(
				tabs[0].id,
				{ action: 'extractPageContent' },
				response => {
					if (chrome.runtime.lastError) {
						reject(new Error(chrome.runtime.lastError.message));
					} else if (response) {
						resolve(response);
					} else {
						reject(new Error('No response from content script'));
					}
				}
			);
		});
	});
}

/**
 * Handle copy button click
 */
function handleCopyClick() {
	if (summaryText.textContent) {
		navigator.clipboard.writeText(summaryText.textContent)
			.then(() => {
				// Show a quick "Copied" indicator
				const originalText = copyBtn.innerHTML;
				copyBtn.innerHTML = '<span class="icon">✓</span>';
				setTimeout(() => {
					copyBtn.innerHTML = originalText;
				}, 1500);
			})
			.catch(err => {
				console.error('Could not copy text:', err);
			});
	}
}

/**
 * Handle speak button click
 */
function handleSpeakClick() {
	if (summaryText.textContent) {
		chrome.tts.speak(summaryText.textContent, {
			rate: 1.0,
			onEvent: function (event) {
				if (event.type === 'error') {
					console.error('TTS Error:', event);
				}
			}
		});
	}
}

/**
 * Handle save settings button click
 */
function handleSaveSettings() {
	const settings = {
		theme: themeSelect.value,
		apiKey: apiKeyInput.value,
		enableContentScript: document.getElementById('enable-content-script').checked
	};

	chrome.storage.local.set({ settings }, () => {
		// Show a quick "Saved" indicator
		const originalText = saveSettingsBtn.textContent;
		saveSettingsBtn.textContent = 'Saved!';
		setTimeout(() => {
			saveSettingsBtn.textContent = originalText;
		}, 1500);

		// Apply theme immediately
		applyTheme(settings.theme);
	});
}

/**
 * Handle theme change
 */
function handleThemeChange() {
	applyTheme(themeSelect.value);
}

/**
 * Apply theme to the UI
 * @param {string} theme - The theme to apply ('light', 'dark', or 'system')
 */
function applyTheme(theme) {
	if (theme === 'system') {
		// Check system preference
		if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			document.documentElement.setAttribute('data-theme', 'dark');
		} else {
			document.documentElement.setAttribute('data-theme', 'light');
		}

		// Listen for changes in system theme
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
			document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
		});
	} else {
		document.documentElement.setAttribute('data-theme', theme);
	}
}

/**
 * Load user preferences from storage
 */
function loadUserPreferences() {
	chrome.storage.local.get(['settings', 'formatPreference', 'lengthPreference'], data => {
		if (data.settings) {
			// Restore settings
			if (themeSelect) themeSelect.value = data.settings.theme || 'system';
			if (apiKeyInput) apiKeyInput.value = data.settings.apiKey || '';

			if (document.getElementById('enable-content-script')) {
				document.getElementById('enable-content-script').checked =
					data.settings.enableContentScript !== undefined ? data.settings.enableContentScript : true;
			}

			// Apply theme
			applyTheme(data.settings.theme || 'system');
		}

		// Restore format and length preferences
		if (formatSelect && data.formatPreference) {
			formatSelect.value = data.formatPreference;
		}

		if (lengthSelect && data.lengthPreference) {
			lengthSelect.value = data.lengthPreference;
		}
	});
}

/**
 * Save format and length preferences
 * @param {string} format - Selected format
 * @param {string} length - Selected length
 */
function saveFormatAndLengthPreferences(format, length) {
	chrome.storage.local.set({
		formatPreference: format,
		lengthPreference: length
	});
}

/**
 * Check for any pending messages (e.g., from context menu)
 */
function checkForPendingMessages() {
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		console.log('SidePanel received message:', message);

		if (message.action === 'summarizeSelection' && message.text) {
			// Handle text from selection
			showLoading(true);

			// For now, we'll just show the selected text as the summary
			setTimeout(() => {
				const selectedTextSummary = `Selected Text Summary:\n\n${message.text}`;
				displaySummary(selectedTextSummary);
				showLoading(false);
			}, 1000);
		}

		// Make sure to return true if we want to send a response asynchronously
		return true;
	});
}

/**
 * Show or hide loading indicator
 * @param {boolean} isLoading - Whether to show loading indicator
 */
function showLoading(isLoading) {
	if (isLoading) {
		loadingIndicator.classList.remove('hidden');
		summaryContent.classList.add('hidden');
		errorMessage.classList.add('hidden');
	} else {
		loadingIndicator.classList.add('hidden');
	}
}

/**
 * Display a summary in the UI
 * @param {string} summary - The summary text to display
 */
function displaySummary(summary) {
	summaryText.textContent = summary;
	summaryContent.classList.remove('hidden');
}

/**
 * Show error message
 */
function showError() {
	loadingIndicator.classList.add('hidden');
	summaryContent.classList.add('hidden');
	errorMessage.classList.remove('hidden');
}

/**
 * Update the footer with version and build info
 */
function updateFooterInfo() {
	const footerElement = document.querySelector('.app-footer p');
	if (footerElement) {
		const buildNumber = process.env.BUILD_NUMBER || 'dev';
		footerElement.textContent = `Project Chimera v1.0.0.${buildNumber}`;
	}
}

/**
 * Check if API key exists and redirect to settings if not
 */
function checkApiKeyAndRedirect() {
	chrome.storage.local.get(['settings'], data => {
		const settings = data.settings || {};
		const apiKey = settings.apiKey;

		if (!apiKey || apiKey.trim() === '') {
			console.log('No API key found, redirecting to settings tab');
			// Switch to settings tab
			switchToTab('settings');
		}
	});
}

/**
 * Switch to specified tab programmatically
 * @param {string} tabName - Name of the tab to switch to
 */
function switchToTab(tabName) {
	// Find the button for the requested tab
	const targetButton = Array.from(tabButtons).find(
		button => button.getAttribute('data-tab') === tabName
	);

	if (targetButton) {
		// Update active button
		tabButtons.forEach(btn => {
			btn.classList.remove('active');
		});
		targetButton.classList.add('active');

		// Update active panel
		tabPanels.forEach(panel => {
			panel.classList.remove('active');
			panel.classList.add('hidden');
		});

		const activePanel = document.getElementById(`${tabName}-tab`);
		activePanel.classList.add('active');
		activePanel.classList.remove('hidden');
	}
}

// Initialize the sidepanel when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	initialize();
	updateFooterInfo();
});
