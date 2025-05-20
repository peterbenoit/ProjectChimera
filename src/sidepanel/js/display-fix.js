/**
 * This fix needs to be applied to main.js
 * Please copy the function below into main.js, replacing the existing displaySummary function.
 * This will fix the "Cannot read properties of undefined" error.
 */

/**
 * Display a summary in the UI
 * @param {string} summary - The summary text to display
 */
function displaySummary(summary) {
	let formattedSummary = summary;

	if (summary.includes('ADDITIONAL ANALYSIS')) {
		formattedSummary = summary.replace(
			'ADDITIONAL ANALYSIS',
			'<div class="analysis-header">ADDITIONAL ANALYSIS</div>'
		);

		if (formattedSummary.includes('<h3>')) {
			const sections = formattedSummary.split('<h3>');
			for (let i = 1; i < sections.length; i++) {
				let section = sections[i];

				section = section.replace(
					/(?:(?:\r\n|\r|\n)(?:\s*[•\-\*]\s+)(.+))+/g,
					function (match) {
						const items = match.split(/\r\n|\r|\n/)
							.filter(line => line.trim().match(/^\s*[•\-\*]/))
							.map(line => line.replace(/^\s*[•\-\*]\s+/, ''))
							.map(line => `<li>${line}</li>`)
							.join('');
						return `<ul>${items}</ul>`;
					}
				);

				sections[i] = section;
			}
			formattedSummary = sections[0] + sections.slice(1).map(s => `<h3>${s}`).join('');
		}
	}

	// Set the HTML content first
	if (summaryText) {
		summaryText.innerHTML = formattedSummary;
	}

	// Show the container and hide loading
	if (summaryContent) {
		summaryContent.classList.remove('hidden');
	}

	if (loadingIndicator) {
		loadingIndicator.classList.add('hidden');
	}
}
