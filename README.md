# Swift Translate

A responsive web translation app built with React and Vite. It supports instant text translation across multiple languages, voice input (speech-to-text), text-to-speech audio pronunciation, and a local history of saved translations.

## Features

- **Instant Translation**: Fast translation using Google Translate with fallback to MyMemory.
- **Optional Gemini Translation**: Option to plug in your own Gemini API key for translations.
- **Voice Input & Pronunciation**: Dictate text using speech recognition and listen to translated text with adjustable playback speed.
- **Language Detection & Swap**: Auto-detects input language with one-click language swapping.
- **History & Pinned Phrases**: Saves recent translations locally so you can review or pin favorite phrases.
- **Dark & Light Mode**: Clean interface with support for dark and light themes.
- **Mobile Responsive**: Works on desktop, tablets, and phones.

## Tech Stack

- **Framework**: React 19
- **Bundler**: Vite
- **Styling**: Vanilla CSS
- **APIs**: Web Speech API (`SpeechRecognition` & `SpeechSynthesisUtterance`), LocalStorage

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/N0Algorithm/Swift-Translate.git
   cd Swift-Translate
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   or:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

   You can preview the production build with:
   ```bash
   npm run preview
   ```

## Configuration

By default, translations run through client-side translation APIs without requiring any setup. If you prefer to use Gemini, click the Settings icon in the top navigation bar and enter your Gemini API key (saved locally in your browser), or define `VITE_GEMINI_API_KEY` in a `.env.local` file:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
