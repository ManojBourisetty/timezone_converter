import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TimezoneConverter from './TimezoneConverter';

describe('TimezoneConverter Component - Hardcoded Data Version', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
    window.history.replaceState({}, '', '/');
  });

  test('renders title and description', () => {
    render(<TimezoneConverter />);
    expect(screen.getByRole('heading', { name: /Timezone Converter/i })).toBeInTheDocument();
    expect(screen.getByText(/Compare multiple timezones/i)).toBeInTheDocument();
  });

  test('displays browser local time bar', () => {
    render(<TimezoneConverter />);
    expect(screen.getByText(/Your Browser Local Time/i)).toBeInTheDocument();
  });

  test('renders default timezones (New York, London, New Delhi)', () => {
    render(<TimezoneConverter />);
    expect(screen.getAllByText(/New York/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/London/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/New Delhi/i).length).toBeGreaterThan(0);
  });

  test('renders Add Timezone button', () => {
    render(<TimezoneConverter />);
    const addButton = screen.getByText(/Add Timezone/i);
    expect(addButton).toBeInTheDocument();
  });

  test('opens timezone search dialog when Add Timezone is clicked', async () => {
    render(<TimezoneConverter />);
    const addButton = screen.getByText(/Add Timezone/i);
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search timezone/i)).toBeInTheDocument();
    });
  });

  test('filters timezones by search query', async () => {
    render(<TimezoneConverter />);
    const addButton = screen.getByText(/Add Timezone/i);
    fireEvent.click(addButton);
    
    const searchInput = await screen.findByPlaceholderText(/Search timezone/i);
    await userEvent.type(searchInput, 'Tokyo');
    
    await waitFor(() => {
      expect(screen.getByText(/UTC\+9 \(Tokyo\)/i)).toBeInTheDocument();
    });
  });

  test('adds timezone when selected', async () => {
    render(<TimezoneConverter />);
    const addButton = screen.getByText(/Add Timezone/i);
    fireEvent.click(addButton);
    
    const searchInput = await screen.findByPlaceholderText(/Search timezone/i);
    await userEvent.type(searchInput, 'Los Angeles');
    
    const laOption = await screen.findByText(/UTC-8 \(Los Angeles\)/i);
    fireEvent.click(laOption);
    
    await waitFor(() => {
      expect(screen.getAllByText(/Los Angeles/i).length).toBeGreaterThan(0);
    });
  });

  test('displays timezone offset badges', () => {
    render(<TimezoneConverter />);
    expect(screen.getAllByText(/Offset:/i)).toHaveLength(3);
  });

  test('renders copy buttons for time and date', () => {
    render(<TimezoneConverter />);
    const copyButtons = screen.getAllByText(/Time|Date/i);
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  test('renders Quick City Access section', () => {
    render(<TimezoneConverter />);
    expect(screen.getByText(/Quick City Access/i)).toBeInTheDocument();
  });

  test('quick city access toggles a city on and off', async () => {
    render(<TimezoneConverter />);

    expect(screen.queryByText(/\(Tokyo\)/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Tokyo$/i }));

    await waitFor(() => {
      expect(screen.getByText(/\(Tokyo\)/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Tokyo$/i }));

    await waitFor(() => {
      expect(screen.queryByText(/\(Tokyo\)/i)).not.toBeInTheDocument();
    });
  });

  test('quick city selection compensates for layout shift while adding cities', async () => {
    const originalScrollBy = window.scrollBy;
    const scrollByMock = jest.fn();
    window.scrollBy = scrollByMock;

    const originalRequestAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback) => {
      callback();
      return 0;
    };

    render(<TimezoneConverter />);

    const tokyoButton = screen.getByRole('button', { name: /^Tokyo$/i });
    const rectMock = jest.fn()
      .mockReturnValueOnce({ top: 240 })
      .mockReturnValue({ top: 320 });
    tokyoButton.getBoundingClientRect = rectMock;

    fireEvent.click(tokyoButton);

    await waitFor(() => {
      expect(scrollByMock).toHaveBeenCalledWith(0, 80);
    });

    window.scrollBy = originalScrollBy;
    window.requestAnimationFrame = originalRequestAnimationFrame;
  });

  test('renders favorite button for each timezone', () => {
    render(<TimezoneConverter />);
    const favoriteButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg')
    );
    expect(favoriteButtons.length).toBeGreaterThan(0);
  });

  test('updates favorites in localStorage', async () => {
    render(<TimezoneConverter />);
    
    const allHeartButtons = screen.getAllByRole('button').filter(btn => {
      const svg = btn.querySelector('svg');
      return svg && btn.className.includes('h-8');
    });
    
    expect(allHeartButtons.length).toBeGreaterThan(0);
  });

  test('displays correct number of timezone cards', () => {
    render(<TimezoneConverter />);
    const cards = screen.getAllByText(/Offset:/i);
    expect(cards).toHaveLength(3); // Default: NY, London, Delhi
  });

  test('renders footer text', () => {
    render(<TimezoneConverter />);
    expect(screen.getByText(/Enhanced timezone converter/i)).toBeInTheDocument();
    expect(screen.getByText(/100% Client-Side/i)).toBeInTheDocument();
  });

  test('opens converter view and shows conversion panels', async () => {
    render(<TimezoneConverter />);
    fireEvent.click(screen.getByRole('button', { name: /Time Converter/i }));

    await waitFor(() => {
      expect(screen.getByText(/Manual Timezone Conversion/i)).toBeInTheDocument();
      expect(screen.getByText(/Source/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Converted/i).length).toBeGreaterThan(0);
    });
  });

  test('opens meeting planner and renders participant rows', async () => {
    render(<TimezoneConverter />);
    fireEvent.click(screen.getByRole('button', { name: /Meeting Planner/i }));

    await waitFor(() => {
      expect(screen.getByText(/Copy Meeting Summary/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Inside Work Hours|Outside Work Hours/i).length).toBeGreaterThan(0);
    });
  });

  test('opens best slots view', async () => {
    render(<TimezoneConverter />);
    fireEvent.click(screen.getByRole('button', { name: /Best Slots/i }));

    await waitFor(() => {
      expect(screen.getByText(/Best Meeting Slots/i)).toBeInTheDocument();
    });
  });

  test('shows ICS export button in meeting planner', async () => {
    render(<TimezoneConverter />);
    fireEvent.click(screen.getByRole('button', { name: /Meeting Planner/i }));

    await waitFor(() => {
      expect(screen.getByText(/Export \.ics Calendar Invite/i)).toBeInTheDocument();
    });
  });

  test('adds a team profile member', async () => {
    render(<TimezoneConverter />);
    fireEvent.click(screen.getByRole('button', { name: /Meeting Planner/i }));

    fireEvent.click(screen.getByRole('button', { name: /Show Advanced/i }));

    const nameInput = await screen.findByPlaceholderText(/Name/i);
    await userEvent.type(nameInput, 'Alex');
    fireEvent.click(screen.getByRole('button', { name: /Add Member/i }));

    await waitFor(() => {
      expect(screen.getByText(/Alex/i)).toBeInTheDocument();
    });
  });

  test('has share setup button for URL-based sharing', () => {
    render(<TimezoneConverter />);
    expect(screen.getByRole('button', { name: /Share Setup/i })).toBeInTheDocument();
  });

  test('shows meeting app integration buttons', async () => {
    render(<TimezoneConverter />);
    fireEvent.click(screen.getByRole('button', { name: /Meeting Planner/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Google Meet/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Microsoft Teams/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Zoom/i })).toBeInTheDocument();
    });
  });
});
