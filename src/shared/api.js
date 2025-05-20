/**
 * API Client for Project Chimera
 * Handles communication with OpenAI API
 */

/**
 * Generate a summary using OpenAI's API
 *
 * @param {string} content - The text content to summarize
 * @param {object} options - Summarization options
 * @param {string} options.format - The summary format (bullets, academic, professional, simplified)
 * @param {string} options.length - The summary length (brief, detailed)
 * @param {object} options.feedback - AI feedback options
 * @param {boolean} options.feedback.enableToneBiasAnalysis - Whether to include tone and bias analysis
 * @param {boolean} options.feedback.enableHighlightVagueClaims - Whether to highlight vague claims
 * @param {boolean} options.feedback.enableCounterpoints - Whether to present counterpoints
 * @param {boolean} options.feedback.enableSentimentDetection - Whether to detect sentiment
 * @param {boolean} options.feedback.enableIntentSummary - Whether to summarize intent
 * @param {boolean} options.feedback.enableFactContrast - Whether to contrast with known facts
 * @param {string} apiKey - The OpenAI API key
 * @returns {Promise<string>} - The generated summary
 */
export async function generateSummary(content, options, apiKey) {
	try {
		console.log('API Client: Generating summary with options:', options);

		if (!apiKey) {
			throw new Error('API key is required');
		}

		// Limit content length to prevent excessive token usage
		const maxContentLength = 15000;
		const truncatedContent = content.length > maxContentLength
			? content.substring(0, maxContentLength) + "...(content truncated for token efficiency)"
			: content;

		// Generate system prompt based on options
		const systemPrompt = getSystemPrompt(options);

		// Make the actual fetch request to OpenAI API
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content: systemPrompt
					},
					{
						role: 'user',
						content: truncatedContent
					}
				],
				temperature: 0.5 // Lower temperature for more consistent summaries
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			console.error('API error response:', errorData);
			throw new Error(`API request failed: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data.choices[0].message.content;

	} catch (error) {
		console.error('Error generating summary:', error);
		throw error;
	}
}

/**
 * Generate system prompt based on format and length options
 *
 * @param {object} options - The summary options
 * @returns {string} - The system prompt
 */
function getSystemPrompt(options) {
	const { format, length, feedback = {} } = options;

	// Base instructions
	let prompt = `You are an AI assistant specialized in summarizing content. `;

	// Length-specific instructions
	if (length === 'brief') {
		prompt += `Create a concise summary that captures the main points in about 3-5 short paragraphs. `;
	} else if (length === 'detailed') {
		prompt += `Create a comprehensive summary that covers all significant points and details in about 5-7 paragraphs. `;
	}

	prompt += `Do not include any personal opinions or subjective statements. Focus solely on the content provided. `;

	// Format-specific instructions
	if (format === 'bullets') {
		prompt += `Format your response as a bulleted list of key points, with a very brief introduction. Use • as bullet points. Be direct and clear. `;
	} else if (format === 'academic') {
		prompt += `Format your response in an academic style with formal language, clear structure, and objective analysis. Include an introduction, body paragraphs, and conclusion. `;
	} else if (format === 'professional') {
		prompt += `Format your response as a professional executive summary with clear sections, factual statements, and actionable insights. Keep the tone neutral and the language precise. `;
	} else if (format === 'simplified') {
		prompt += `Format your response in simple, easy-to-understand language. Avoid complex terminology, use shorter sentences, and explain concepts clearly as if to someone with limited background knowledge. `;
	}

	// AI Feedback & Impressions options
	const feedbackRequested = Object.values(feedback).some(value => value === true);

	if (feedbackRequested) {
		prompt += `\n\nAfter providing the summary, please include an "ADDITIONAL ANALYSIS" section with the following components:\n`;

		if (feedback.enableToneBiasAnalysis) {
			prompt += `\n<h3>Tone and Bias Analysis</h3>\n<div class="analysis-section">Analyze the tone of the content (formal, casual, persuasive, informative, etc.) and identify any potential biases or slants in the presentation. Consider word choice, framing, and what information is emphasized or omitted. Format this as 2-3 paragraphs.</div>\n`;
		}

		if (feedback.enableHighlightVagueClaims) {
			prompt += `\n<h3>Unsubstantiated or Vague Claims</h3>\n<div class="analysis-section">Identify any claims that lack sufficient evidence, are overgeneralized, or use vague language. List them as bullet points with brief explanations of why each claim is problematic. Use <span class="vague-claim">highlighted text</span> for the actual claims.</div>\n`;
		}

		if (feedback.enableCounterpoints) {
			prompt += `\n<h3>Alternative Perspectives</h3>\n<div class="analysis-section">Present reasonable counterpoints or alternative viewpoints that might not be adequately addressed in the content. Format this as 3-4 bullet points.</div>\n`;
		}

		if (feedback.enableSentimentDetection) {
			prompt += `\n<h3>Entity Sentiment Analysis</h3>\n<div class="analysis-section">Identify key entities (people, organizations, concepts) mentioned in the content and analyze the sentiment expressed toward each. Format as a brief list with <span class="entity-positive">positive</span>, <span class="entity-neutral">neutral</span>, or <span class="entity-negative">negative</span> indicators for each entity.</div>\n`;
		}

		if (feedback.enableIntentSummary) {
			prompt += `\n<h3>Content Intent Analysis</h3>\n<div class="analysis-section">Briefly analyze the likely intent or purpose of the content (to inform, persuade, entertain, sell, etc.) and the underlying message. One paragraph maximum.</div>\n`;
		}

		if (feedback.enableFactContrast) {
			prompt += `\n<h3>Fact Checking Notes</h3>\n<div class="analysis-section">Identify statements that could benefit from fact-checking or additional context, and note any commonly accepted facts that might contradict claims in the content. Format as bullet points.</div>\n`;
		}
	}

	// Feedback options
	if (feedback) {
		if (feedback.enableToneBiasAnalysis) {
			prompt += `Analyze the tone and potential bias in the content. `;
		}
		if (feedback.enableHighlightVagueClaims) {
			prompt += `Highlight any vague or ambiguous claims. `;
		}
		if (feedback.enableCounterpoints) {
			prompt += `Present potential counterpoints to the claims made. `;
		}
		if (feedback.enableSentimentDetection) {
			prompt += `Detect and summarize the sentiment expressed in the content. `;
		}
		if (feedback.enableIntentSummary) {
			prompt += `Summarize the intent behind the content. `;
		}
		if (feedback.enableFactContrast) {
			prompt += `Contrast the content with known facts or common knowledge. `;
		}
	}

	prompt += `Do not use any markdown, only HTML formatting if required. `;
	prompt += `<b> for bold text, <i> for italic text, <u> for underlined text, <p> for paragraphs, <br> for line breaks, <h3> for section headings. `;
	prompt += `Avoid using any other HTML tags, this is a partial HTML document.`;

	return prompt;
}
