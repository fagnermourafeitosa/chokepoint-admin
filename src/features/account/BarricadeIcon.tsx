// Admin 062: the Barricade icon of src/assets/barricade.svg, inline so its stroke takes the text color of the tab
// (an <img> cannot use currentColor). The mask ids carry a prefix so two icons on one page do not clash.
export function BarricadeIcon({ size = 17 }: { size?: number }) {
  const shield = 'M18.5 8.2c1.1.7 2.2 1.1 3.6 1.4v3.6c0 3-1.6 4.9-3.6 6-2-1.1-3.6-3-3.6-6V9.6c1.4-.3 2.5-.7 3.6-1.4Z';
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <defs>
      <mask id="bx-agent" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect x="0" y="0" width="24" height="24" fill="#fff" stroke="none" /><path d={shield} fill="#000" stroke="#000" strokeWidth={2.4} /><rect x="5.6" y="12.8" width="12" height="9.2" fill="#000" stroke="none" /></mask>
      <mask id="bx-wall" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect x="0" y="0" width="24" height="24" fill="#fff" stroke="none" /><path d={shield} fill="#000" stroke="#000" strokeWidth={2.4} /></mask>
    </defs>
    <g mask="url(#bx-agent)"><circle cx="8.5" cy="2.6" r="1.3" /><path d="M8.5 3.9v1.8" /><rect x="3.5" y="5.7" width="10" height="8.6" rx="2.4" /><path d="M3.5 8.4H2.6a.9.9 0 0 0-.9.9v1.7a.9.9 0 0 0 .9.9h.9" /><path d="M6.9 9.1v1.4M10.1 9.1v1.4" /></g>
    <g mask="url(#bx-wall)"><rect x="6.4" y="13.6" width="10.4" height="7.6" rx="1" /><path d="M6.4 17.4h10.4M11.6 13.6v3.8M9 17.4v3.8M14.2 17.4v3.8" /></g>
    <path d={shield} /><path d="m16.9 13.4 1.1 1.1 2.2-2.3" />
  </svg>;
}
