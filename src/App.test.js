import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the external translation API for Jest environment
jest.mock('google-translate-api-browser', () => ({
  translate: jest.fn().mockResolvedValue({ text: 'Hola mundo' })
}), { virtual: true });

test('renders Swift Translate header', () => {
  render(<App />);
  const titleElements = screen.getAllByText(/Swift Translate/i);
  expect(titleElements.length).toBeGreaterThan(0);
});
