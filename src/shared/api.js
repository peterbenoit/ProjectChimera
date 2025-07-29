/**
 * API Client for Smart Digest
 * Handles communication with OpenAI API
 */

/**
 * Generate a summary using OpenAI's API with timeout handling and user feedback
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
 * @param {Function} onTimeout - Optional callback for timeout handling
 * @returns {Promise<string>} - The generated summary
 */
export async function generateSummary(content, options, apiKey, onTimeout = null) {
	return generateSummaryWithTimeout(content, options, apiKey, 30000, onTimeout);
}

/**
 * Generate a summary with configurable timeout and retry handling
 *
 * @param {string} content - The text content to summarize
 * @param {object} options - Summarization options
 * @param {string} apiKey - The OpenAI API key
 * @param {number} timeoutMs - Timeout in milliseconds (default: 10000)
 * @param {Function} onTimeout - Optional callback for timeout handling
 * @returns {Promise<string>} - The generated summary
 */
export async function generateSummaryWithTimeout(content, options, apiKey, timeoutMs = 10000, onTimeout = null) {
	try {
		// console.log('API Client: Generating summary with options:', options);

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

		// Create AbortController for request cancellation
		const abortController = new AbortController();

		// Create the fetch promise
		const fetchPromise = fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: 'gpt-4o',
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
			}),
			signal: abortController.signal
		});

		// Handle timeout with user interaction
		let response;
		const timeoutHandler = setTimeout(async () => {
			if (onTimeout) {
				try {
					const shouldContinue = await onTimeout();
					if (!shouldContinue) {
						abortController.abort();
					}
					// If user chooses to continue, just let the fetch continue
				} catch (callbackError) {
					console.error('Error in timeout callback:', callbackError);
					abortController.abort();
				}
			} else {
				// No timeout callback provided, just abort
				abortController.abort();
			}
		}, timeoutMs);

		try {
			response = await fetchPromise;
			clearTimeout(timeoutHandler);
		} catch (error) {
			clearTimeout(timeoutHandler);
			if (error.name === 'AbortError') {
				throw new Error('Request was cancelled');
			}
			throw error;
		}

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			console.error('API error response:', errorData);

			// Provide more specific error messages
			if (response.status === 401) {
				throw new Error('Invalid API key. Please check your OpenAI API key in settings.');
			} else if (response.status === 429) {
				throw new Error('Rate limit exceeded. Please try again in a few moments.');
			} else if (response.status >= 500) {
				throw new Error('OpenAI service is currently unavailable. Please try again later.');
			} else {
				throw new Error(`API request failed: ${response.status} ${response.statusText}`);
			}
		}

		const data = await response.json();
		return data.choices[0].message.content;

	} catch (error) {
		console.error('Error generating summary:', error);

		// Enhance error messages for better user experience
		if (error.name === 'AbortError') {
			throw new Error('Request was cancelled');
		} else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
			throw new Error('Network error. Please check your internet connection and try again.');
		}

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

	// Add content type detection and specialized formatting
	prompt += `First, analyze the content to determine if it's a specific type of content (food blog, recipe, cooking article, etc.). `;

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

	// Add specialized content type instructions
	prompt += getContentTypeInstructions();

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

/**
 * Generate content-type specific instructions
 *
 * @returns {string} - Content type specific instructions
 */
function getContentTypeInstructions() {
	return `

CONTENT TYPE DETECTION AND SPECIALIZED FORMATTING:

If the content appears to be a FOOD BLOG, RECIPE, or COOKING-related article (contains ingredients, cooking methods, food preparation, etc.), then:
1. After your main summary, include a "RECIPE DETAILS" section with:
   - ### Ingredients List
     List all ingredients mentioned with quantities if available
   - ### Cooking Instructions
     Provide step-by-step cooking/baking instructions in numbered format
   - ### Additional Notes
     Include cooking tips, variations, or storage information if mentioned

For food content, prioritize extracting:
- Complete ingredient lists with measurements
- Clear step-by-step cooking instructions
- Cooking times and temperatures
- Serving sizes and prep time
- Any special techniques or tips mentioned

If the content appears to be a HOME IMPROVEMENT, DIY, or CONSTRUCTION-related article (contains building, decorating, repairs, plumbing, electrical, carpentry, etc.), then:
1. After your main summary, include a "PROJECT DETAILS" section with:
   - ### Materials and Tools Needed
     List all materials, tools, and supplies mentioned with quantities/specifications if available
   - ### Step-by-Step Instructions
     Provide detailed project instructions in numbered format
   - ### Safety Considerations
     Include any safety warnings, precautions, or protective equipment mentioned
   - ### Additional Tips
     Include expert tips, common mistakes to avoid, or variations if mentioned

For home improvement content, prioritize extracting:
- Complete materials and tools lists with specifications
- Clear step-by-step project instructions
- Time estimates and difficulty levels
- Safety warnings and precautions
- Cost estimates if mentioned
- Special techniques or professional tips

If the content is NOT food-related or home improvement-related, proceed with the standard summary format without specialized sections.

`;
}

/**
 * Get word definition using Free Dictionary API
 *
 * @param {string} word - The word to look up
 * @returns {Promise<object>} - The word definition data
 */
export async function getWordDefinition(word) {
	try {
		// Clean the word - remove punctuation and convert to lowercase
		let cleanWord = word.trim().toLowerCase().replace(/[^\w]/g, '');

		// Handle possessive forms (remove 's)
		if (cleanWord.endsWith('s') && word.includes("'")) {
			cleanWord = cleanWord.slice(0, -1);
		}

		if (!cleanWord || cleanWord.length < 2) {
			throw new Error('Invalid word');
		}

		const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);

		if (!response.ok) {
			// Try without 's' if it's a plural or possessive
			if (cleanWord.endsWith('s') && cleanWord.length > 3) {
				const singularWord = cleanWord.slice(0, -1);
				const singularResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${singularWord}`);
				if (singularResponse.ok) {
					const singularData = await singularResponse.json();
					return singularData[0];
				}
			}
			throw new Error('Word not found in dictionary');
		}

		const data = await response.json();
		return data[0]; // Return first result

	} catch (error) {
		// Don't log errors to console for unknown words - it's expected
		throw error;
	}
}
