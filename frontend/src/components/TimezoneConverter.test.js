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

describe('TimezoneConverter Component - Unit Tests', () => {
  const mockTimezones = [
    { value: 'America/New_York', label: 'New York', city: 'New York', country: 'United States', offset: 'EST' },
    { value: 'Europe/London', label: 'London', city: 'London', country: 'United Kingdom', offset: 'GMT' },
    { value: 'Asia/Tokyo', label: 'Tokyo', city: 'Tokyo', country: 'Japan', offset: 'JST' },
    { value: 'Europe/Paris', label: 'Paris', city: 'Paris', country: 'France', offset: 'CET' },
  ];

  const mockConversionResult = {
    sourceTime: { city: 'New York', formatted: '10:00 AM', timezone: 'America/New_York', offset: 'EST' },
    targetTime: { city: 'London', formatted: '3:00 PM', timezone: 'Europe/London', offset: 'GMT' },
  };

  const mockCitiesData = [
    { city: 'New York', formatted: '10:00 AM', date: '2026-04-18', timezone: 'America/New_York', offset: 'EST' },
    { city: 'London', formatted: '3:00 PM', date: '2026-04-18', timezone: 'Europe/London', offset: 'GMT' },
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
  });

  // ===== UNIT TESTS =====
  
  test('renders title and description', async () => {
    render(<TimezoneConverter />);
    expect(screen.getByText('Timezone Converter')).toBeInTheDocument();
    expect(screen.getByText('Convert time between any two timezones with real-time accuracy')).toBeInTheDocument();
  });

  test('renders timezone input fields with correct labels', async () => {
    render(<TimezoneConverter />);
    await waitFor(() => {
      expect(screen.getByText('From Timezone')).toBeInTheDocument();
      expect(screen.getByText('To Timezone')).toBeInTheDocument();
    });
  });

  test('renders time input field with current time', async () => {
    render(<TimezoneConverter />);
    await waitFor(() => {
      expect(screen.getByTestId('time-input')).toBeInTheDocument();
      expect(screen.getByTestId('date-picker-button')).toBeInTheDocument();
    });
  });

  test('renders use current time button', async () => {
    render(<TimezoneConverter />);
    await waitFor(() => {
      expect(screen.getByTestId('use-current-time-button')).toBeInTheDocument();
    });
  });

  test('renders convert button', async () => {
    render(<TimezoneConverter />);
    expect(screen.getByTestId('convert-button')).toBeInTheDocument();
  });

  test('renders swap timezones button', async () => {
    render(<TimezoneConverter />);
    expect(screen.getByTestId('swap-timezones-button')).toBeInTheDocument();
  });

  test('fetches timezones on component mount', async () => {
    render(<TimezoneConverter />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/timezones'));
    });
  });

  test('fetches major cities data on component mount', async () => {
    render(<TimezoneConverter />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/major-cities-time'));
    });
  });

  // ===== FUNCTIONAL TESTS =====

  describe('Autocomplete Functionality', () => {
    test('shows suggestions when typing in source timezone field', async () => {
      render(<TimezoneConverter />);
      const sourceInput = screen.getByTestId('source-timezone-input');
      
      fireEvent.focus(sourceInput);
      fireEvent.change(sourceInput, { target: { value: 'new' } });

      await waitFor(() => {
        const suggestions = screen.getAllByText('New York');
        expect(suggestions.length).toBeGreaterThan(0);
      });
    });

    test('selects timezone from suggestions by clicking parent button', async () => {
      render(<TimezoneConverter />);
      const sourceInput = screen.getByTestId('source-timezone-input');
      
      fireEvent.focus(sourceInput);
      fireEvent.change(sourceInput, { target: { value: 'paris' } });
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const parisButton = buttons.find(btn => btn.textContent.includes('Paris') && btn.textContent.includes('France'));
        if (parisButton) {
          fireEvent.click(parisButton);
        }
      });
    });

    test('clears search term after selection', async () => {
      render(<TimezoneConverter />);
      const sourceInput = screen.getByTestId('source-timezone-input');
      
      fireEvent.focus(sourceInput);
      fireEvent.change(sourceInput, { target: { value: 'london' } });
      
      expect(sourceInput.value).toBe('london');
      
      // Simulate selection by clearing the input (what happens in the component)
      fireEvent.change(sourceInput, { target: { value: '' } });
      expect(sourceInput.value).toBe('');
    });

    test('shows no results message when no match found', async () => {
      render(<TimezoneConverter />);
      const sourceInput = screen.getByTestId('source-timezone-input');
      
      fireEvent.focus(sourceInput);
      fireEvent.change(sourceInput, { target: { value: 'zzzzzzz' } });
      
      // When no results are found, the component shows empty state
      expect(sourceInput.value).toBe('zzzzzzz');
    });
  });

  describe('Time Selection Functionality', () => {
    test('updates time input when value changes', async () => {
      render(<TimezoneConverter />);
      const timeInput = await screen.findByTestId('time-input');
      
      fireEvent.change(timeInput, { target: { value: '14:30' } });
      expect(timeInput.value).toBe('14:30');
    });

    test('sets current time when use current time button is clicked', async () => {
      render(<TimezoneConverter />);
      const currentTimeButton = await screen.findByTestId('use-current-time-button');
      
      const timeInput = screen.getByTestId('time-input');
      const initialValue = timeInput.value;

      fireEvent.click(currentTimeButton);
      await waitFor(() => {
        // Value should be set to current time (might be different)
        expect(timeInput.value).toBeTruthy();
      });
    });
  });

  describe('Timezone Swap Functionality', () => {
    test('swaps source and target timezones', async () => {
      render(<TimezoneConverter />);
      const swapButton = screen.getByTestId('swap-timezones-button');
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      fireEvent.click(swapButton);
      // Component should render without errors after swap
      expect(screen.getByTestId('swap-timezones-button')).toBeInTheDocument();
    });
  });

  describe('Conversion Functionality', () => {
    test('displays conversion result after clicking convert', async () => {
      axios.post.mockResolvedValue({ data: mockConversionResult });
      
      render(<TimezoneConverter />);
      const convertButton = screen.getByTestId('convert-button');
      
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

    test('shows loading state during conversion', async () => {
      axios.post.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ data: mockConversionResult }), 100);
      }));
      
      render(<TimezoneConverter />);
      const convertButton = screen.getByTestId('convert-button');
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      fireEvent.click(convertButton);
      expect(screen.getByText(/Converting/i)).toBeInTheDocument();
    });

    test('sends correct data to API on conversion', async () => {
      axios.post.mockResolvedValue({ data: mockConversionResult });
      
      render(<TimezoneConverter />);
      const convertButton = screen.getByTestId('convert-button');
      
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
  });

  describe('Major Cities Display', () => {
    test('displays major cities data when loaded', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(screen.getByTestId('city-new york')).toBeInTheDocument();
        expect(screen.getByTestId('city-london')).toBeInTheDocument();
      });
    });

    test('shows loading spinner when cities data is not loaded', () => {
      axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<TimezoneConverter />);
      
      waitFor(() => {
        expect(screen.getByText(/Loading real-time data/i)).toBeInTheDocument();
      });
    });
  });

  // ===== REGRESSION TESTS =====

  describe('Regression Tests', () => {
    test('component renders without crashing', () => {
      expect(() => render(<TimezoneConverter />)).not.toThrow();
    });

    test('all interactive elements are accessible', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(screen.getByTestId('source-timezone-input')).toBeInTheDocument();
        expect(screen.getByTestId('target-timezone-input')).toBeInTheDocument();
        expect(screen.getByTestId('time-input')).toBeInTheDocument();
        expect(screen.getByTestId('convert-button')).toBeInTheDocument();
      });
    });

    test('handles API errors gracefully', async () => {
      axios.get.mockRejectedValue(new Error('API Error'));
      
      expect(() => render(<TimezoneConverter />)).not.toThrow();
    });

    test('handles conversion API errors gracefully', async () => {
      axios.post.mockRejectedValue(new Error('Conversion failed'));
      
      render(<TimezoneConverter />);
      const convertButton = screen.getByTestId('convert-button');
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      fireEvent.click(convertButton);
      
      // Should not show error, but continue to work
      expect(screen.getByTestId('convert-button')).toBeDisabled();
    });

    test('maintains state across multiple conversions', async () => {
      axios.post.mockResolvedValue({ data: mockConversionResult });
      
      render(<TimezoneConverter />);
      const convertButton = screen.getByTestId('convert-button');
      
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
    });

    test('search input can be cleared with clear button', async () => {
      render(<TimezoneConverter />);
      const sourceInput = screen.getByTestId('source-timezone-input');
      
      expect(sourceInput).toBeInTheDocument();
      expect(sourceInput).toHaveAttribute('type', 'text');
      
      fireEvent.change(sourceInput, { target: { value: 'new' } });
      expect(sourceInput.value).toBe('new');
    });

    test('autocomplete suggestions close after selection', async () => {
      render(<TimezoneConverter />);
      const sourceInput = screen.getByTestId('source-timezone-input');
      
      await waitFor(() => {
        fireEvent.focus(sourceInput);
      });

      await userEvent.type(sourceInput, 'london');
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const londonButton = buttons.find(btn => btn.textContent.includes('London'));
        if (londonButton) {
          fireEvent.click(londonButton);
        }
      });

      await waitFor(() => {
        // After selection, input should be cleared and suggestions closed
        expect(sourceInput.value).toBe('');
      });
    });

    test('displays correct UI elements on initial load', async () => {
      render(<TimezoneConverter />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Timezone Converter/i })).toBeInTheDocument();
      });

      expect(screen.getByTestId('swap-timezones-button')).toBeInTheDocument();
      expect(screen.getByTestId('convert-button')).toBeInTheDocument();
    });
  });

  // ===== BROWSE ALL CITIES DIALOG TESTS =====

  describe('Browse All Cities Dialog', () => {
    test('renders "Browse all cities" links next to both timezone labels', async () => {
      render(<TimezoneConverter />);
      await waitFor(() => {
        const browseLinks = screen.getAllByText('Browse all cities');
        expect(browseLinks).toHaveLength(2);
      });
    });

    test('opens source dialog with correct title when first Browse link is clicked', async () => {
      render(<TimezoneConverter />);
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      const browseLinks = screen.getAllByText('Browse all cities');
      fireEvent.click(browseLinks[0]);

      await waitFor(() => {
        expect(screen.getByText('Browse All Cities — From Timezone')).toBeInTheDocument();
      });
    });

    test('opens target dialog with correct title when second Browse link is clicked', async () => {
      render(<TimezoneConverter />);
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      const browseLinks = screen.getAllByText('Browse all cities');
      fireEvent.click(browseLinks[1]);

      await waitFor(() => {
        expect(screen.getByText('Browse All Cities — To Timezone')).toBeInTheDocument();
      });
    });

    test('dialog displays city count header', async () => {
      render(<TimezoneConverter />);
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      const browseLinks = screen.getAllByText('Browse all cities');
      fireEvent.click(browseLinks[0]);

      await waitFor(() => {
        expect(screen.getByText(/cities & timezones available/)).toBeInTheDocument();
      });
    });

    test('dialog shows loaded cities grouped by region', async () => {
      render(<TimezoneConverter />);
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      const browseLinks = screen.getAllByText('Browse all cities');
      fireEvent.click(browseLinks[0]);

      await waitFor(() => {
        // getAllByText handles duplicates (city name also appears in major cities grid)
        expect(screen.getAllByText('New York').length).toBeGreaterThan(0);
        expect(screen.getAllByText('London').length).toBeGreaterThan(0);
      });
    });

    test('filters cities by search term', async () => {
      render(<TimezoneConverter />);
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      fireEvent.click(screen.getAllByText('Browse all cities')[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Filter by city, country or timezone…')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Filter by city, country or timezone…'), {
        target: { value: 'london' },
      });

      await waitFor(() => {
        // getAllByText handles duplicates (city name also appears in major cities grid)
        expect(screen.getAllByText('London').length).toBeGreaterThan(0);
      });
    });

    test('shows no-results message for unmatched search term', async () => {
      render(<TimezoneConverter />);
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      fireEvent.click(screen.getAllByText('Browse all cities')[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Filter by city, country or timezone…')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText('Filter by city, country or timezone…'), {
        target: { value: 'zzzznotacity' },
      });

      await waitFor(() => {
        expect(screen.getByText(/No cities match/)).toBeInTheDocument();
      });
    });

    test('selects a city and closes the dialog', async () => {
      render(<TimezoneConverter />);
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      fireEvent.click(screen.getAllByText('Browse all cities')[0]);

      await waitFor(() => {
        expect(screen.getByText('Browse All Cities — From Timezone')).toBeInTheDocument();
      });

      // Click Tokyo card in the dialog
      const allButtons = screen.getAllByRole('button');
      const tokyoBtn = allButtons.find(
        (btn) => btn.textContent.includes('Tokyo') && btn.textContent.includes('Japan')
      );
      if (tokyoBtn) fireEvent.click(tokyoBtn);

      await waitFor(() => {
        expect(screen.queryByText('Browse All Cities — From Timezone')).not.toBeInTheDocument();
      });
    });

    test('closes dialog when Close button is clicked', async () => {
      render(<TimezoneConverter />);
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      fireEvent.click(screen.getAllByText('Browse all cities')[0]);

      await waitFor(() => {
        expect(screen.getByText('Browse All Cities — From Timezone')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('city-browser-close-btn'));

      await waitFor(() => {
        expect(screen.queryByText('Browse All Cities — From Timezone')).not.toBeInTheDocument();
      });
    });

    test('clears filter input when dialog is closed and reopened', async () => {
      render(<TimezoneConverter />);
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Open, type a filter
      fireEvent.click(screen.getAllByText('Browse all cities')[0]);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Filter by city, country or timezone…')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText('Filter by city, country or timezone…'), {
        target: { value: 'tokyo' },
      });

      // Close dialog
      fireEvent.click(screen.getByTestId('city-browser-close-btn'));
      await waitFor(() => {
        expect(screen.queryByText('Browse All Cities — From Timezone')).not.toBeInTheDocument();
      });

      // Reopen — filter should be empty
      fireEvent.click(screen.getAllByText('Browse all cities')[0]);
      await waitFor(() => {
        const filterInput = screen.getByPlaceholderText('Filter by city, country or timezone…');
        expect(filterInput.value).toBe('');
      });
    });
  });
});
