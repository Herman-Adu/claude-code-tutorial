import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccountInfo } from '@/features/profile/components/AccountInfo';

describe('AccountInfo', () => {
  const mockDate = new Date('2024-01-15');
  const verifiedDate = new Date('2024-01-16');

  it('renders user info', () => {
    render(
      <AccountInfo
        email="john@example.com"
        name="John Doe"
        createdAt={mockDate}
        emailVerified={verifiedDate}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('renders User when name is null', () => {
    render(
      <AccountInfo
        email="john@example.com"
        name={null}
        createdAt={mockDate}
        emailVerified={null}
      />
    );

    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('displays email verified badge when verified', () => {
    render(
      <AccountInfo
        email="john@example.com"
        name="John Doe"
        createdAt={mockDate}
        emailVerified={verifiedDate}
      />
    );

    expect(screen.getByText('Email Verified')).toBeInTheDocument();
  });

  it('does not display verified badge when not verified', () => {
    render(
      <AccountInfo
        email="john@example.com"
        name="John Doe"
        createdAt={mockDate}
        emailVerified={null}
      />
    );

    expect(screen.queryByText('Email Verified')).not.toBeInTheDocument();
  });

  it('displays member since date', () => {
    render(
      <AccountInfo
        email="john@example.com"
        name="John Doe"
        createdAt={mockDate}
        emailVerified={null}
      />
    );

    expect(screen.getByText('Member Since')).toBeInTheDocument();
    expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
  });

  it('displays Gravatar tip with link', () => {
    render(
      <AccountInfo
        email="john@example.com"
        name="John Doe"
        createdAt={mockDate}
        emailVerified={null}
      />
    );

    const gravatarLink = screen.getByRole('link', { name: 'Gravatar' });
    expect(gravatarLink).toHaveAttribute('href', 'https://gravatar.com');
    expect(gravatarLink).toHaveAttribute('target', '_blank');
  });
});
