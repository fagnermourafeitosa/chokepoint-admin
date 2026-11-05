// Outer contour of the Anton O and the arrow cut into it: the Xokepoint mark of the home
// (frontend specifications 010 and 011). The arrow O replaces the first O of the wordmark.
const markO = 'M498 16Q287 16 175.5 -111.5Q64 -239 64 -480V-1316Q64 -1542 174.5 -1659.0Q285 -1776 498 -1776Q711 -1776 821.5 -1659.0Q932 -1542 932 -1316V-480Q932 -239 820.5 -111.5Q709 16 498 16Z';
const markArrow = 'M194 -880H794M504 -1170L794 -880L504 -590';

export function Wordmark() {
  return <span>X<svg className="cp-admin-wordmark-o" viewBox="0 -1776 996 1792" aria-hidden="true" focusable="false"><path d={markO} /><path className="cp-admin-wordmark-arrow" d={markArrow} /></svg>KEPOINT</span>;
}
