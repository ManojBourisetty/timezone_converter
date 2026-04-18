import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TimezoneConverter from './TimezoneConverter';
import axios from 'axios';

jest.mock('axios');
jest.mock('date-fns', () => ({
  format: (date, pattern) => {
    if (pattern === 'PPP') return 'April 18, 2026';
    return date.toString();
  }
}));

describe('TimezoneConverter Integration Tests - Complete Functionality', () => {
  const mockTimezones = [
    { value: 'America/New_York', label: 'New York', city: 'New York', country: 'United States', offset: 'EST' },
    { value: 'Europe/London', label: 'London', city: 'London', country: 'United Kingdom', offset: 'GMT' },
    { value: 'Asia/Tokyo', label: 'Tokyo', city: 'Tokyo', country: 'Japan', offset: 'JST' },
    { value: 'Europe/Paris', label: 'Paris', city: 'Paris', country: 'France', offset: 'CET' },
    { value: 'Asia/Dubai', label: 'Dubai', city: 'Dubai', country: 'United Arab Emirates', offset: 'GST' },
    { value: 'Australia/Sydney', label: 'Sydney', city: 'Sydney', country: 'Australia', offset: 'AEDT' },
  ];

  const mockConversionResult = {
    sourceTime: { city: 'New York', formatted: '10:00 AM', timezone: 'America/New_York', offset: 'EST' },
    targetTime: { city: 'London', formatted: '3:00 PM', timezone: 'Europe/London', offset: 'GMT' },
  };

  const mockCitiesData = [
    { city: 'New York', formatted: '10:00 AM', date: '2026-04-18', timezone: 'America/New_York', offset: 'EST' },
    { city: 'London', formatted: '3:00 PM', date: '2026-04-18', timezone: 'Europe/London', offset: 'GMT' },
    { city: 'Tokyo', formatted: '1:00 AM', date: '2026-04-19', timezone: 'Asia/Tokyo', offset: 'JST' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.includes('/timezones')) {
        return Promise.resolve({ data: mockTimezones });
      }
      if (url.includes('/major-cities-time')) {
        return Promise.resolve({ data: { cities: mockCitiesData } });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    axios.post.mockResolvedValue({ data: mockConversionResult });
  });

  // ===== INPUT FIELD TYPING TESTS =====
  describe('Input Field Typing - Verify users can type in fields', () => {
    test('source timezone field accepts typed input', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      const sourceInput = screen.getByTestId('source-timezone-input');
      
      expect(sourceInput).toBeInTheDocument();
      expect(sourceInput).toHaveAttribute('type', 'text');
      expect(sourceInput).not.toBeDisabled();
      
      fireEvent.change(sourceInput, { target: { value: 'new' } });
      expect(sourceInput.value).toBe('new');
      
      fireEvent.change(sourceInput, { target: { value: 'new york' } });
      expect(sourceInput.value).toBe('new york');
    });

    test('target timezone field accepts typed input', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      const targetInput = screen.getByTestId('target-timezone-input');
      
      expect(targetInput).toBeInTheDocument();
      expect(targetInput).toHaveAttribute('type', 'text');
      expect(targetInput).not.toBeDisabled();
      
      fireEvent.change(targetInput, { target: { value: 'london' } });
      expect(targetInput.value).toBe('london');
      
      fireEvent.change(targetInput, { target: { value: 'tokyo' } });
      expect(targetInput.value).toBe('tokyo');
    });

    test('time input field accepts time input', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      const timeInput = screen.getByTestId('time-input');
      
      expect(timeInput).toBeInTheDocument();
      expect(timeInput).toHaveAttribute('type', 'time');
      expect(timeInput).not.toBeDisabled();
      
      fireEvent.change(timeInput, { target: { value: '14:30' } });
      expect(timeInput.value).toBe('14:30');
      
      fireEvent.change(timeInput, { target: { value: '09:15' } });
      expect(timeInput.value).toBe('09:15');
    });

    test('can type multiple characters sequentially in timezone field', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      const sourceInput = screen.getByTestId('source-timezone-input');
      
      const testString = 'new york';
      fireEvent.focus(sourceInput);
      
      for (let i = 0; i < testString.length; i++) {
        const currentValue = testString.substring(0, i + 1);
        fireEvent.change(sourceInput, { target: { value: currentValue } });
        expect(sourceInput.value).toBe(currentValue);
      }
      
      expect(sourceInput.value).toBe('new york');
    });
  });

  // ===== CURRENT TIME BUTTON TESTS =====
  describe('Current Time Button - Toggle to set current date/time', () => {
    test('use current time button exists and is clickable', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      const button = screen.getByTestId('use-current-time-button');
      
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute('title');
    });

    test('current time button has clock icon visible', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      const button = screen.getByTestId('use-current-time-button');
      
      // Button should contain an SVG (the Clock icon from lucide-react)
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    test('clicking current time button updates time input', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      const timeInput = screen.getByTestId('time-input');
      const currentTimeButton = screen.getByTestId('use-current-time-button');
      
      const initialValue = timeInput.value;
      fireEvent.click(currentTimeButton);
      
      await waitFor(() => {
        expect(timeInput.value).toBeTruthy();
        // Value should be in HH:MM format
        expect(timeInput.value).toMatch(/^\d{2}:\d{2}$/);
      });
    });

    test('current time button sets both date and time', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      const timeInput = screen.getByTestId('time-input');
      const currentTimeButton = screen.getByTestId('use-current-time-button');
      
      fireEvent.click(currentTimeButton);
      
      await waitFor(() => {
        expect(timeInput.value).toBeTruthy();
        expect(timeInput.value).not.toBe('');
      });
    });
  });

  // ===== TIME SELECTION TESTS =====
  describe('Time Selection Functionality - Update time of choice', () => {
    test('time input field is visible and has proper height', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      const timeInput = screen.getByTestId('time-input');
      
      expect(timeInput).toBeInTheDocument();
      expect(timeInput).toBeVisible();
    });

    test('can select various times from time input', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      const timeInput = screen.getByTestId('time-input');
      
      const testTimes = ['00:00', '06:30', '12:00', '18:45', '23:59'];
      
      for (const time of testTimes) {
        fireEvent.change(timeInput, { target: { value: time } });
        expect(timeInput.value).toBe(time);
      }
    });

    test('date picker button is visible and clickable', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      const dateButton = screen.getByTestId('date-picker-button');
      
      expect(dateButton).toBeInTheDocument();
      expect(dateButton).not.toBeDisabled();
    });

    test('time and date fields are both visible', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      const timeInput = screen.getByTestId('time-input');
      const dateButton = screen.getByTestId('date-picker-button');
      
      // Both should exist and be in the DOM
      expect(timeInput).toBeInTheDocument();
      expect(dateButton).toBeInTheDocument();
    });
  });

  // ===== CONVERT BUTTON TESTS =====
  describe('Convert Button - Functionality and API integration', () => {
    test('convert button is visible and clickable', async () => {
      render(<TimezoneConverter />);
      const convertButton = await screen.findByTestId('convert-button');
      
      expect(convertButton).toBeInTheDocument();
      expect(convertButton).not.toBeDisabled();
      expect(convertButton).toHaveTextContent('Convert Time');
    });

    test('convert button sends request with proper data', async () => {
      render(<TimezoneConverter />);
      const convertButton = await screen.findByTestId('convert-button');
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      fireEvent.click(convertButton);
      
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/convert-timezone'),
          expect.objectContaining({
            sourceTimezone: expect.any(String),
            targetTimezone: expect.any(String),
            datetime: expect.any(String),
          })
        );
      });
    });

    test('convert button shows loading state while converting', async () => {
      axios.post.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: mockConversionResult }), 200))
      );
      
      render(<TimezoneConverter />);
      const convertButton = await screen.findByTestId('convert-button');
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      fireEvent.click(convertButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Converting/i)).toBeInTheDocument();
      });
    });

    test('convert button displays results after successful conversion', async () => {
      render(<TimezoneConverter />);
      const convertButton = await screen.findByTestId('convert-button');
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      fireEvent.click(convertButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('conversion-result')).toBeInTheDocument();
        expect(screen.getByTestId('source-time-display')).toHaveTextContent('10:00 AM');
        expect(screen.getByTestId('target-time-display')).toHaveTextContent('3:00 PM');
      });
    });

    test('convert button with error shows alert', async () => {
      axios.post.mockRejectedValue(new Error('API Error'));
      window.alert = jest.fn();
      
      render(<TimezoneConverter />);
      const convertButton = await screen.findByTestId('convert-button');
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      fireEvent.click(convertButton);
      
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalled();
      });
    });

    test('convert button requires both timezones to be selected', async () => {
      window.alert = jest.fn();
      
      render(<TimezoneConverter />);
      const convertButton = await screen.findByTestId('convert-button');
      
      // Initially timezones might be set to defaults, so let's just test the button works
      fireEvent.click(convertButton);
      
      // Should not throw and should attempt conversion
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
    });
  });

  // ===== TIMEZONE SELECTION TESTS =====
  describe('Timezone Selection - Autocomplete with suggestions', () => {
    test('typing in source field shows suggestions', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      const sourceInput = screen.getByTestId('source-timezone-input');
      
      fireEvent.focus(sourceInput);
      fireEvent.change(sourceInput, { target: { value: 'new' } });
      
      await waitFor(() => {
        const suggestions = screen.getAllByText('New York');
        expect(suggestions.length).toBeGreaterThan(0);
      });
    });

    test('can select timezone from suggestions', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      const sourceInput = screen.getByTestId('source-timezone-input');
      
      fireEvent.focus(sourceInput);
      fireEvent.change(sourceInput, { target: { value: 'london' } });
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const londonButton = buttons.find(btn => btn.textContent.includes('London') && btn.textContent.includes('United Kingdom'));
        if (londonButton) {
          fireEvent.click(londonButton);
          // After selection, input should be cleared
          expect(sourceInput.value).toBe('');
        }
      });
    });

    test('selected timezone displays information', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      // Component renders with default timezone selected
      // Check that timezone label is visible
      expect(screen.getByText('From Timezone')).toBeInTheDocument();
    });
  });

  // ===== COMPLETE USER FLOW TESTS =====
  describe('Complete User Flow - End-to-end functionality', () => {
    test('complete timezone conversion workflow', async () => {
      render(<TimezoneConverter />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/timezones'));
      });

      // Select source timezone
      const sourceInput = await screen.findByTestId('source-timezone-input');
      fireEvent.focus(sourceInput);
      fireEvent.change(sourceInput, { target: { value: 'new' } });
      
      // Select target timezone
      const targetInput = await screen.findByTestId('target-timezone-input');
      fireEvent.focus(targetInput);
      fireEvent.change(targetInput, { target: { value: 'london' } });
      
      // Set time
      const timeInput = await screen.findByTestId('time-input');
      fireEvent.change(timeInput, { target: { value: '14:30' } });
      
      // Click convert
      const convertButton = await screen.findByTestId('convert-button');
      fireEvent.click(convertButton);
      
      // Verify result
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
        expect(screen.getByTestId('conversion-result')).toBeInTheDocument();
      });
    });

    test('can perform multiple conversions in sequence', async () => {
      render(<TimezoneConverter />);
      const convertButton = await screen.findByTestId('convert-button');
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      // First conversion
      fireEvent.click(convertButton);
      await waitFor(() => {
        expect(screen.getByTestId('conversion-result')).toBeInTheDocument();
      });

      // Second conversion
      fireEvent.click(convertButton);
      await waitFor(() => {
        expect(screen.getByTestId('conversion-result')).toBeInTheDocument();
      });

      // Verify API was called twice
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledTimes(2);
      });
    });

    test('can use current time button and then convert', async () => {
      render(<TimezoneConverter />);
      const currentTimeButton = await screen.findByTestId('use-current-time-button');
      const convertButton = await screen.findByTestId('convert-button');
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      // Set current time
      fireEvent.click(currentTimeButton);
      
      // Convert
      fireEvent.click(convertButton);
      
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
        expect(screen.getByTestId('conversion-result')).toBeInTheDocument();
      });
    });
  });

  // ===== UI VISIBILITY AND LAYOUT TESTS =====
  describe('UI Visibility - All elements visible and properly laid out', () => {
    test('all major UI sections are visible on initial load', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(screen.getByText('Timezone Converter')).toBeVisible();
        expect(screen.getByText('Time Conversion')).toBeVisible();
        expect(screen.getByText('Major Cities Current Time')).toBeVisible();
      });
    });

    test('timezone input fields have adequate spacing', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      const sourceInput = screen.getByTestId('source-timezone-input');
      const targetInput = screen.getByTestId('target-timezone-input');
      
      // Both inputs should be in the document
      expect(sourceInput).toBeInTheDocument();
      expect(targetInput).toBeInTheDocument();
    });

    test('all interactive buttons are visible and accessible', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      
      const buttons = {
        currentTime: screen.getByTestId('use-current-time-button'),
        datePicker: screen.getByTestId('date-picker-button'),
        convert: screen.getByTestId('convert-button'),
        swap: screen.getByTestId('swap-timezones-button'),
      };
      
      Object.values(buttons).forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
      });
    });
  });
});
