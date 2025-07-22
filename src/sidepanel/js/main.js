/**
 * Main JavaScript for Project Chimera SidePanel
 */
import { marked } from 'marked';
import { generateSummary } from '../../shared/api.js';
import { saveSummaryToHistory, getSummaryHistory, deleteSummaryFromHistory, clearSummaryHistory } from '../../shared/storage.js';
import { initSidepanelWordDefinition } from '../wordDefinition.js';

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

// Add references to the new analysis divs
const toneBiasDiv = document.getElementById('tone-bias');
const highlightVagueClaimsDiv = document.getElementById('highlight-vague-claims');
const counterpointsDiv = document.getElementById('counterpoints');
const sentimentDetectionDiv = document.getElementById('sentiment-detection');
const intentSummaryDiv = document.getElementById('intent-summary');
const factContrastDiv = document.getElementById('fact-contrast');
const additionalAnalysisContainer = document.getElementById('additional-analysis');

let isInitialized = false;

/**
 * Initialize the sidepanel UI
 */
function initialize() {
	// console.log('Initialize called from:', new Error().stack);
	// console.log('Project Chimera sidepanel initialized');

	setupTabNavigation();

	setupEventListeners();

	loadUserPreferences();

	checkForPendingMessages();

	checkApiKeyAndRedirect();

	loadHistoryData();

	// Initialize word definition functionality
	initSidepanelWordDefinition();
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
}

/**
 * Handle summarize button click
 */
async function handleSummarizeClick() {
	try {
		showLoading(true);
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
			const confirm = window.confirm('A summary already exists for this page. Do you want to generate a new one anyway?');
			if (!confirm) {
				showLoading(false);
				return;
			}
		}

		const feedbackSettings = {
			enableToneBiasAnalysis: settings.enableToneBiasAnalysis || false,
			enableHighlightVagueClaims: settings.enableHighlightVagueClaims || false,
			enableCounterpoints: settings.enableCounterpoints || false,
			enableSentimentDetection: settings.enableSentimentDetection || false,
			enableIntentSummary: settings.enableIntentSummary || false,
			enableFactContrast: settings.enableFactContrast || false
		};

		const summary = await generateSummary(
			pageData.content,
			{ format, length, feedback: feedbackSettings },
			settings.apiKey
		);

		// console.log('Generated summary:', summary);

		displaySummary(summary);

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
	if (summaryText.innerHTML) {
		navigator.clipboard.writeText(summaryText.textContent)
			.then(() => {
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
		enableContentScript: document.getElementById('enable-content-script').checked,
		enableToneBiasAnalysis: document.getElementById('enable-tone-bias-analysis').checked,
		enableHighlightVagueClaims: document.getElementById('enable-highlight-vague-claims').checked,
		enableCounterpoints: document.getElementById('enable-counterpoints').checked,
		enableSentimentDetection: document.getElementById('enable-sentiment-detection').checked,
		enableIntentSummary: document.getElementById('enable-intent-summary').checked,
		enableFactContrast: document.getElementById('enable-fact-contrast').checked
	};

	chrome.storage.local.set({ settings }, () => {
		const originalText = saveSettingsBtn.textContent;
		saveSettingsBtn.textContent = 'Saved!';
		setTimeout(() => {
			saveSettingsBtn.textContent = originalText;
		}, 1500);

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
			if (apiKeyInput) apiKeyInput.value = data.settings.apiKey || '';

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
			/\[\s*(no|none|content here)\s*[^\]]*\]/i.test(next.textContent.trim())
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
			// console.log('Build number not available:', e);
		}
		footerElement.textContent = `Project Chimera v1.0.1.${buildNumber}`;
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
			// console.log('No API key found, redirecting to settings tab');
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

	itemElement.innerHTML =
		'<div class="history-item-header">' +
		'<h3 class="history-item-title">' + (item.metadata.title || 'Untitled Page') + '</h3>' +
		'<div class="history-item-actions">' +
		'<button class="history-copy-btn" title="Copy Summary">' +
		'<span class="icon">📋</span>' +
		'</button>' +
		'<button class="history-delete-btn" title="Delete Summary">' +
		'<span class="icon">🗑️</span>' +
		'</button>' +
		'</div>' +
		'</div>' +
		'<div class="history-item-meta">' +
		'<span class="history-item-date">' + formattedDate + '</span>' +
		'<span class="history-item-format">' + formatName + ', ' + lengthName + '</span>' +
		'</div>' +
		'<a href="' + item.metadata.url + '" class="history-item-url" title="' + item.metadata.url + '">' +
		item.metadata.url +
		'</a>' +
		'<div class="history-item-content hidden">' +
		formattedContent +
		'</div>';

	const copyBtn = itemElement.querySelector('.history-copy-btn');
	const deleteBtn = itemElement.querySelector('.history-delete-btn');
	const contentDiv = itemElement.querySelector('.history-item-content');
	const titleElement = itemElement.querySelector('.history-item-title');

	titleElement.addEventListener('click', () => {
		contentDiv.classList.toggle('hidden');
	});

	copyBtn.addEventListener('click', () => {
		const content = item.content;
		navigator.clipboard.writeText(content)
			.then(() => {
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
      <button class="primary-button confirm-btn">Confirm</button>
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

document.addEventListener('DOMContentLoaded', () => {
	initialize();
	updateFooterInfo();
	// Intercept clicks on .history-item-url links and open them in a new tab using chrome.tabs.create
	document.addEventListener('click', event => {
		const anchor = event.target.closest('a.history-item-url');
		if (anchor && anchor.href) {
			event.preventDefault();
			chrome.tabs.create({ url: anchor.href });
		}
	});
});
