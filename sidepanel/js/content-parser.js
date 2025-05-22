/**
 * Content Parser - Extracts sections from a summary and injects them into appropriate containers
 */

/**
 * Parse and distribute content from a summary into appropriate containers
 * @param {string} summaryContent - The full content including summary and analysis
 */
function parseAndDistributeContent(summaryContent) {
	if (!summaryContent) {
		console.warn('No content provided to parse');
		return;
	}

	console.log('Parsing content for distribution');

	// Define the containers and their corresponding section headers
	const sections = {
		'summary-text': 'Page Summary',
		'tone-bias': 'Tone and Bias Analysis',
		'highlight-vague-claims': 'Unsubstantiated or Vague Claims',
		'counterpoints': 'Alternative Perspectives or Counterpoints',
		'sentiment-detection': 'Sentiment Detection',
		'intent-summary': 'Intent Summary',
		'fact-contrast': 'Fact Contrast'
	};

	// Split content by h3 headers (### in markdown)
	const regex = /(?:^|\n)###\s+(.*?)(?=\n###|\n?$)([\s\S]*?)(?=\n###|\n?$)/g;
	const matches = {};
	let match;

	// Extract matches
	while ((match = regex.exec(summaryContent)) !== null) {
		const header = match[1].trim();
		let content = match[2].trim();

		// Store the header with its content
		matches[header] = content;
		console.log(`Found section: ${header}`);
	}

	// Function to convert markdown to HTML
	function markdownToHtml(markdown) {
		// Basic markdown conversion - can be expanded as needed
		return markdown
			// Convert headers
			.replace(/^#{1,6}\s+(.*?)$/gm, (match, p1, offset, string) => {
				const level = match.indexOf(' ');
				return `<h${level}>${p1}</h${level}>`;
			})
			// Convert bold
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			// Convert italics
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			// Convert bullet points
			.replace(/^- (.*?)$/gm, '<li>$1</li>')
			.replace(/<li>.*?<\/li>(\n<li>.*?<\/li>)+/g, match => `<ul>${match}</ul>`)
			// Convert paragraphs
			.replace(/^\s*(.*?)\s*$/gm, (match, p1) => {
				if (p1 && !p1.startsWith('<h') && !p1.startsWith('<ul') && !p1.startsWith('<li') && !p1.startsWith('<p')) {
					return `<p>${p1}</p>`;
				}
				return match;
			});
	}

	// Process each section and inject content
	Object.entries(sections).forEach(([containerId, headerText]) => {
		const container = document.getElementById(containerId);

		if (!container) {
			console.error(`Container #${containerId} not found`);
			return;
		}

		// Clear the container
		container.innerHTML = '';

		// If we have content for this section, add it
		if (matches[headerText]) {
			const content = matches[headerText];
			const htmlContent = markdownToHtml(content);

			// Add the header and content
			const headerElement = document.createElement('h3');
			headerElement.textContent = headerText;

			container.appendChild(headerElement);

			// Add the content div
			const contentDiv = document.createElement('div');
			contentDiv.className = 'section-content';
			contentDiv.innerHTML = htmlContent;
			container.appendChild(contentDiv);

			console.log(`Injected content into #${containerId}`);
		} else {
			console.log(`No content found for ${headerText}`);
		}
	});
}

/**
 * Initialize the content parser
 */
function initContentParser() {
	console.log('Content parser initialized');
	// This function would be called once the DOM is loaded
	// It can set up any listeners or handle initial content processing
}

// Export functions for use in other modules
if (typeof module !== 'undefined') {
	module.exports = {
		parseAndDistributeContent,
		initContentParser
	};
}
