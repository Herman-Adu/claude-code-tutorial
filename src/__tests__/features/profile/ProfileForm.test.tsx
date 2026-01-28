import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileForm } from '@/features/profile/components/ProfileForm';

// Mock the server action
vi.mock('@/app/actions/user', () => ({
  updateProfile: vi.fn(),
}));

import { updateProfile } from '@/app/actions/user';

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with initial name', () => {
    render(<ProfileForm initialName="John Doe" />);
    const input = screen.getByDisplayValue('John Doe');
    expect(input).toBeInTheDocument();
  });

  it('renders empty when no initial name', () => {
    render(<ProfileForm initialName={null} />);
    const input = screen.getByRole('textbox');
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('disables submit when name is unchanged', () => {
    render(<ProfileForm initialName="John Doe" />);
    const button = screen.getByRole('button', { name: /save changes/i });
    expect(button).toBeDisabled();
  });

  it('enables submit when name changes', async () => {
    render(<ProfileForm initialName="John Doe" />);
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /save changes/i });

    await userEvent.clear(input);
    await userEvent.type(input, 'Jane Doe');

    expect(button).not.toBeDisabled();
  });

  it('calls updateProfile on submit', async () => {
    const mockUpdateProfile = vi.mocked(updateProfile);
    mockUpdateProfile.mockResolvedValue({ success: true });

    render(<ProfileForm initialName="John Doe" />);
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /save changes/i });

    await userEvent.clear(input);
    await userEvent.type(input, 'Jane Doe');
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({ name: 'Jane Doe' });
    });
  });

  it('shows success message on successful update', async () => {
    const mockUpdateProfile = vi.mocked(updateProfile);
    mockUpdateProfile.mockResolvedValue({ success: true });

    render(<ProfileForm initialName="John Doe" />);
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /save changes/i });

    await userEvent.clear(input);
    await userEvent.type(input, 'Jane Doe');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
  });

  it('shows error message on failed update', async () => {
    const mockUpdateProfile = vi.mocked(updateProfile);
    mockUpdateProfile.mockResolvedValue({
      success: false,
      error: 'Failed to update profile',
    });

    render(<ProfileForm initialName="John Doe" />);
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /save changes/i });

    await userEvent.clear(input);
    await userEvent.type(input, 'Jane Doe');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
    });
  });

  it('shows character count', async () => {
    render(<ProfileForm initialName="John" />);
    const helperText = screen.getByText('4 / 100 characters');
    expect(helperText).toBeInTheDocument();
  });

  it('updates character count as user types', async () => {
    render(<ProfileForm initialName="John" />);
    const input = screen.getByRole('textbox');

    await userEvent.clear(input);
    await userEvent.type(input, 'Jane Doe Smith');

    expect(screen.getByText('14 / 100 characters')).toBeInTheDocument();
  });
});
