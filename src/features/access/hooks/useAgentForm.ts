import { usePendingChanges } from "../../auth/pending/PendingChanges";
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { HttpError } from '../../../api/http-client';
import { agentApi } from '../agent-api';
import type { AgentRecord, AgentScope } from '../agent-api';
import type { Appearance } from '../components/AgentAppearance';

const length = (value: string) => Array.from(value).length;
export function agentError(error: unknown) {
  if (error instanceof HttpError) {
    if (error.status === 400) return 'Check the name, description and image dimensions.';
    if (error.status === 413) return 'The image must fit within 256 KiB and 512 × 512 pixels, including its normalized PNG size.';
    if (error.status === 415) return 'Choose a valid PNG or JPEG image.';
    if (error.status === 404) return 'This agent or environment is no longer available.';
    if (error.status === 401) return 'Your session has expired. Sign in again.';
    if (error.status === 403) return 'The request was rejected. Refresh the page and try again.';
  }
  return 'The request could not be completed. Check your connection and try again.';
}

type Options = { scope: AgentScope; agent?: AgentRecord; onPersisted: (agent: AgentRecord) => void; onSaved: (agent: AgentRecord) => void };
export function useAgentForm({ scope, agent, onPersisted, onSaved }: Options) {
  const [name, setName] = useState(agent?.name ?? '');
  const [description, setDescription] = useState(agent?.description ?? '');
  const [appearance, setAppearance] = useState<Appearance>({ mode: agent?.visual_kind ?? 'icon', icon: agent?.icon_key ?? 'bot', file: null });
  const [persisted, setPersisted] = useState(agent);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [partial, setPartial] = useState(false);
  const [checkingFile, setCheckingFile] = useState(false);
  const alive = useRef(true);
  const submitting = useRef(false);
  const fileSequence = useRef(0);
  usePendingChanges(pending || name !== (persisted?.name ?? '') || description !== (persisted?.description ?? '') || appearance.mode !== (persisted?.visual_kind ?? 'icon') || appearance.icon !== (persisted?.icon_key ?? 'bot') || !!appearance.file);
  useEffect(() => { alive.current = true; return () => { alive.current = false; fileSequence.current++; }; }, []);

  async function chooseFile(file: File) {
    const sequence = ++fileSequence.current;
    setError(''); setCheckingFile(true);
    try {
      if (!['image/png', 'image/jpeg'].includes(file.type)) throw new Error('Choose a PNG or JPEG image.');
      if (file.size > 256 * 1024) throw new Error('Choose an image no larger than 256 KiB.');
      const bitmap = await createImageBitmap(file);
      const valid = bitmap.width > 0 && bitmap.height > 0 && bitmap.width <= 512 && bitmap.height <= 512;
      bitmap.close();
      if (!valid) throw new Error('Image dimensions must be at most 512 × 512 pixels.');
      if (alive.current && sequence === fileSequence.current) setAppearance(current => ({ ...current, mode: 'image', file }));
    } catch (reason) {
      if (alive.current && sequence === fileSequence.current) setError(reason instanceof Error ? reason.message : 'The image could not be read.');
    } finally { if (alive.current && sequence === fileSequence.current) setCheckingFile(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || checkingFile) return;
    const trimmed = name.trim();
    if (!trimmed || length(trimmed) > 50 || length(description) > 200) { setError('Use a name of 1–50 characters and a description of at most 200 characters.'); return; }
    if (appearance.mode === 'image' && !appearance.file && persisted?.visual_kind !== 'image') { setError('Choose an image to upload.'); return; }
    submitting.current = true; setPending(true); setError('');
    let saved = persisted;
    let metadataSaved = false;
    try {
      const fields = { name: trimmed, description, ...(appearance.mode === 'icon' ? { icon_key: appearance.icon } : saved ? {} : { icon_key: 'bot' as const }) };
      saved = saved ? await agentApi.update(scope, saved.id, fields) : await agentApi.create(scope, fields);
      metadataSaved = true;
      if (!alive.current) return;
      setPersisted(saved); onPersisted(saved);
      if (appearance.mode === 'image' && appearance.file) saved = await agentApi.upload(scope, saved.id, appearance.file);
      if (!alive.current) return;
      setPersisted(saved); setPartial(false); onSaved(saved);
    } catch (reason) {
      if (!alive.current) return;
      const imageFailure = metadataSaved && appearance.mode === 'image' && !!appearance.file;
      setPartial(imageFailure);
      setError(imageFailure ? `The agent was saved, but its image was not saved. Retry without creating another agent. ${agentError(reason)}` : agentError(reason));
    } finally { submitting.current = false; if (alive.current) setPending(false); }
  }
  return { name, setName, description, setDescription, appearance, setAppearance, chooseFile, submit, error, pending, checkingFile, partial, persisted };
}
