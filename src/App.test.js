import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the external translation API and Gemini API for Jest environment
jest.mock('google-translate-api-browser', () => ({
  translate: jest.fn().mockResolvedValue({ text: 'Hola mundo' })
}), { virtual: true });

jest.mock('./services/geminiService', () => ({
  translateWithGemini: jest.fn().mockResolvedValue({ translatedText: 'Hola mundo', detectedLanguage: 'en' }),
  LANGUAGE_NAMES: {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ja: 'Japanese',
    'zh-CN': 'Chinese (Simplified)',
    ko: 'Korean',
    ru: 'Russian',
    ar: 'Arabic',
    hi: 'Hindi',
    nl: 'Dutch',
    tr: 'Turkish',
    vi: 'Vietnamese',
    auto: 'Auto Detect'
  }
}));


test('renders Swift Translate header', () => {
  render(<App />);
  const titleElements = screen.getAllByText(/Swift Translate/i);
  expect(titleElements.length).toBeGreaterThan(0);
});
