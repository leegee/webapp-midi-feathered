import { render, screen } from '@testing-library/react';
import { test, expect } from '@jest/globals';
import MyComponent from '../src/components/ScaleSelector';

test('renders component with correct text', () => {
  render(<MyComponent />);
  const linkElement = screen.getByText(/hello world/i);
  expect(linkElement).toBeInTheDocument();
});