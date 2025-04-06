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

		// Generate system prompt based on format and length options
		const systemPrompt = getSystemPrompt(options.format, options.length);

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
 * @param {string} format - The summary format
 * @param {string} length - The summary length
 * @returns {string} - The system prompt
 */
function getSystemPrompt(format, length) {
	// Base instructions
	let prompt = `You are an AI assistant specialized in summarizing content. `;

	// Length-specific instructions
	if (length === 'brief') {
		prompt += `Create a concise summary that captures the main points in about 3-5 short paragraphs. `;
	} else if (length === 'detailed') {
		prompt += `Create a comprehensive summary that covers all significant points and details in about 5-7 paragraphs. `;
	}

	prompt += `Do not include any personal opinions or subjective statements. Focus solely on the content provided.`;

	// Format-specific instructions
	if (format === 'bullets') {
		prompt += `Format your response as a bulleted list of key points, with a very brief introduction. Use • as bullet points. Be direct and clear.`;
	} else if (format === 'academic') {
		prompt += `Format your response in an academic style with formal language, clear structure, and objective analysis. Include an introduction, body paragraphs, and conclusion.`;
	} else if (format === 'professional') {
		prompt += `Format your response as a professional executive summary with clear sections, factual statements, and actionable insights. Keep the tone neutral and the language precise.`;
	} else if (format === 'simplified') {
		prompt += `Format your response in simple, easy-to-understand language. Avoid complex terminology, use shorter sentences, and explain concepts clearly as if to someone with limited background knowledge.`;
	}

	prompt += `Do not use any markdown, only HTML formatting if required.`;
	prompt += `<b> for bold text, <i> for italic text, <u> for underlined text, <p> for paragraphs, <br> for line breaks.`;
	prompt += `Avoid using any other HTML tags, this is a partial HTML document.`;

	return prompt;
}
