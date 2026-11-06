import { useEffect, useRef, useState } from 'react';
import { Notice } from '../../../components/ui/notice/Notice';
import { SelectMenu } from '../../../components/ui/dropdown/SelectMenu';

// Expires (Admin 048): a select instead of two radio cards. Choosing
// "On a date" shows the date input and opens its calendar at once.
const inDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

// never and ends say what happens, in the words of the screen (who can do what), never "relation".
export function ExpiresField({ value, onChange, never, ends }: { value?: string; onChange: (v?: string) => void; never: string; ends: string }) {
  const date = useRef<HTMLInputElement>(null);
  const [pick, setPick] = useState(false);
  useEffect(() => {
    if (!pick || !date.current) return;
    setPick(false);
    date.current.focus();
    try { date.current.showPicker(); } catch { /* the browser opens it on the next click */ }
  }, [pick, value]);
  return <div className="relation-field expires-field"><span>Expires</span>
    <SelectMenu block label="Expires" value={value ? 'date' : 'never'} onChange={v => { if (v === 'never') onChange(undefined); else { onChange(value ?? inDays(90)); setPick(true); } }}
      options={[{ value: 'never', label: 'Never' }, { value: 'date', label: 'On a date' }]} />
    {value ? <input ref={date} className="cp-admin-input" type="date" aria-label="Expiration date" value={value} onChange={e => onChange(e.target.value || undefined)} /> : null}
    <Notice tone="info"><span>{value ? ends : never}</span></Notice>
  </div>;
}
