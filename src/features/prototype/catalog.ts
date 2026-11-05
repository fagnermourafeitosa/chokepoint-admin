// The prototype catalog comes from the index in specs/prototypes/README.md, the single source of
// the prototypes and their state. The specification status comes from each specification header.
// Both are read only by the development server: no index or specification text goes into a
// production build.
export type PrototypeState = 'Active' | 'Archived';
export type PrototypeEntry = {
  id: string; title: string; folder: string; state: PrototypeState; summary: string; notes: string; specStatus?: string;
};

const index = import.meta.env.DEV
  ? import.meta.glob<string>('../../../specs/prototypes/README.md', { query: '?raw', import: 'default' })
  : {};
const specs = import.meta.env.DEV
  ? import.meta.glob<string>('../../../specs/[0-9]*.md', { query: '?raw', import: 'default' })
  : {};

const link = /^\[([^\]]+)\]\(([^)]+)\)$/;

export async function loadPrototypeCatalog(): Promise<PrototypeEntry[]> {
  const loadIndex = Object.values(index)[0];
  if (!loadIndex) return [];
  const rows = (await loadIndex()).split('## Index')[1]?.split('\n').filter(line => line.startsWith('| [')) ?? [];
  return Promise.all(rows.flatMap(line => {
    const [spec, folder, state, summary = '', notes = ''] = line.slice(1, -1).split(' | ').map(cell => cell.trim());
    const specLink = link.exec(spec ?? ''), folderLink = link.exec(folder ?? '');
    if (!specLink || !folderLink || (state !== 'Active' && state !== 'Archived')) return [];
    const [id, ...title] = specLink[1].split(' — ');
    const entryState: PrototypeState = state;
    return [specStatus(specLink[2]).then((status): PrototypeEntry => ({ id, title: title.join(' — '), folder: folderLink[1], state: entryState, summary, notes, specStatus: status }))];
  }));
}

async function specStatus(relativeSpec: string): Promise<string | undefined> {
  const load = specs[`../../../specs/${relativeSpec.replace(/^\.\.\//, '')}`];
  return load ? /\*\*Status\*\*:\s*(.+)/.exec(await load())?.[1].trim() : undefined;
}
