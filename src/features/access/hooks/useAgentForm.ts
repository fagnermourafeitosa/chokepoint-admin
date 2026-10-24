import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AgentInput } from '../types';

export function useAgentForm(onSubmit: (input: AgentInput) => void) {
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    if (!name) {
      setError('Enter an agent name.');
      return;
    }
    onSubmit({ name, description: String(form.get('description') ?? '').trim() });
  }
  return { submit, error };
}
