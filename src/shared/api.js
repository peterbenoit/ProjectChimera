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
		prompt += `Format your response as a bulleted list of key points, with a very brief introduction. Use - as bullet points. Be direct and clear. `;
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
		prompt += `\n\nAfter providing the summary, include an "ADDITIONAL ANALYSIS" section using only the following plain-text headers and format:\n\n`;

		if (feedback.enableToneBiasAnalysis) {
			prompt += `### Tone and Bias Analysis\nProvide 1–2 paragraphs analyzing the tone (e.g. neutral, persuasive) and any evident bias.\n\n`;
		}
		if (feedback.enableHighlightVagueClaims) {
			prompt += `### Unsubstantiated or Vague Claims\nIdentify up to 3 vague or unsubstantiated claims. For each, provide:\n1. The quote\n2. Type of issue\n3. Confidence level\n4. Explanation\n5. Suggested improvement\n\n`;
		}
		if (feedback.enableCounterpoints) {
			prompt += `### Counterpoints\nList 2–3 alternate viewpoints not considered in the original content.\n\n`;
		}
		if (feedback.enableSentimentDetection) {
			prompt += `### Sentiment Detection\nList any people or entities mentioned and the sentiment expressed toward them.\n\n`;
		}
		if (feedback.enableIntentSummary) {
			prompt += `### Intent Summary\nBriefly summarize the likely intent of the page (e.g. to inform, persuade).\n\n`;
		}
		if (feedback.enableFactContrast) {
			prompt += `### Fact Contrast\nHighlight claims that may contradict known facts or require additional verification.\n\n`;
		}

		prompt += `Use only these headers exactly as shown, no markdown, no HTML, and no combining sections. Output must remain strictly separated.\n`;
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

	prompt += `Wrap each analysis section in plain text using this format. Only include sections requested in the feedback options:\n\n`;

	if (feedback.enableToneBiasAnalysis) {
		prompt += `### Tone and Bias Analysis\n(Include 1–2 paragraphs of tone and bias evaluation)\n\n`;
	}
	if (feedback.enableHighlightVagueClaims) {
		prompt += `### Unsubstantiated or Vague Claims\n(Identify up to 3 vague claims. Include quote, type, confidence, explanation, improvement for each.)\n\n`;
	}
	if (feedback.enableCounterpoints) {
		prompt += `### Counterpoints\n(If applicable, list 2–3 alternative perspectives. If no counterpoints exist, omit this section entirely.)\n\n`;
	}
	if (feedback.enableSentimentDetection) {
		prompt += `### Sentiment Detection\n(List mentioned entities and note sentiment expressed toward each. If no sentiment is expressed, omit this section.)\n\n`;
	}
	if (feedback.enableIntentSummary) {
		prompt += `### Intent Summary\n(1–2 sentences summarizing the content's intent. If unclear, omit.)\n\n`;
	}
	if (feedback.enableFactContrast) {
		prompt += `### Fact Contrast\n(List claims that could conflict with common knowledge or known facts. If none found, omit section.)\n\n`;
	}

	prompt += `Use only these headers exactly as shown. Do not include headers for sections not selected. Do not include placeholder text or brackets like [Content here]. Do not include HTML or markdown formatting beyond the headers.`;

	return prompt;
}
