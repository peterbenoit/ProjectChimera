/**
 * Main JavaScript for Smart Digest SidePanel
 */
import {
	marked
} from 'marked';
import {
	generateSummary
} from '../../shared/api.js';
import {
	saveSummaryToHistory,
	getSummaryHistory,
	deleteSummaryFromHistory,
	clearSummaryHistory
} from '../../shared/storage.js';
import {
	initSidepanelWordDefinition
} from '../wordDefinition.js';

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
const themeSelect = document.getElementById('theme-select');

// API Key Manager Elements
const apiKeyManager = document.getElementById('api-key-manager');
const apiKeyEmptyState = document.getElementById('api-key-empty-state');
const apiKeyConfiguredState = document.getElementById('api-key-configured-state');
const apiKeyInputState = document.getElementById('api-key-input-state');
const apiKeyPreview = document.getElementById('api-key-preview');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeyInputLabel = document.getElementById('api-key-input-label');
const saveApiKeyText = document.getElementById('save-api-key-text');

// API Key Action Buttons
const addApiKeyBtn = document.getElementById('add-api-key-btn');
const editApiKeyBtn = document.getElementById('edit-api-key-btn');
const deleteApiKeyBtn = document.getElementById('delete-api-key-btn');
const saveApiKeyBtn = document.getElementById('save-api-key-btn');
const cancelApiKeyBtn = document.getElementById('cancel-api-key-btn');
const toggleApiKeyVisibilityBtn = document.getElementById('toggle-api-key-visibility');

// API Key Validation
const apiKeyValidation = document.getElementById('api-key-validation');
const apiKeyValidationMessage = document.getElementById('api-key-validation-message');

// Add references to the new analysis divs
const toneBiasDiv = document.getElementById('tone-bias');
const highlightVagueClaimsDiv = document.getElementById('highlight-vague-claims');
const counterpointsDiv = document.getElementById('counterpoints');
const sentimentDetectionDiv = document.getElementById('sentiment-detection');
const intentSummaryDiv = document.getElementById('intent-summary');
const factContrastDiv = document.getElementById('fact-contrast');
const additionalAnalysisContainer = document.getElementById('additional-analysis');

let isSpeaking = false;
let lastSummaryMetadata = null;

// Remix Icons
const ICONS = {
	copy: `<i class="ri-file-copy-line"></i>`,
	check: `<i class="ri-check-line"></i>`,
	volumeOn: `<i class="ri-volume-up-line"></i>`,
	volumeOff: `<i class="ri-volume-mute-line"></i>`,
	share: `<i class="ri-share-line"></i>`,
	delete: `<i class="ri-delete-bin-line"></i>`
};


/**
 * Initialize the sidepanel UI
 */
function initialize() {
	// console.log('Project Chimera sidepanel initialized');

	setupTabNavigation();
	setupEventListeners();
	loadUserPreferences();
	checkForPendingMessages();
	checkApiKeyAndRedirect();
	loadHistoryData();
	initSidepanelWordDefinition();
	injectIcons();
	loadCurrentPageInfo();
	setupPageInfoUpdates();
}

/**
 * Inject SVG icons into buttons
 */
function injectIcons() {
	if (copyBtn) copyBtn.innerHTML = ICONS.copy;
	if (speakBtn) speakBtn.innerHTML = ICONS.volumeOn;
	const shareBtn = document.getElementById('share-btn');
	if (shareBtn) shareBtn.innerHTML = ICONS.share;
}

/**
 * Set up tab navigation functionality
 */
function setupTabNavigation() {
	tabButtons.forEach(button => {
		button.addEventListener('click', () => {
			const tabName = button.getAttribute('data-tab');

			tabButtons.forEach(btn => {
				btn.classList.remove('active');
			});
			button.classList.add('active');

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
	if (summarizeBtn) {
		summarizeBtn.addEventListener('click', handleSummarizeClick);
	}

	if (copyBtn) {
		copyBtn.addEventListener('click', handleCopyClick);
	}

	if (speakBtn) {
		speakBtn.addEventListener('click', handleSpeakClick);
	}

	if (saveSettingsBtn) {
		saveSettingsBtn.addEventListener('click', handleSaveSettings);
	}

	if (themeSelect) {
		themeSelect.addEventListener('change', handleThemeChange);
	}

	// API key field event listeners for better UX
	if (apiKeyInput) {
		// Clear field when user focuses (if it contains masked content)
		apiKeyInput.addEventListener('focus', () => {
			if (apiKeyInput.value.includes('*')) {
				apiKeyInput.value = '';
				apiKeyInput.placeholder = 'Enter your OpenAI API key';
			}
		});

		// Show helpful text based on what user types
		apiKeyInput.addEventListener('input', () => {
			const value = apiKeyInput.value.trim();

			// Remove all validation classes first
			apiKeyInput.classList.remove('valid', 'partial');

			if (value.startsWith('sk-') && value.length > 20) {
				apiKeyInput.classList.add('valid'); // Green for valid format
			} else if (value.length > 0 && !value.includes('*')) {
				apiKeyInput.classList.add('partial'); // Yellow for partial entry
			}
		});
	}

	const retryBtn = document.getElementById('retry-btn');
	if (retryBtn) {
		retryBtn.addEventListener('click', handleSummarizeClick);
	}

	const settingsBtn = document.getElementById('settings-btn');
	if (settingsBtn) {
		settingsBtn.addEventListener('click', () => switchToTab('settings'));
	}

	const clearHistoryBtn = document.getElementById('clear-history-btn');
	if (clearHistoryBtn) {
		clearHistoryBtn.addEventListener('click', async () => {
			showCustomConfirmation('Are you sure you want to clear all summary history?', async () => {
				await clearSummaryHistory();
				loadHistoryData();
			});
		});
	}

	const historyTabBtn = Array.from(tabButtons).find(
		button => button.getAttribute('data-tab') === 'history'
	);

	if (historyTabBtn) {
		historyTabBtn.addEventListener('click', () => {
			loadHistoryData();
		});
	}

	// Share functionality
	const shareBtn = document.getElementById('share-btn');
	if (shareBtn) {
		shareBtn.addEventListener('click', handleShareClick);
	}

	// Share modal functionality
	setupShareModal();

	// API Key Manager functionality
	setupApiKeyManager();
}

/**
 * Handle summarize button click
 */
async function handleSummarizeClick() {
	try {
		hideError();

		const format = formatSelect.value;
		const length = lengthSelect.value;

		const settings = await getSettings();
		if (!settings.apiKey) {
			throw new Error('API key is required. Please add your OpenAI API key in the Settings tab.');
		}

		const pageData = await requestPageContent();

		// Normalize the page URL (strip query and hash)
		const pageUrl = new URL(pageData.metadata.url);
		const normalizedUrl = pageUrl.origin + pageUrl.pathname;

		// Check for existing summary for this page in history (normalized URL)
		const history = await getSummaryHistory();
		const existingMatch = history.find(item =>
			(new URL(item.metadata.url).origin + new URL(item.metadata.url).pathname) === normalizedUrl
		);
		if (existingMatch) {
			const shouldContinue = await new Promise(resolve => {
				showCustomConfirmation(
					'A summary already exists for this page. Do you want to generate a new one anyway?',
					() => resolve(true), // User confirmed
					() => resolve(false) // User canceled
				);
			});

			if (!shouldContinue) {
				showLoading(false);
				return; // Exit without error
			}
		}

		showLoading(true);

		const feedbackSettings = {
			enableToneBiasAnalysis: settings.enableToneBiasAnalysis || false,
			enableHighlightVagueClaims: settings.enableHighlightVagueClaims || false,
			enableCounterpoints: settings.enableCounterpoints || false,
			enableSentimentDetection: settings.enableSentimentDetection || false,
			enableIntentSummary: settings.enableIntentSummary || false,
			enableFactContrast: settings.enableFactContrast || false
		};

		// Create timeout handler
		const timeoutHandler = () => {
			return new Promise((resolve) => {
				showTimeoutDialog(
					'The request is taking longer than 30 seconds. This might be due to network latency, high server load, or a complex page.',
					() => resolve(true),  // Continue waiting
					() => resolve(false)  // Cancel request
				);
			});
		};

		const summary = await generateSummary(
			pageData.content, {
			format,
			length,
			feedback: feedbackSettings
		},
			settings.apiKey,
			timeoutHandler
		);

		displaySummary(summary);
		lastSummaryMetadata = pageData.metadata;

		saveFormatAndLengthPreferences(format, length);

		// Use the already-fetched history to check for duplicates before saving (normalized URL)
		const isDuplicate = history.some(item =>
			(new URL(item.metadata.url).origin + new URL(item.metadata.url).pathname) === normalizedUrl &&
			item.content === summary &&
			Math.abs(new Date(item.timestamp) - new Date()) < 60000
		);

		if (!isDuplicate) {
			await saveSummaryToHistory({
				content: summary,
				metadata: pageData.metadata,
				options: {
					format,
					length
				},
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
		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, tabs => {
			if (!tabs[0]) {
				reject(new Error('No active tab found'));
				return;
			}

			const tabUrl = tabs[0].url;
			if (tabUrl.startsWith('chrome://') || tabUrl.startsWith('chrome-extension://') || tabUrl.startsWith('brave://') || tabUrl.startsWith('brave-extension://')) {
				reject(new Error('Summarization is not available on Chrome internal pages.'));
				return;
			}

			chrome.tabs.sendMessage(
				tabs[0].id, {
				action: 'extractPageContent'
			},
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
	if (summaryText.innerHTML) {
		navigator.clipboard.writeText(summaryText.textContent)
			.then(() => {
				copyBtn.innerHTML = ICONS.check;
				setTimeout(() => {
					copyBtn.innerHTML = ICONS.copy;
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
	if (isSpeaking) {
		chrome.tts.stop();
		// The 'interrupted' event will handle state change
		return;
	}

	if (summaryText.textContent) {
		chrome.tts.speak(summaryText.textContent, {
			rate: 1.0,
			onEvent: function (event) {
				switch (event.type) {
					case 'start':
						isSpeaking = true;
						speakBtn.innerHTML = ICONS.volumeOff;
						break;
					case 'end':
					case 'interrupted':
					case 'error':
						isSpeaking = false;
						speakBtn.innerHTML = ICONS.volumeOn;
						if (event.type === 'error') {
							console.error('TTS Error:', event.errorMessage);
						}
						break;
				}
			}
		});
	}
}


/**
 * Handle save settings button click
 */
function handleSaveSettings() {
	// Get current API key from storage to check if we need to update it
	chrome.storage.local.get(['settings'], (data) => {
		const currentSettings = data.settings || {};
		const currentApiKey = currentSettings.apiKey || '';

		// Check if the input contains a masked key (contains asterisks)
		const inputValue = apiKeyInput.value.trim();
		let apiKeyToSave = currentApiKey; // Default to keeping existing key

		// Only update API key if:
		// 1. Input doesn't contain asterisks (not masked), OR
		// 2. Input is empty (user wants to clear it), OR
		// 3. Input starts with 'sk-' (new OpenAI key format)
		if (inputValue === '' ||
			(!inputValue.includes('*') && inputValue.length > 10) ||
			inputValue.startsWith('sk-')) {
			apiKeyToSave = inputValue;
		}

		const settings = {
			theme: themeSelect.value,
			apiKey: apiKeyToSave,
			enableContentScript: document.getElementById('enable-content-script').checked,
			enableToneBiasAnalysis: document.getElementById('enable-tone-bias-analysis').checked,
			enableHighlightVagueClaims: document.getElementById('enable-highlight-vague-claims').checked,
			enableCounterpoints: document.getElementById('enable-counterpoints').checked,
			enableSentimentDetection: document.getElementById('enable-sentiment-detection').checked,
			enableIntentSummary: document.getElementById('enable-intent-summary').checked,
			enableFactContrast: document.getElementById('enable-fact-contrast').checked
		};

		chrome.storage.local.set({
			settings
		}, () => {
			const originalHTML = saveSettingsBtn.innerHTML;
			saveSettingsBtn.innerHTML = '<i class="ri-check-line"></i><span>Saved!</span>';
			setTimeout(() => {
				saveSettingsBtn.innerHTML = originalHTML;
			}, 1500);

			applyTheme(settings.theme);

			// Refresh the masked display
			loadUserPreferences();
		});
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
		if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			document.documentElement.setAttribute('data-theme', 'dark');
		} else {
			document.documentElement.setAttribute('data-theme', 'light');
		}

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
			if (themeSelect) themeSelect.value = data.settings.theme || 'system';

			// Handle API key display securely
			if (apiKeyInput) {
				const apiKey = data.settings.apiKey || '';
				if (apiKey) {
					// Show masked version: sk-...xyz (first 3 + last 3 characters)
					const maskedKey = apiKey.length > 6 ?
						`${apiKey.substring(0, 3)}${'*'.repeat(Math.min(20, apiKey.length - 6))}${apiKey.substring(apiKey.length - 3)}` :
						'*'.repeat(apiKey.length);
					apiKeyInput.value = maskedKey;
					apiKeyInput.placeholder = 'API key is set (click to change)';
				} else {
					apiKeyInput.value = '';
					apiKeyInput.placeholder = 'Enter your OpenAI API key';
				}
			}

			if (document.getElementById('enable-content-script')) {
				document.getElementById('enable-content-script').checked =
					data.settings.enableContentScript !== undefined ? data.settings.enableContentScript : true;
			}

			if (document.getElementById('enable-tone-bias-analysis')) {
				document.getElementById('enable-tone-bias-analysis').checked =
					data.settings.enableToneBiasAnalysis || false;
			}

			if (document.getElementById('enable-highlight-vague-claims')) {
				document.getElementById('enable-highlight-vague-claims').checked =
					data.settings.enableHighlightVagueClaims || false;
			}

			if (document.getElementById('enable-counterpoints')) {
				document.getElementById('enable-counterpoints').checked =
					data.settings.enableCounterpoints || false;
			}

			if (document.getElementById('enable-sentiment-detection')) {
				document.getElementById('enable-sentiment-detection').checked =
					data.settings.enableSentimentDetection || false;
			}

			if (document.getElementById('enable-intent-summary')) {
				document.getElementById('enable-intent-summary').checked =
					data.settings.enableIntentSummary || false;
			}

			if (document.getElementById('enable-fact-contrast')) {
				document.getElementById('enable-fact-contrast').checked =
					data.settings.enableFactContrast || false;
			}

			applyTheme(data.settings.theme || 'system');
		}

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
		// console.log('SidePanel received message:', message);

		if (message.action === 'summarizeSelection' && message.text) {
			showLoading(true);

			setTimeout(() => {
				const selectedTextSummary = `Selected Text Summary:\n\n${message.text}`;
				displaySummary(selectedTextSummary);
			}, 1000);
		}

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
 * Hide error message
 */
function hideError() {
	errorMessage.classList.add('hidden');
}

/**
 * Display a summary in the UI, filtering out empty or placeholder analysis sections.
 * @param {string} summary - The summary text to display
 */
function displaySummary(summary) {
	const html = convertMarkdownToHtml(summary.trim());

	// Create a temporary container to safely filter unwanted content
	const tempContainer = document.createElement('div');
	tempContainer.innerHTML = html;

	// Remove empty or placeholder sections
	const headings = tempContainer.querySelectorAll('h3');
	headings.forEach(heading => {
		const next = heading.nextElementSibling;
		if (
			next &&
			next.tagName === 'P' &&
			/[\s*(no|none|content here)\s*[^\]]*]/i.test(next.textContent.trim())
		) {
			heading.remove();
			next.remove();
		}
	});

	summaryText.innerHTML = tempContainer.innerHTML;

	// Hide analysis section containers
	toneBiasDiv.classList.add('hidden');
	highlightVagueClaimsDiv.classList.add('hidden');
	counterpointsDiv.classList.add('hidden');
	sentimentDetectionDiv.classList.add('hidden');
	intentSummaryDiv.classList.add('hidden');
	factContrastDiv.classList.add('hidden');
	additionalAnalysisContainer.classList.add('hidden');

	summaryContent.classList.remove('hidden');
	loadingIndicator.classList.add('hidden');
}

/**
 * Convert markdown formatting to HTML
 * @param {string} text - The markdown text to convert
 * @returns {string} - The converted HTML
 */
function convertMarkdownToHtml(text) {
	if (!text) return '';
	try {
		return marked.parse(text.trim());
	} catch (error) {
		console.error('Error parsing markdown with marked:', error);
		return text;
	}
}

/**
 * Process and enhance the vague claims section
 * @param {string} section - The vague claims section
 * @returns {string} - The processed section
 */
function processVagueClaimsSection(section) {
	// Clean up any excessive whitespace that might be causing padding issues
	section = section.replace(/\s{2,}/g, ' ').trim();

	// If no vague claims were found
	if (section.toLowerCase().includes('no significant vague claims') || section.toLowerCase().includes('no significant vague or unsubstantiated claims')) {
		return `
        <div class="analysis-section vague-claims-section">
            <p class="no-claims">No significant vague or unsubstantiated claims were identified in this content.</p>
        </div>`;
	}

	// Create a clean structure for the claims section
	let formattedContent = `
    <div class="analysis-section vague-claims-section">
        <p class="section-intro">The following vague or unsubstantiated claims were identified:</p>
        <div class="claims-list">`;

	// First, try to find claims using numbered patterns
	// Look for patterns like: 1. "Nvidia isn't opening the interconnect standard entirely" (Lack of Clarity, Medium)
	const claimPattern = /(\d+)\.\s*"([^"]+)"\s*(?:\(([^)]+)(?:,\s*([^)]+))?\))?/g;
	let match;
	let claimNumber = 1;
	let hasMatches = false;

	// Find claim patterns in the content
	while ((match = claimPattern.exec(section)) !== null) {
		hasMatches = true;
		const [, , claimText, claimType = '', confidence = ''] = match;

		// Get explanation and improvement text that follows this claim
		const startPos = match.index + match[0].length;
		const nextClaimMatch = section.substring(startPos).match(/\d+\.\s+"[^"]+"/);
		const endPos = nextClaimMatch ? startPos + nextClaimMatch.index : section.length;
		const followingText = section.substring(startPos, endPos);

		// Extract explanation and improvement from the following text
		const explanation = extractExplanation(followingText);
		const improvement = extractImprovement(followingText);

		// Format a clean claim item matching the structure in the screenshot
		formattedContent += formatClaimItem(claimNumber, claimText, claimType, confidence, explanation, improvement);
		claimNumber++;
	}

	// If no matches were found using pattern matching, try to parse the content directly
	if (!hasMatches && section.length > 30) {
		// Try to find claim sections based on the HTML structure
		const claimSections = section.match(/<li>[\s\S]*?<\/li>/g);

		if (claimSections && claimSections.length > 0) {
			claimSections.forEach((section, index) => {
				// Extract components from the claim section
				const claimMatch = section.match(/"([^"]+)"/);
				if (claimMatch) {
					const claimText = claimMatch[1].trim();

					const typeMatch = section.match(/<div class="claim-type">([^<]+)<\/div>/);
					const claimType = typeMatch ? typeMatch[1].replace('Type:', '').trim() : '';

					const confidenceMatch = section.match(/<div class="claim-confidence">([^<]+)<\/div>/);
					const confidence = confidenceMatch ? confidenceMatch[1].replace('Confidence:', '').trim() : '';

					const explanationMatch = section.match(/<div class="claim-explanation">([^<]+)<\/div>/);
					const explanation = explanationMatch ? explanationMatch[1].replace('Issue:', '').trim() : '';

					const improvementMatch = section.match(/<div class="claim-improvement">([^<]+)<\/div>/);
					const improvement = improvementMatch ? improvementMatch[1].replace('Suggested Improvement:', '').trim() : '';

					formattedContent += formatClaimItem(claimNumber++, claimText, claimType, confidence, explanation, improvement);
				}
			});
			hasMatches = true;
		}
	}

	// If we still don't have matches, use a more liberal approach to find claims
	if (!hasMatches) {
		// Find paragraphs that might contain claims
		const paragraphs = section.split(/(?:<p>|<div>)/);
		paragraphs.forEach((para, index) => {
			if (para.includes('"') && para.length > 30) {
				const quoteMatch = para.match(/"([^"]+)"/);
				if (quoteMatch) {
					const claimText = quoteMatch[1];
					formattedContent += formatClaimItem(claimNumber++, claimText, 'Unspecified', '', '', '');
				}
			}
		});
	}

	formattedContent += `
        </div>
    </div>`;

	// Return the section content, the H3 will be added by the caller if needed
	return formattedContent;
}

/**
 * Extract explanation text from a claim's following text
 * @param {string} text - The text following a claim
 * @returns {string} - The extracted explanation
 */
function extractExplanation(text) {
	const patterns = [
		/The statement lacks clarity on (.+?)(?=\.|\n|$)/i,
		/This claim (.+?)(?=\.|\n|$)/i,
		/Issue: (.+?)(?=\.|\n|$)/i,
		/Explanation: (.+?)(?=\.|\n|$)/i
	];

	for (const pattern of patterns) {
		const match = text.match(pattern);
		if (match && match[1]) {
			return match[1].trim() + '.';
		}
	}

	return '';
}

/**
 * Extract improvement suggestion from a claim's following text
 * @param {string} text - The text following a claim
 * @returns {string} - The extracted improvement suggestion
 */
function extractImprovement(text) {
	const patterns = [
		/To improve,? (.+?)(?=\.|\n|$)/i,
		/Suggested improvement: (.+?)(?=\.|\n|$)/i,
		/Improvement: (.+?)(?=\.|\n|$)/i
	];

	for (const pattern of patterns) {
		const match = text.match(pattern);
		if (match && match[1]) {
			return match[1].trim() + '.';
		}
	}

	return '';
}

/**
 * Format a claim item with consistent structure
 * @param {number} number - Claim number
 * @param {string} text - Claim text
 * @param {string} type - Claim type
 * @param {string} confidence - Confidence level
 * @param {string} explanation - Explanation text
 * @param {string} improvement - Improvement suggestion
 * @returns {string} - Formatted HTML for the claim
 */
function formatClaimItem(number, text, type, confidence, explanation, improvement) {
	// Clean up and normalize the inputs
	text = text ? text.trim() : '';
	type = type ? type.trim() : '';
	confidence = confidence ? confidence.trim() : '';

	// Handle different confidence formats
	let confidenceClass = confidence ? confidence.toLowerCase().replace(/\s+/g, '-') : '';

	return `
    <div class="claim-item">
        <div class="claim-number">${number}.</div>
        <div class="claim-text">"${text}"</div>
        ${type ? `<div class="claim-type"><span class="type-label">Type:</span> <span class="type-value">${type}</span></div>` : ''}
        ${confidence ? `<div class="claim-confidence"><span class="confidence ${confidenceClass}">${confidence}</span></div>` : ''}
        ${explanation ? `<div class="claim-explanation"><span class="explanation-label">Issue:</span> ${explanation}</div>` : ''}
        ${improvement ? `<div class="claim-improvement"><span class="improvement-label">Suggested Improvement:</span> ${improvement}</div>` : ''}
    </div>`;
}

/**
 * Format a claim from extracted details (helper for alternative parsing)
 * @param {number} number - The claim number
 * @param {Object} details - The claim details
 * @returns {string} - Formatted HTML for the claim
 */
function formatClaimFromDetails(number, details) {
	return formatClaimItem(
		number,
		details.text || 'Unspecified claim',
		details.type || '',
		details.confidence || '',
		details.explanation || '',
		details.improvement || ''
	);
}

/**
 * Show error message
 * @param {string} message - Optional custom error message
 */
function showError(message) {
	loadingIndicator.classList.add('hidden');
	summaryContent.classList.add('hidden');
	errorMessage.classList.remove('hidden');

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
		let buildNumber = 'dev';
		try {
			if (typeof process !== 'undefined' && process.env && process.env.BUILD_NUMBER) {
				buildNumber = process.env.BUILD_NUMBER;
			}
		} catch (e) {
			// Build number not available in production
		}
		footerElement.textContent = `Smart Digest v1.1.0`;
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
			// No API key found, redirecting to settings tab
			switchToTab('settings');
		}
	});
}

/**
 * Switch to specified tab programmatically
 * @param {string} tabName - Name of the tab to switch to
 */
function switchToTab(tabName) {
	const targetButton = Array.from(tabButtons).find(
		button => button.getAttribute('data-tab') === tabName
	);

	if (targetButton) {
		tabButtons.forEach(btn => {
			btn.classList.remove('active');
		});
		targetButton.classList.add('active');

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
		historyList.innerHTML = `
      <div class="empty-state">
        <p>No summary history yet.</p>
      </div>
    `;
		return;
	}

	historyList.innerHTML = '';

	history.forEach((item, index) => {
		const historyItem = createHistoryItemElement(item, index);
		historyList.appendChild(historyItem);
	});

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

	let formattedContent = item.content;

	if (item.options.format === 'bullets') {
		formattedContent = item.content
			.split('\n')
			.filter(line => line.trim())
			.map(line => `<div class="bullet-point">${line.trim()}</div>`)
			.join('');
	}

	itemElement.innerHTML = `
		<div class="history-item-header">
			<h3 class="history-item-title">${item.metadata.title || 'Untitled Page'}</h3>
			<div class="history-item-actions">
				<button class="history-copy-btn" title="Copy Summary">${ICONS.copy}</button>
				<button class="history-delete-btn" title="Delete Summary">${ICONS.delete}</button>
			</div>
		</div>
		<div class="history-item-meta">
			<span class="history-item-date">${formattedDate}</span>
			<span class="history-item-format">${formatName}, ${lengthName}</span>
		</div>
		<a href="${item.metadata.url}" class="history-item-url" title="${item.metadata.url}">${item.metadata.url}</a>
		<div class="history-item-content hidden">${formattedContent}</div>
	`;

	const copyBtn = itemElement.querySelector('.history-copy-btn');
	const deleteBtn = itemElement.querySelector('.history-delete-btn');
	const contentDiv = itemElement.querySelector('.history-item-content');
	const titleElement = itemElement.querySelector('.history-item-title');

	titleElement.addEventListener('click', () => {
		contentDiv.classList.toggle('hidden');
	});

	copyBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		const content = item.content;
		navigator.clipboard.writeText(content)
			.then(() => {
				copyBtn.innerHTML = ICONS.check;
				setTimeout(() => {
					copyBtn.innerHTML = ICONS.copy;
				}, 1500);
			})
			.catch(err => {
				console.error('Could not copy text:', err);
			});
	});

	deleteBtn.addEventListener('click', async (e) => {
		e.stopPropagation();
		showCustomConfirmation('Are you sure you want to delete this summary?', async () => {
			await deleteSummaryFromHistory(index);
			loadHistoryData();
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
	const existingOverlay = document.querySelector('.confirmation-overlay');
	if (existingOverlay) {
		document.body.removeChild(existingOverlay);
	}

	const overlay = document.createElement('div');
	overlay.className = 'confirmation-overlay';

	const dialog = document.createElement('div');
	dialog.className = 'confirmation-dialog';

	dialog.innerHTML = `
    <p>${message}</p>
    <div class="confirmation-buttons">
      <button class="secondary-button cancel-btn">Cancel</button>
      <button class="primary-button blue confirm-btn">Confirm</button>
    </div>
  `;

	overlay.appendChild(dialog);

	document.body.appendChild(overlay);

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

/**
 * Show a timeout dialog with retry/cancel options
 *
 * @param {string} message - The timeout message
 * @param {Function} onRetry - Callback when user chooses to continue waiting
 * @param {Function} onCancel - Callback when user chooses to cancel
 */
function showTimeoutDialog(message, onRetry, onCancel) {
	const existingOverlay = document.querySelector('.timeout-overlay');
	if (existingOverlay) {
		document.body.removeChild(existingOverlay);
	}

	const overlay = document.createElement('div');
	overlay.className = 'timeout-overlay confirmation-overlay';

	const dialog = document.createElement('div');
	dialog.className = 'timeout-dialog confirmation-dialog';

	dialog.innerHTML = `
    <div class="timeout-header">
      <h3>Request Taking Longer Than Expected</h3>
    </div>
    <p>${message}</p>
    <div class="timeout-details">
      <p><strong>Possible causes:</strong></p>
      <ul>
        <li>Network connectivity issues</li>
        <li>High server load at OpenAI</li>
        <li>Complex content requiring more processing time</li>
        <li>API rate limiting</li>
      </ul>
    </div>
    <div class="confirmation-buttons">
      <button class="secondary-button cancel-btn">Cancel Request</button>
      <button class="primary-button retry-btn">Continue Waiting</button>
    </div>
  `;

	overlay.appendChild(dialog);
	document.body.appendChild(overlay);

	const retryBtn = dialog.querySelector('.retry-btn');
	const cancelBtn = dialog.querySelector('.cancel-btn');

	retryBtn.addEventListener('click', () => {
		document.body.removeChild(overlay);
		onRetry();
	});

	cancelBtn.addEventListener('click', () => {
		document.body.removeChild(overlay);
		onCancel();
	});

	// Auto-focus the continue button as it's the recommended action
	retryBtn.focus();
}

/**
 * Handle share button click
 */
async function handleShareClick() {
	if (!summaryText.textContent) {
		return; // No summary to share
	}

	if (!lastSummaryMetadata) {
		showError("Cannot share summary because the original page's data is missing. Please be sure you're on the page you want to share, else generate a new summary.");
		console.error('Error preparing share content:', 'lastSummaryMetadata is null');
		return;
	}

	try {
		// Get current page data for sharing
		const pageData = await requestPageContent();

		// Generate platform-specific content
		await generateShareContent(summaryText.textContent, pageData.metadata);

		// Show the share modal
		const shareModal = document.getElementById('share-modal');
		shareModal.classList.remove('hidden');
	} catch (error) {
		console.error('Error preparing share content:', error);
		showError(error.message || 'An error occurred while preparing the share content.');
	}
}

/**
 * Set up share modal functionality
 */
function setupShareModal() {
	const shareModal = document.getElementById('share-modal');
	const closeBtn = document.getElementById('close-share-modal');
	const shareTabButtons = document.querySelectorAll('.share-tab-button');
	const sharePanels = document.querySelectorAll('.share-panel');
	const copyShareBtns = document.querySelectorAll('.copy-share-btn');

	// Close modal functionality
	if (closeBtn) {
		closeBtn.addEventListener('click', () => {
			shareModal.classList.add('hidden');
		});
	}

	// Close modal when clicking outside
	shareModal.addEventListener('click', (e) => {
		if (e.target === shareModal) {
			shareModal.classList.add('hidden');
		}
	});

	// Share tab navigation
	shareTabButtons.forEach(button => {
		button.addEventListener('click', () => {
			const platform = button.getAttribute('data-platform');

			// Update active tab button
			shareTabButtons.forEach(btn => btn.classList.remove('active'));
			button.classList.add('active');

			// Update active panel
			sharePanels.forEach(panel => {
				panel.classList.remove('active');
				panel.classList.add('hidden');
			});

			const activePanel = document.getElementById(`${platform}-share`);
			if (activePanel) {
				activePanel.classList.add('active');
				activePanel.classList.remove('hidden');
			}
		});
	});

	// Copy functionality for each platform
	copyShareBtns.forEach(btn => {
		btn.addEventListener('click', async () => {
			const platform = btn.getAttribute('data-platform');
			let textToCopy = '';

			if (platform === 'email') {
				// For email, copy both subject and body
				const subject = document.getElementById('email-subject').value;
				const body = document.getElementById('email-content').value;
				textToCopy = `Subject: ${subject}\n\n${body}`;
			} else {
				// For other platforms, copy the textarea content
				const textarea = document.getElementById(`${platform}-content`);
				textToCopy = textarea.value;
			}

			try {
				await navigator.clipboard.writeText(textToCopy);

				// Show success feedback
				const originalText = btn.textContent;
				btn.textContent = 'Copied!';
				btn.style.backgroundColor = '#28a745';

				setTimeout(() => {
					btn.textContent = originalText;
					btn.style.backgroundColor = '';
				}, 1500);
			} catch (error) {
				console.error('Failed to copy text:', error);
			}
		});
	});
}

/**
 * Shorten URL using the smawl service
 * @param {string} url - The URL to shorten
 * @returns {Promise<string>} - The shortened URL or original URL if shortening fails
 */
async function shortenUrl(url) {
	try {
		const response = await fetch('https://smawl.vercel.app/api/shorten', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ url: url })
		});

		if (response.ok) {
			const data = await response.json();
			return data.shortUrl || url;
		} else {
			console.warn('URL shortening failed, using original URL');
			return url;
		}
	} catch (error) {
		console.warn('URL shortening error:', error);
		return url; // Fallback to original URL
	}
}

/**
 * Generate platform-specific share content
 * @param {string} summary - The summary text
 * @param {Object} metadata - Page metadata
 */
async function generateShareContent(summary, metadata) {
	const title = metadata.title || 'Untitled Page';
	const originalUrl = metadata.url;
	const timestamp = new Date().toLocaleDateString();

	// Shorten the URL for social media platforms
	const shortUrl = await shortenUrl(originalUrl);

	// Generate content for each platform
	const twitterContent = generateTwitterContent(summary, title, shortUrl);
	const linkedinContent = generateLinkedInContent(summary, title, shortUrl);
	const facebookContent = generateFacebookContent(summary, title, shortUrl);
	const emailContent = generateEmailContent(summary, title, originalUrl, timestamp); // Use original URL for email
	const generalContent = generateGeneralContent(summary, title, shortUrl);

	// Update UI elements
	updateSharePanel('twitter', twitterContent);
	updateSharePanel('linkedin', linkedinContent);
	updateSharePanel('facebook', facebookContent);
	updateEmailPanel(emailContent);
	updateSharePanel('general', generalContent);
}

/**
 * Generate Twitter/X optimized content
 * @param {string} summary - The summary text
 * @param {string} title - Page title
 * @param {string} url - Page URL
 * @returns {string} Twitter-optimized content
 */
function generateTwitterContent(summary, title, url) {
	// Extract key insight from summary (first meaningful sentence)
	const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 20);
	const keyInsight = sentences[0]?.trim() || summary.substring(0, 100);

	// Build tweet with character limit in mind
	const baseText = `Key insight from "${title}": ${keyInsight}`;
	const attribution = `\n\nSource: ${url}\nSummarized with Smart Digest`;

	const maxContentLength = 200 - attribution.length;
	let content = baseText;

	if (content.length > maxContentLength) {
		content = content.substring(0, maxContentLength - 3) + '...';
	}

	return content + attribution;
}

/**
 * Generate LinkedIn optimized content
 * @param {string} summary - The summary text
 * @param {string} title - Page title
 * @param {string} url - Page URL
 * @returns {string} LinkedIn-optimized content
 */
function generateLinkedInContent(summary, title, url) {
	// Extract key points from summary
	const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 15);
	const keyPoints = sentences.slice(0, 4).map(s => s.trim());

	let content = `📚 Just read an insightful article: "${title}"\n\n`;
	content += `Key takeaways:\n`;

	keyPoints.forEach((point, index) => {
		const emoji = ['💡', '🔍', '📈', '⚡'][index] || '•';
		content += `${emoji} ${point}\n`;
	});

	content += `\n🔗 Read the full article: ${url}`;
	content += `\n\n#insights #learning #productivity`;
	content += `\n\nSummarized with Smart Digest`;

	return content;
}

/**
 * Generate Facebook optimized content
 * @param {string} summary - The summary text
 * @param {string} title - Page title
 * @param {string} url - Page URL
 * @returns {string} Facebook-optimized content
 */
function generateFacebookContent(summary, title, url) {
	// Extract main points in a conversational tone
	const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 15);
	const mainPoints = sentences.slice(0, 3).map(s => s.trim());

	let content = `Found this interesting: "${title}"\n\n`;

	if (mainPoints.length > 0) {
		content += `Here are the main points:\n\n`;
		mainPoints.forEach(point => {
			content += `• ${point}\n`;
		});
	}

	content += `\nCheck it out: ${url}`;
	content += `\n\nSummarized with Smart Digest`;

	return content;
}

/**
 * Generate email optimized content
 * @param {string} summary - The summary text
 * @param {string} title - Page title
 * @param {string} url - Page URL
 * @param {string} timestamp - Current date
 * @returns {Object} Email content with subject and body
 */
function generateEmailContent(summary, title, url, timestamp) {
	const subject = `Article Summary: ${title}`;

	let body = `Hi,\n\n`;
	body += `I thought you might find this article interesting: "${title}"\n\n`;
	body += `Here's a summary of the key points:\n\n`;
	body += `${summary}\n\n`;
	body += `---\n`;
	body += `Original Article: ${url}\n`;
	body += `Summary Date: ${timestamp}\n`;
	body += `Summarized with Smart Digest\n\n`;
	body += `Best regards`;

	return { subject, body };
}

/**
 * Generate general format content
 * @param {string} summary - The summary text
 * @param {string} title - Page title
 * @param {string} url - Page URL
 * @returns {string} General format content
 */
function generateGeneralContent(summary, title, url) {
	let content = `Summary of "${title}"\n\n`;
	content += `${summary}\n\n`;
	content += `---\n`;
	content += `Source: ${url}\n`;
	content += `Summarized with Smart Digest`;

	return content;
}

/**
 * Update share panel content
 * @param {string} platform - Platform name
 * @param {string} content - Content to display
 */
function updateSharePanel(platform, content) {
	const textarea = document.getElementById(`${platform}-content`);
	if (textarea) {
		textarea.value = content;

		// Update character count if applicable
		const charCountElement = document.getElementById(`${platform}-char-count`);
		if (charCountElement) {
			if (platform === 'twitter') {
				charCountElement.textContent = `${content.length}/200`;
			} else if (platform === 'linkedin') {
				charCountElement.textContent = `${content.length}/3000`;
			} else if (platform === 'facebook') {
				charCountElement.textContent = `${content.length} characters`;
			}
		}
	}
}

/**
 * Update email panel content
 * @param {Object} emailContent - Email content with subject and body
 */
function updateEmailPanel(emailContent) {
	const subjectInput = document.getElementById('email-subject');
	const bodyTextarea = document.getElementById('email-content');

	if (subjectInput) {
		subjectInput.value = emailContent.subject;
	}

	if (bodyTextarea) {
		bodyTextarea.value = emailContent.body;
	}
}

/**
 * Set up listeners for page info updates
 */
function setupPageInfoUpdates() {
	// Listen for tab updates (URL changes, title changes, etc.)
	if (chrome.tabs && chrome.tabs.onUpdated) {
		chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
			// Only update if this is the active tab and something relevant changed
			chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
				if (activeTabs[0] && activeTabs[0].id === tabId) {
					// Update page info when URL, title, or favicon changes
					if (changeInfo.url || changeInfo.title || changeInfo.favIconUrl || changeInfo.status === 'complete') {
						loadCurrentPageInfo();
					}
				}
			});
		});
	}

	// Listen for tab activation (switching between tabs)
	if (chrome.tabs && chrome.tabs.onActivated) {
		chrome.tabs.onActivated.addListener((activeInfo) => {
			loadCurrentPageInfo();
		});
	}

	// Listen for window focus changes
	if (chrome.windows && chrome.windows.onFocusChanged) {
		chrome.windows.onFocusChanged.addListener((windowId) => {
			if (windowId !== chrome.windows.WINDOW_ID_NONE) {
				loadCurrentPageInfo();
			}
		});
	}
}

/**
 * Load current page information and populate the page info card
 */
async function loadCurrentPageInfo() {
	const pageInfoCard = document.getElementById('current-page-info');
	const pageFavicon = document.getElementById('page-favicon');
	const fallbackIcon = document.querySelector('.page-info-fallback-icon');
	const pageTitle = document.getElementById('page-title');
	const pageUrl = document.getElementById('page-url');
	const pageDomain = document.getElementById('page-domain');
	const pageStatus = document.getElementById('page-status');

	if (!pageInfoCard) return;

	try {
		// Get current tab information
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (!tabs[0]) {
				updatePageInfo('No active tab', '', '', 'No tab found');
				return;
			}

			const tab = tabs[0];
			const title = tab.title || 'Untitled Page';
			let domain = '';
			let status = 'Ready to summarize';

			console.log('Current tab:', tab);
			console.log('Tab URL:', tab.url);
			console.log('Tab Title:', title);

			// add a check for empty or undefined tab.url
			if (!tab.url || tab.url === '') {
				updatePageInfo('No active tab', '', '', 'No URL found');
				return;
			}

			// Check if it's a special Chrome page or extension page
			if (tab.url.startsWith('chrome://') ||
				tab.url.startsWith('chrome-extension://') ||
				tab.url.startsWith('moz-extension://') ||
				tab.url.startsWith('edge-extension://') ||
				tab.url.startsWith('brave-extension://')) {
				// Handle special browser pages
				if (tab.url.startsWith('chrome://')) {
					domain = 'Chrome';
					status = 'Chrome internal page';
				} else if (tab.url.startsWith('chrome-extension://')) {
					domain = 'Extension';
					status = 'Chrome extension page';
				} else {
					domain = 'Browser';
					status = 'Browser internal page';
				}

				updatePageInfo(title, tab.url, domain, status);

				// Handle favicon for special pages
				if (tab.favIconUrl && tab.favIconUrl !== '') {
					pageFavicon.src = tab.favIconUrl;
					pageFavicon.style.display = 'block';
					fallbackIcon.style.display = 'none';

					pageFavicon.onerror = () => {
						pageFavicon.style.display = 'none';
						fallbackIcon.style.display = 'flex';
					};
				} else {
					pageFavicon.style.display = 'none';
					fallbackIcon.style.display = 'flex';
				}
				return;
			}

			// Try to parse regular URLs
			try {
				const url = new URL(tab.url);
				domain = url.hostname;
			} catch (error) {
				// If URL parsing fails, extract domain manually or use fallback
				console.warn('Failed to parse URL:', tab.url, error);
				const urlMatch = tab.url.match(/^https?:\/\/([^\/]+)/);
				domain = urlMatch ? urlMatch[1] : 'Unknown';
			}

			// Try to get favicon
			if (tab.favIconUrl && tab.favIconUrl !== '') {
				pageFavicon.src = tab.favIconUrl;
				pageFavicon.style.display = 'block';
				fallbackIcon.style.display = 'none';

				// Handle favicon load error
				pageFavicon.onerror = () => {
					pageFavicon.style.display = 'none';
					fallbackIcon.style.display = 'flex';
				};
			} else {
				pageFavicon.style.display = 'none';
				fallbackIcon.style.display = 'flex';
			}

			// Update page information
			updatePageInfo(title, tab.url, domain, status);
		});

	} catch (error) {
		console.error('Error loading page info:', error);
		updatePageInfo('Error loading page info', '', '', 'Error occurred');
	}

	function updatePageInfo(title, url, domain, status) {
		if (pageTitle) pageTitle.textContent = title;
		if (pageUrl) pageUrl.textContent = url;
		if (pageDomain) pageDomain.textContent = domain;
		if (pageStatus) pageStatus.textContent = status;
	}
}

/**
 * Set up API Key Manager functionality
 */
function setupApiKeyManager() {
	let currentApiKey = '';
	let isEditMode = false;

	// Load initial state
	loadApiKeyState();

	// Add API Key button
	if (addApiKeyBtn) {
		addApiKeyBtn.addEventListener('click', () => {
			showApiKeyInputState('add');
		});
	}

	// Edit API Key button
	if (editApiKeyBtn) {
		editApiKeyBtn.addEventListener('click', () => {
			showApiKeyInputState('edit');
		});
	}

	// Delete API Key button
	if (deleteApiKeyBtn) {
		deleteApiKeyBtn.addEventListener('click', () => {
			showCustomConfirmation('Are you sure you want to delete your API key?', () => {
				deleteApiKey();
			});
		});
	}

	// Save API Key button
	if (saveApiKeyBtn) {
		saveApiKeyBtn.addEventListener('click', () => {
			saveApiKey();
		});
	}

	// Cancel API Key button
	if (cancelApiKeyBtn) {
		cancelApiKeyBtn.addEventListener('click', () => {
			cancelApiKeyInput();
		});
	}

	// Toggle password visibility
	if (toggleApiKeyVisibilityBtn) {
		toggleApiKeyVisibilityBtn.addEventListener('click', () => {
			togglePasswordVisibility();
		});
	}

	// API Key input validation
	if (apiKeyInput) {
		apiKeyInput.addEventListener('input', () => {
			validateApiKeyInput();
		});

		apiKeyInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				saveApiKey();
			} else if (e.key === 'Escape') {
				e.preventDefault();
				cancelApiKeyInput();
			}
		});
	}

	/**
	 * Load and display current API key state
	 */
	function loadApiKeyState() {
		chrome.storage.local.get(['settings'], (data) => {
			const settings = data.settings || {};
			currentApiKey = settings.apiKey || '';

			if (currentApiKey) {
				showConfiguredState();
			} else {
				showEmptyState();
			}
		});
	}

	/**
	 * Show empty state (no API key configured)
	 */
	function showEmptyState() {
		apiKeyEmptyState.classList.remove('hidden');
		apiKeyConfiguredState.classList.add('hidden');
		apiKeyInputState.classList.add('hidden');
	}

	/**
	 * Show configured state (API key exists)
	 */
	function showConfiguredState() {
		apiKeyEmptyState.classList.add('hidden');
		apiKeyConfiguredState.classList.remove('hidden');
		apiKeyInputState.classList.add('hidden');

		// Update preview with masked key
		if (apiKeyPreview && currentApiKey) {
			const maskedKey = currentApiKey.length > 6 ?
				`${currentApiKey.substring(0, 3)}${'*'.repeat(Math.min(20, currentApiKey.length - 6))}${currentApiKey.substring(currentApiKey.length - 3)}` :
				'*'.repeat(currentApiKey.length);
			apiKeyPreview.textContent = maskedKey;
		}
	}

	/**
	 * Show input state for adding or editing API key
	 * @param {string} mode - 'add' or 'edit'
	 */
	function showApiKeyInputState(mode) {
		isEditMode = mode === 'edit';

		apiKeyEmptyState.classList.add('hidden');
		apiKeyConfiguredState.classList.add('hidden');
		apiKeyInputState.classList.remove('hidden');

		// Update UI based on mode
		if (isEditMode) {
			apiKeyInputLabel.textContent = 'Enter your new OpenAI API Key';
			saveApiKeyText.textContent = 'Update';
		} else {
			apiKeyInputLabel.textContent = 'Enter your OpenAI API Key';
			saveApiKeyText.textContent = 'Save';
		}

		// Clear input and focus
		apiKeyInput.value = '';
		apiKeyInput.type = 'password';
		toggleApiKeyVisibilityBtn.querySelector('i').className = 'ri-eye-line';
		hideValidationMessage();
		apiKeyInput.focus();
	}

	/**
	 * Save the API key
	 */
	function saveApiKey() {
		const newApiKey = apiKeyInput.value.trim();

		if (!newApiKey) {
			showValidationMessage('Please enter an API key');
			return;
		}

		if (!isValidApiKey(newApiKey)) {
			showValidationMessage('Please enter a valid OpenAI API key (should start with "sk-")');
			return;
		}

		// Save to storage
		chrome.storage.local.get(['settings'], (data) => {
			const settings = data.settings || {};
			settings.apiKey = newApiKey;

			chrome.storage.local.set({ settings }, () => {
				currentApiKey = newApiKey;
				showConfiguredState();

				// Show success feedback
				const originalText = saveApiKeyBtn.innerHTML;
				saveApiKeyBtn.innerHTML = '<i class="ri-check-line"></i><span>Saved!</span>';
				setTimeout(() => {
					saveApiKeyBtn.innerHTML = originalText;
				}, 1500);
			});
		});
	}

	/**
	 * Delete the API key
	 */
	function deleteApiKey() {
		chrome.storage.local.get(['settings'], (data) => {
			const settings = data.settings || {};
			delete settings.apiKey;

			chrome.storage.local.set({ settings }, () => {
				currentApiKey = '';
				showEmptyState();
			});
		});
	}

	/**
	 * Cancel API key input and return to previous state
	 */
	function cancelApiKeyInput() {
		if (currentApiKey) {
			showConfiguredState();
		} else {
			showEmptyState();
		}
	}

	/**
	 * Toggle password visibility
	 */
	function togglePasswordVisibility() {
		const icon = toggleApiKeyVisibilityBtn.querySelector('i');

		if (apiKeyInput.type === 'password') {
			apiKeyInput.type = 'text';
			icon.className = 'ri-eye-off-line';
		} else {
			apiKeyInput.type = 'password';
			icon.className = 'ri-eye-line';
		}
	}

	/**
	 * Validate API key input and show visual feedback
	 */
	function validateApiKeyInput() {
		const value = apiKeyInput.value.trim();

		// Remove all validation classes
		apiKeyInput.classList.remove('valid', 'partial', 'invalid');
		hideValidationMessage();

		if (value.length === 0) {
			return;
		}

		if (isValidApiKey(value)) {
			apiKeyInput.classList.add('valid');
		} else if (value.startsWith('sk-') && value.length > 10) {
			apiKeyInput.classList.add('partial');
		} else {
			apiKeyInput.classList.add('invalid');
		}
	}

	/**
	 * Check if API key format is valid
	 * @param {string} key - The API key to validate
	 * @returns {boolean} - Whether the key format is valid
	 */
	function isValidApiKey(key) {
		// OpenAI API keys start with 'sk-' and are typically 51 characters long
		return key.startsWith('sk-') && key.length >= 20;
	}

	/**
	 * Show validation error message
	 * @param {string} message - The error message to show
	 */
	function showValidationMessage(message) {
		apiKeyValidationMessage.textContent = message;
		apiKeyValidation.classList.remove('hidden');
	}

	/**
	 * Hide validation error message
	 */
	function hideValidationMessage() {
		apiKeyValidation.classList.add('hidden');
	}
}

document.addEventListener('DOMContentLoaded', () => {
	initialize();
	updateFooterInfo();
	// Intercept clicks on .history-item-url links and open them in a new tab using chrome.tabs.create
	document.addEventListener('click', event => {
		const anchor = event.target.closest('a.history-item-url');
		if (anchor && anchor.href) {
			event.preventDefault();
			chrome.tabs.create({
				url: anchor.href
			});
		}
	});
});
