Prompt:

EVALUATE THE WORK THAT HAS BEEN DONE BEFORE PROCEEDING.

You are processing a summary that includes a “Page Summary” followed by an “ADDITIONAL ANALYSIS” section. Your goal is to: 1. Extract each analysis section based strictly on <h3> headers (e.g., Tone and Bias Analysis, Unsubstantiated or Vague Claims, etc.). 2. Do not include these <h3> headers in the output string, but retain them inside the individual target container elements. 3. Inject each analysis section into its corresponding container:
• Tone and Bias Analysis → #tone-bias
• Unsubstantiated or Vague Claims → #highlight-vague-claims
• Alternative Perspectives or Counterpoints → #counterpoints
• Sentiment Detection → #sentiment-detection
• Intent Summary → #intent-summary
• Fact Contrast → #fact-contrast 4. Ensure that markdown is fully converted to HTML before injection, and that the summary-text section excludes all analysis content. 5. Use this pattern:
• Summary → #summary-text
• Analysis sections → respective container without cross-contamination
• Do not insert raw text or mixed markdown into any div 6. If no valid content exists for a section, leave the container empty.
