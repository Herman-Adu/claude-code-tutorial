import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OAuthConnections } from '@/features/profile/components/OAuthConnections';

describe('OAuthConnections', () => {
  it('shows message when no accounts and no password', () => {
    render(
      <OAuthConnections
        accounts={[]}
        hasPassword={false}
      />
    );

    expect(
      screen.getByText(/No external accounts connected/)
    ).toBeInTheDocument();
  });

  it('shows message when no OAuth providers connected', () => {
    render(
      <OAuthConnections
        accounts={[]}
        hasPassword={true}
      />
    );

    expect(
      screen.getByText(/No OAuth providers connected/)
    ).toBeInTheDocument();
  });

  it('displays connected OAuth providers', () => {
    render(
      <OAuthConnections
        accounts={[
          { provider: 'github', displayName: 'Github' },
          { provider: 'google', displayName: 'Google' },
        ]}
        hasPassword={true}
      />
    );

    expect(screen.getByText('Github')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getAllByText('Connected')).toHaveLength(2);
  });

  it('shows warning when OAuth-only account', () => {
    render(
      <OAuthConnections
        accounts={[
          { provider: 'github', displayName: 'Github' },
        ]}
        hasPassword={false}
      />
    );

    expect(
      screen.getByText(/uses OAuth authentication only/)
    ).toBeInTheDocument();
  });

  it('shows success message when password enabled', () => {
    render(
      <OAuthConnections
        accounts={[]}
        hasPassword={true}
      />
    );

    expect(
      screen.getByText(/Password authentication is enabled/)
    ).toBeInTheDocument();
  });

  it('displays provider icons', () => {
    render(
      <OAuthConnections
        accounts={[
          { provider: 'github', displayName: 'Github' },
          { provider: 'google', displayName: 'Google' },
        ]}
        hasPassword={true}
      />
    );

    expect(screen.getByText('🐙')).toBeInTheDocument();
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });
});
