# Smart Digest - AI Page Summarizer

A Chrome extension that uses AI to summarize web pages directly from the
browser's side panel, using your own OpenAI API key for cost-effective,
pay-per-use summaries without monthly subscription fees.

[Privacy Policy](PRIVACY.md)

## Features

- **Quick Summarization**: Summarize any web page with a single click
- **Multiple Formats**: Choose between bullet points, academic, professional,
  and simplified formats
- **Length Options**: Select brief or detailed summaries to fit your needs
- **Advanced Analysis**: Optional insights including:
  - Tone and bias analysis
  - Identification of vague or unsubstantiated claims
  - Alternative perspectives and counterpoints
  - Sentiment detection
  - Intent analysis
  - Fact comparison
- **Specialized Content Detection**: Automatic formatting for:
  - Food blogs and recipes (ingredient lists, cooking instructions)
  - Home improvement and DIY projects (materials, tools, safety tips)

- **Word Definition Lookup**: Highlight any single word to see its dictionary
  definition in a tooltip
- **History Management**: Save and revisit previous summaries
- **Text-to-Speech**: Listen to summaries read aloud
- **Context Menu Integration**: Summarize selected text on any page
- **Dark Mode Support**: Choose between light, dark, or system theme

## Installation

### From Chrome Web Store (Coming Soon)

1. Visit the Chrome Web Store
2. Search for "Smart Digest - AI Page Summarizer"
3. Click "Add to Chrome"

### Manual Installation (Developer Mode)

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `dist` folder from the project directory

## Setup

1. After installation, click the extension icon to open the side panel
2. Go to the Settings tab
3. Enter your OpenAI API key (requires a valid API key from
   [OpenAI](https://platform.openai.com/))
4. Configure additional preferences as desired

## Usage

### Basic Summarization

1. Navigate to any web page you want to summarize
2. Click the extension icon or press `Alt+S` to open the side panel
3. Select your preferred format and length
4. Click "Summarize Page"

### Selected Text Summarization

1. Select text on any web page
2. Right-click and choose "Summarize Selection"
3. View the summary in the side panel

### Word Definition Lookup

1. Highlight any single word on a web page
2. A tooltip will appear with the word's definition, pronunciation, and example
   usage
3. The tooltip will automatically disappear after 5 seconds or when you click
   elsewhere

## API Key Security

Your OpenAI API key is stored locally in your browser and is only used to
communicate with the OpenAI API. It is never sent to any other servers or
services. Please manage your API key responsibly and refer to OpenAI's
documentation for best practices regarding API key security.

## Development

### Requirements

- Node.js (v14 or higher)
- npm

### Setup Development Environment

```bash
# Install dependencies
npm install

# Start development build with watch mode
npm run dev

# Build for production
npm run build
```

### License

This project is licensed under the MIT License - see the LICENSE file for
details.

### Acknowledgments

- Built with Marked for Markdown rendering
- Uses OpenAI API for summarization
- Uses the free [Dictionary API](https://dictionaryapi.dev/) for definitions

### Privacy

This extension processes web page content through the OpenAI API using your
personal API key. No data is stored on our servers. Please review our full
[Privacy Policy](PRIVACY.md) for more details and refer to OpenAI's privacy
policy for information about how they handle data sent to their API.
