import { usePendingChanges } from "../auth/pending/PendingChanges";
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
import { mcpKey } from './api';
import { mappingApi, mappingError, mappingKey } from './mapping-api';
import type { MappingView } from './mapping-api';
import { parseMapping } from './mapping-fields';

// Network and draft state stay outside JSX. The keyed parent resets this hook
// on scope/tool changes; pending mutations are aborted when it unmounts.
export function useMappingEditor(scope: EnvironmentScope, serverId: string, toolName: string) {
 const client = useQueryClient();
 const key = mappingKey(scope, serverId, toolName);
 const query = useQuery({ queryKey: key, queryFn: ({ signal }) => mappingApi.get(scope, serverId, toolName, signal), staleTime: 0 });
 const [view, setView] = useState<MappingView>();
 const [text, setText] = useState('');
 const [mode, setMode] = useState<'fields' | 'json'>('fields');
 const [stage, setStage] = useState<'edit' | 'approve' | 'remove'>('edit');
 const [argumentsText, setArgumentsText] = useState('{}');
 const [claimsText, setClaimsText] = useState('{"sub":"sample-user"}');
 const [preview, setPreview] = useState<unknown>();
 const [error, setError] = useState('');
 const [notice, setNotice] = useState('');
 const [pending, setPending] = useState(false);
 const [conflict, setConflict] = useState(false);
 usePendingChanges(pending || (!!view && text !== JSON.stringify(view.draft?.document ?? view.effective, null, 2)));
 const request = useRef<AbortController | null>(null);
 const load = (next: MappingView) => { setView(next); setText(JSON.stringify(next.draft?.document ?? next.effective, null, 2)); setPreview(undefined); setConflict(false); };
 useEffect(() => { if (query.data && !view) load(query.data); }, [query.data, view]);
 useEffect(() => () => { request.current?.abort(); }, []);
 async function run(work: (signal: AbortSignal) => Promise<void>) {
  if (request.current) return;
  const controller = new AbortController(); request.current = controller; setPending(true); setError(''); setNotice('');
  try { await work(controller.signal); }
  catch (e) { if (!controller.signal.aborted) { setError(e instanceof SyntaxError ? 'Enter valid JSON in the mapping and sample fields.' : mappingError(e)); setConflict(e instanceof HttpError && e.status === 409); } }
  finally { if (!controller.signal.aborted) setPending(false); request.current = null; }
 }
 function saved(next: MappingView) { load(next); client.setQueryData(key, next); void client.invalidateQueries({ queryKey: mcpKey(scope) }); }
 const review = () => run(async signal => { if (!view) return; const next = await mappingApi.save(scope, serverId, toolName, view.server_revision, parseMapping(text), signal); if (signal.aborted) return; saved(next); setStage('approve'); });
 const change = (action: 'approve' | 'remove' | 'discard') => run(async signal => { if (!view) return; const next = await mappingApi.change(scope, serverId, toolName, view.server_revision, action, signal); if (signal.aborted) return; saved(next); setStage('edit'); setNotice(action === 'approve' ? 'Local mapping approved. This does not grant tool access.' : action === 'remove' ? 'Local mapping removed. The reviewed fallback is now selected.' : 'Draft discarded. The active mapping is unchanged.'); });
 const project = () => run(async signal => { if (!view) return; const result = await mappingApi.preview(scope, serverId, toolName, view.server_revision, parseMapping(text), JSON.parse(argumentsText), JSON.parse(claimsText), signal); if (!signal.aborted) setPreview(result.evaluations); });
 const reload = () => run(async signal => { const result = await query.refetch(); if (result.error) throw result.error; if (result.data && !signal.aborted) { load(result.data); setStage('edit'); } });
 return { query, view, text, setText: (value: string) => { setText(value); setPreview(undefined); }, mode, setMode, stage, setStage, argumentsText, setArgumentsText, claimsText, setClaimsText, preview, error, notice, pending, conflict, review, change, project, reload };
}
