import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Budget Buddy login branding', () => {
  window.history.pushState({}, '', '/login');
  render(<App />);
  expect(screen.getByAltText('Budget Buddy')).toBeTruthy();
});
