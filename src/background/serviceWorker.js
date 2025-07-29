/**
 * Service Worker for Smart Digest
 * Handles SidePanel registration, context menu creation,
 * and message passing between components.
 */

// Register the side panel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Set up context menu for selecting text to summarize
chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		id: "summarizeSelection",
		title: "Summarize Selection",
		contexts: ["selection"]
	});
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === "summarizeSelection" && info.selectionText) {
		// Open the side panel
		chrome.sidePanel.open({ tabId: tab.id });

		// Send the selected text to the side panel
		// We'll use a setTimeout to ensure the panel is open before sending
		setTimeout(() => {
			chrome.runtime.sendMessage({
				action: "summarizeSelection",
				text: info.selectionText
			});
		}, 300);
	}
});

// Listen for messages from content script and side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	// Will handle different message types here as we develop
	console.log("Service worker received message:", message);

	// Make sure to return true if we're going to send a response asynchronously
	return true;
});
