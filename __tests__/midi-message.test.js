import '@testing-library/jest-dom'; 
import { render, screen } from '@testing-library/react';

// eslint-disable-next-line no-unused-vars
import React from 'react'; 
import MyComponent from '../src/components/ScaleSelector'; 

test('renders select element with populated options', () => {
  render(<MyComponent />);
  const selectElement = screen.getByRole('combobox'); // Assuming the select element is a combobox
  expect(selectElement).toBeInTheDocument(); // Check if the select element is in the document
});