'use client';

import { useState, useTransition } from 'react';
import { updateProfile } from '@/app/actions/user';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

interface ProfileFormProps {
  initialName: string | null;
}

export function ProfileForm({ initialName }: ProfileFormProps) {
  const [name, setName] = useState(initialName || '');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    startTransition(async () => {
      const result = await updateProfile({ name });

      if (result.success) {
        setSuccessMessage('Profile updated successfully');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(result.error || 'Failed to update profile');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMessage && (
        <Alert
          type="success"
          title="Success"
          message={successMessage}
          dismissible
          onDismiss={() => setSuccessMessage('')}
        />
      )}

      {errorMessage && (
        <Alert
          type="error"
          title="Error"
          message={errorMessage}
          dismissible
          onDismiss={() => setErrorMessage('')}
        />
      )}

      <div>
        <Input
          label="Full Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          helperText={`${name.length} / 100 characters`}
          disabled={isPending}
        />
      </div>

      <Button
        type="submit"
        disabled={isPending || name === initialName}
        className="w-full"
      >
        {isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}
