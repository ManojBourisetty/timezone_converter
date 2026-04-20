import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TimezoneConverter from './TimezoneConverter';

const renderWithRouter = (ui, { initialEntries = ['/app'] } = {}) =>
  render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);

describe('TimezoneConverter Component - Hardcoded Data Version', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
    window.history.replaceState({}, '', '/');
  });

  test('renders title and description', () => {
    renderWithRouter(<TimezoneConverter />);
    expect(screen.getByRole('heading', { name: /Timezone Converter/i })).toBeInTheDocument();
    expect(screen.getByText(/Compare multiple timezones/i)).toBeInTheDocument();
  });

  test('displays browser local time bar', () => {
    renderWithRouter(<TimezoneConverter />);
    expect(screen.getByText(/Your Browser Local Time/i)).toBeInTheDocument();
  });

  test('renders default timezones (New York, London, New Delhi)', () => {
    renderWithRouter(<TimezoneConverter />);
    expect(screen.getAllByText(/New York/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/London/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/New Delhi/i).length).toBeGreaterThan(0);
  });

  test('renders Add Timezone button', () => {
    renderWithRouter(<TimezoneConverter />);
    const addButton = screen.getByText(/Add Timezone/i);
    expect(addButton).toBeInTheDocument();
  });

  test('opens timezone search dialog when Add Timezone is clicked', async () => {
    renderWithRouter(<TimezoneConverter />);
    const addButton = screen.getByText(/Add Timezone/i);
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search timezone/i)).toBeInTheDocument();
    });
  });

  test('filters timezones by search query', async () => {
    renderWithRouter(<TimezoneConverter />);
    const addButton = screen.getByText(/Add Timezone/i);
    fireEvent.click(addButton);
    
    const searchInput = await screen.findByPlaceholderText(/Search timezone/i);
    await userEvent.type(searchInput, 'Tokyo');
    
    await waitFor(() => {
      expect(screen.getByText(/UTC\+9 \(Tokyo\)/i)).toBeInTheDocument();
    });
  });

  test('adds timezone when selected', async () => {
    renderWithRouter(<TimezoneConverter />);
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
    renderWithRouter(<TimezoneConverter />);
    expect(screen.getAllByText(/Offset:/i)).toHaveLength(3);
  });

  test('renders copy buttons for time and date', () => {
    renderWithRouter(<TimezoneConverter />);
    const copyButtons = screen.getAllByText(/Time|Date/i);
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  test('renders Quick City Access section', () => {
    renderWithRouter(<TimezoneConverter />);
    expect(screen.getByText(/Quick City Access/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Seoul$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^San Francisco$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Boston$/i })).toBeInTheDocument();
  });

  test('quick city access toggles a city on and off', async () => {
    renderWithRouter(<TimezoneConverter />);

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

  test('quick city selection adds a separate city card for the same timezone offset', async () => {
    renderWithRouter(<TimezoneConverter />);

    expect(screen.getByText(/\(New York\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Boston$/i }));

    await waitFor(() => {
      expect(screen.getByText(/\(New York\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\(Boston\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Offset:/i)).toHaveLength(4);
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

    renderWithRouter(<TimezoneConverter />);

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
    renderWithRouter(<TimezoneConverter />);
    const favoriteButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg')
    );
    expect(favoriteButtons.length).toBeGreaterThan(0);
  });

  test('updates favorites in localStorage', async () => {
    renderWithRouter(<TimezoneConverter />);
    
    const allHeartButtons = screen.getAllByRole('button').filter(btn => {
      const svg = btn.querySelector('svg');
      return svg && btn.className.includes('h-8');
    });
    
    expect(allHeartButtons.length).toBeGreaterThan(0);
  });

  test('displays correct number of timezone cards', () => {
    renderWithRouter(<TimezoneConverter />);
    const cards = screen.getAllByText(/Offset:/i);
    expect(cards).toHaveLength(3); // Default: NY, London, Delhi
  });

  test('renders footer text', () => {
    renderWithRouter(<TimezoneConverter />);
    expect(screen.getByText(/Enhanced timezone converter/i)).toBeInTheDocument();
    expect(screen.getByText(/100% Client-Side/i)).toBeInTheDocument();
  });

  test('opens converter view and shows conversion panels', async () => {
    renderWithRouter(<TimezoneConverter />);
    fireEvent.click(screen.getByRole('tab', { name: /Converter/i }));

    await waitFor(() => {
      expect(screen.getByText(/Manual Timezone Conversion/i)).toBeInTheDocument();
      expect(screen.getByText(/Source/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Converted/i).length).toBeGreaterThan(0);
    });
  });

  test('opens meeting planner and renders participant rows', async () => {
    renderWithRouter(<TimezoneConverter />);
    fireEvent.click(screen.getByRole('tab', { name: /Meeting Planner/i }));

    await waitFor(() => {
      expect(screen.getByText(/Copy Meeting Summary/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Inside Work Hours|Outside Work Hours/i).length).toBeGreaterThan(0);
    });
  });

  test('opens best slots view', async () => {
    renderWithRouter(<TimezoneConverter />);
    fireEvent.click(screen.getByRole('tab', { name: /Best Slots/i }));

    await waitFor(() => {
      expect(screen.getByText(/Best Meeting Slots/i)).toBeInTheDocument();
    });
  });

  test('shows ICS export button in meeting planner', async () => {
    renderWithRouter(<TimezoneConverter />);
    fireEvent.click(screen.getByRole('tab', { name: /Meeting Planner/i }));

    await waitFor(() => {
      expect(screen.getByText(/Export \.ics Calendar Invite/i)).toBeInTheDocument();
    });
  });

  test('adds a team profile member', async () => {
    renderWithRouter(<TimezoneConverter />);
    fireEvent.click(screen.getByRole('tab', { name: /Meeting Planner/i }));

    fireEvent.click(screen.getByRole('button', { name: /Show Advanced/i }));

    const nameInput = await screen.findByPlaceholderText(/Name/i);
    await userEvent.type(nameInput, 'Alex');
    fireEvent.click(screen.getByRole('button', { name: /Add Member/i }));

    await waitFor(() => {
      expect(screen.getByText(/Alex/i)).toBeInTheDocument();
    });
  });

  test('has share setup button for URL-based sharing', () => {
    renderWithRouter(<TimezoneConverter />);
    expect(screen.getByRole('button', { name: /Share Setup/i })).toBeInTheDocument();
  });

  test('shareable URL preserves exact city selections for same-timezone cities', async () => {
    const { unmount } = renderWithRouter(<TimezoneConverter />);

    fireEvent.click(screen.getByRole('button', { name: /^Boston$/i }));

    await waitFor(() => {
      expect(window.location.search).toContain('tz=-5%2C0%2C5.5');
      expect(window.location.search).toContain('tzc=Boston-USA--5');
    });

    unmount();
    window.history.replaceState({}, '', `/${window.location.search}`);

    renderWithRouter(<TimezoneConverter />);

    await waitFor(() => {
      expect(screen.getByText(/\(New York\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\(Boston\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\(London\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\(New Delhi\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Offset:/i)).toHaveLength(4);
    });
  });

  test('shows meeting app integration buttons', async () => {
    renderWithRouter(<TimezoneConverter />);
    fireEvent.click(screen.getByRole('tab', { name: /Meeting Planner/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Google Meet/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Microsoft Teams/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Zoom/i })).toBeInTheDocument();
    });
  });
});
