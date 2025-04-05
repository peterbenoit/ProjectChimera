/**
 * Main JavaScript for Project Chimera SidePanel
 */
import { generateSummary } from '../../shared/api.js';
import { saveSummaryToHistory, getSummaryHistory, deleteSummaryFromHistory, clearSummaryHistory } from '../../shared/storage.js';

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

	// Load history data for the history tab
	loadHistoryData();

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

	// Error action buttons
	const retryBtn = document.getElementById('retry-btn');
	if (retryBtn) {
		retryBtn.addEventListener('click', handleSummarizeClick);
	}

	const settingsBtn = document.getElementById('settings-btn');
	if (settingsBtn) {
		settingsBtn.addEventListener('click', () => switchToTab('settings'));
	}

	// Add clear history button handler
	const clearHistoryBtn = document.getElementById('clear-history-btn');
	if (clearHistoryBtn) {
		clearHistoryBtn.addEventListener('click', async () => {
			showCustomConfirmation('Are you sure you want to clear all summary history?', async () => {
				await clearSummaryHistory();
				loadHistoryData();
			});
		});
	}

	// Add history tab activation listener
	const historyTabBtn = Array.from(tabButtons).find(
		button => button.getAttribute('data-tab') === 'history'
	);

	if (historyTabBtn) {
		historyTabBtn.addEventListener('click', () => {
			// Refresh history data when switching to history tab
			loadHistoryData();
		});
	}
}

/**
 * Handle summarize button click
 */
async function handleSummarizeClick() {
	try {
		showLoading(true);
		hideError();

		// Get the format and length preferences
		const format = formatSelect.value;
		const length = lengthSelect.value;

		// Get API key from storage
		const settings = await getSettings();
		if (!settings.apiKey) {
			throw new Error('API key is required. Please add your OpenAI API key in the Settings tab.');
		}

		// Request the page content from the content script
		const pageData = await requestPageContent();

		// Call the OpenAI API to generate the summary
		const summary = await generateSummary(
			pageData.content,
			{ format, length },
			settings.apiKey
		);

		// Display the summary
		displaySummary(summary);

		// Save the format and length preferences
		saveFormatAndLengthPreferences(format, length);

		// Check if this summary is a duplicate before saving
		const history = await getSummaryHistory();
		const isDuplicate = history.some(item =>
			item.metadata.url === pageData.metadata.url &&
			item.content === summary &&
			Math.abs(new Date(item.timestamp) - new Date()) < 60000 // Within 1 minute
		);

		if (!isDuplicate) {
			// Only save if it's not a duplicate
			await saveSummaryToHistory({
				content: summary,
				metadata: pageData.metadata,
				options: { format, length },
				timestamp: new Date().toISOString()
			});
		}

	} catch (error) {
		console.error('Error summarizing page:', error);
		showError(error.message || 'An error occurred while generating the summary.');
	}
}

/**
 * Get settings from storage
 * @returns {Promise<Object>}
 */
function getSettings() {
	return new Promise((resolve) => {
		chrome.storage.local.get(['settings'], data => {
			resolve(data.settings || {});
		});
	});
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

			// Check if we're on a chrome:// page or other restricted URL
			const tabUrl = tabs[0].url;
			if (tabUrl.startsWith('chrome://') || tabUrl.startsWith('chrome-extension://')) {
				reject(new Error('Summarization is not available on Chrome internal pages.'));
				return;
			}

			chrome.tabs.sendMessage(
				tabs[0].id,
				{ action: 'extractPageContent' },
				response => {
					if (chrome.runtime.lastError) {
						console.error("Content script error:", chrome.runtime.lastError);
						reject(new Error('Could not connect to the page. Try refreshing the page or verifying that the extension is enabled.'));
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
		// Don't automatically show anything else when hiding the loader
		// This allows the calling function to control what becomes visible
	}
}

/**
 * Hide error message
 */
function hideError() {
	errorMessage.classList.add('hidden');
}

/**
 * Display a summary in the UI
 * @param {string} summary - The summary text to display
 */
function displaySummary(summary) {
	summaryText.textContent = summary;
	summaryContent.classList.remove('hidden');
	loadingIndicator.classList.add('hidden'); // Make sure loading is hidden when showing summary
}

/**
 * Show error message
 * @param {string} message - Optional custom error message
 */
function showError(message) {
	loadingIndicator.classList.add('hidden');
	summaryContent.classList.add('hidden');
	errorMessage.classList.remove('hidden');

	// Update error message if provided
	if (message) {
		const errorText = errorMessage.querySelector('p');
		if (errorText) {
			errorText.textContent = message;
		}
	}
}

/**
 * Update the footer with version and build info
 */
function updateFooterInfo() {
	const footerElement = document.querySelector('.app-footer p');
	if (footerElement) {
		// Use a safer way to access the build number
		let buildNumber = 'dev';
		try {
			// Check if process.env is defined
			if (typeof process !== 'undefined' && process.env && process.env.BUILD_NUMBER) {
				buildNumber = process.env.BUILD_NUMBER;
			}
		} catch (e) {
			console.log('Build number not available:', e);
		}
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

/**
 * Load history data and populate the history tab
 */
async function loadHistoryData() {
	const historyList = document.getElementById('history-list');
	if (!historyList) return;

	const history = await getSummaryHistory();

	if (history.length === 0) {
		// Show empty state
		historyList.innerHTML = `
      <div class="empty-state">
        <p>No summary history yet.</p>
      </div>
    `;
		return;
	}

	// Clear existing content
	historyList.innerHTML = '';

	// Add each history item
	history.forEach((item, index) => {
		const historyItem = createHistoryItemElement(item, index);
		historyList.appendChild(historyItem);
	});

	// Set up search functionality
	setupHistorySearch();
}

/**
 * Create a history item element
 * @param {Object} item - The history item data
 * @param {number} index - The index of the item in the history array
 * @returns {HTMLElement} The created element
 */
function createHistoryItemElement(item, index) {
	const itemElement = document.createElement('div');
	itemElement.className = 'history-item';
	itemElement.dataset.index = index;

	const date = new Date(item.timestamp || item.metadata.timestamp);
	const formattedDate = date.toLocaleString();

	const formatName = getFormatDisplayName(item.options.format);
	const lengthName = getLengthDisplayName(item.options.length);

	itemElement.innerHTML = `
    <div class="history-item-header">
      <h3 class="history-item-title">${item.metadata.title || 'Untitled Page'}</h3>
      <div class="history-item-actions">
        <button class="history-copy-btn" title="Copy Summary">
          <span class="icon">📋</span>
        </button>
        <button class="history-delete-btn" title="Delete Summary">
          <span class="icon">🗑️</span>
        </button>
      </div>
    </div>
    <div class="history-item-meta">
      <span class="history-item-date">${formattedDate}</span>
      <span class="history-item-format">${formatName}, ${lengthName}</span>
    </div>
    <div class="history-item-url" title="${item.metadata.url}">
      ${item.metadata.url}
    </div>
    <div class="history-item-content hidden">
      ${item.content}
    </div>
  `;

	// Add event listeners to buttons
	const copyBtn = itemElement.querySelector('.history-copy-btn');
	const deleteBtn = itemElement.querySelector('.history-delete-btn');
	const contentDiv = itemElement.querySelector('.history-item-content');
	const titleElement = itemElement.querySelector('.history-item-title');

	// Add click event to title
	titleElement.addEventListener('click', () => {
		// Toggle content visibility when title is clicked
		contentDiv.classList.toggle('hidden');
	});

	copyBtn.addEventListener('click', () => {
		// We'll implement copy functionality later
		const content = item.content;
		navigator.clipboard.writeText(content)
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
	});

	deleteBtn.addEventListener('click', async () => {
		showCustomConfirmation('Are you sure you want to delete this summary?', async () => {
			await deleteSummaryFromHistory(index);
			loadHistoryData(); // Reload the list
		});
	});

	return itemElement;
}

/**
 * Get display name for format option
 * @param {string} format - Format identifier
 * @returns {string} Display name
 */
function getFormatDisplayName(format) {
	const formats = {
		'bullets': 'Bullet Points',
		'academic': 'Academic',
		'professional': 'Professional',
		'simplified': 'Simplified'
	};
	return formats[format] || format;
}

/**
 * Get display name for length option
 * @param {string} length - Length identifier
 * @returns {string} Display name
 */
function getLengthDisplayName(length) {
	const lengths = {
		'brief': 'Brief',
		'detailed': 'Detailed'
	};
	return lengths[length] || length;
}

/**
 * Set up history search functionality
 */
function setupHistorySearch() {
	const searchInput = document.getElementById('history-search');
	if (!searchInput) return;

	searchInput.addEventListener('input', () => {
		const query = searchInput.value.toLowerCase();
		const historyItems = document.querySelectorAll('.history-item');

		historyItems.forEach(item => {
			const title = item.querySelector('.history-item-title').textContent.toLowerCase();
			const url = item.querySelector('.history-item-url').textContent.toLowerCase();
			const content = item.querySelector('.history-item-content').textContent.toLowerCase();

			if (title.includes(query) || url.includes(query) || content.includes(query)) {
				item.style.display = 'block';
			} else {
				item.style.display = 'none';
			}
		});
	});
}

/**
 * Show a custom confirmation dialog
 *
 * @param {string} message - The confirmation message
 * @param {Function} onConfirm - Callback when user confirms
 * @param {Function} onCancel - Callback when user cancels
 */
function showCustomConfirmation(message, onConfirm, onCancel = () => { }) {
	// Create overlay
	const overlay = document.createElement('div');
	overlay.className = 'confirmation-overlay';

	// Create dialog
	const dialog = document.createElement('div');
	dialog.className = 'confirmation-dialog';

	dialog.innerHTML = `
    <p>${message}</p>
    <div class="confirmation-buttons">
      <button class="secondary-button cancel-btn">Cancel</button>
      <button class="primary-button confirm-btn">Confirm</button>
    </div>
  `;

	// Add dialog to overlay
	overlay.appendChild(dialog);

	// Add to body
	document.body.appendChild(overlay);

	// Add event listeners
	const confirmBtn = dialog.querySelector('.confirm-btn');
	const cancelBtn = dialog.querySelector('.cancel-btn');

	confirmBtn.addEventListener('click', () => {
		document.body.removeChild(overlay);
		onConfirm();
	});

	cancelBtn.addEventListener('click', () => {
		document.body.removeChild(overlay);
		onCancel();
	});
}

// Initialize the sidepanel when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	initialize();
	updateFooterInfo();
});
