/**
 * Storage Manager for Project Chimera
 * Handles persistent storage operations
 */

/**
 * Save a summary to history
 *
 * @param {Object} summaryData - The summary data to save
 * @param {string} summaryData.content - The summary text content
 * @param {Object} summaryData.metadata - Metadata about the summary
 * @param {string} summaryData.metadata.title - Page title
 * @param {string} summaryData.metadata.url - Page URL
 * @param {string} summaryData.metadata.timestamp - When the summary was created
 * @param {Object} summaryData.options - Summary generation options
 * @returns {Promise<void>}
 */
export async function saveSummaryToHistory(summaryData) {
	try {
		// Get existing history
		const data = await chrome.storage.local.get(['summaryHistory']);
		const history = data.summaryHistory || [];

		// Add new summary to the beginning of the array (newest first)
		history.unshift(summaryData);

		// Limit history to 50 items to prevent excessive storage usage
		const limitedHistory = history.slice(0, 50);

		// Save back to storage
		await chrome.storage.local.set({ summaryHistory: limitedHistory });

		return true;
	} catch (error) {
		console.error('Error saving summary to history:', error);
		return false;
	}
}

/**
 * Get all summary history
 *
 * @returns {Promise<Array>} Array of summary history items
 */
export async function getSummaryHistory() {
	try {
		const data = await chrome.storage.local.get(['summaryHistory']);
		return data.summaryHistory || [];
	} catch (error) {
		console.error('Error getting summary history:', error);
		return [];
	}
}

/**
 * Delete a summary from history by index
 *
 * @param {number} index - The index of the summary to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteSummaryFromHistory(index) {
	try {
		const data = await chrome.storage.local.get(['summaryHistory']);
		const history = data.summaryHistory || [];

		if (index >= 0 && index < history.length) {
			history.splice(index, 1);
			await chrome.storage.local.set({ summaryHistory: history });
			return true;
		}
		return false;
	} catch (error) {
		console.error('Error deleting summary from history:', error);
		return false;
	}
}

/**
 * Clear all summary history
 *
 * @returns {Promise<boolean>} Success status
 */
export async function clearSummaryHistory() {
	try {
		await chrome.storage.local.set({ summaryHistory: [] });
		return true;
	} catch (error) {
		console.error('Error clearing summary history:', error);
		return false;
	}
}
