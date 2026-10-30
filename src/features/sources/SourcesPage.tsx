import { useState } from 'react';
import { Plus } from 'lucide-react';
import { sourceApi, type Source } from './api';
import { useSources } from './useSources';
import { SourceConnection } from './SourceConnection';
import { SourceBindings } from './SourceBindings';
import type { EnvironmentScope } from '../access/environment-scope';
import './sources.css';

export function SourcesPage({scope}:{scope:EnvironmentScope}){
 const actions=useSources(scope),[selected,setSelected]=useState<string>(),[tab,setTab]=useState<'connection'|'bindings'>('connection'),[search,setSearch]=useState(''),[remove,setRemove]=useState(false);
 const source=actions.sources.find(s=>s.id===selected);
 function choose(item?:Source){setSelected(item?.id??'new');setTab(item?'bindings':'connection');setRemove(false)}
 async function deleteSource(){if(!source)return;const result=await actions.run(async signal=>{await sourceApi.remove(scope,source,signal);return true});if(result){actions.removed(source.id);setSelected(undefined)}}
 return <section className="source-manager" aria-label="Context sources"><header className="access-page-heading"><div><h1 className="cp-admin-title">{selected?(tab==='connection'?'Connect an authoritative API':'Attribute bindings'):'Trusted data for your policies'}</h1><p className="cp-admin-muted">Resolve user and resource attributes from your APIs before policy evaluation.</p></div>{selected?<button className="cp-admin-button cp-admin-button--secondary" disabled={actions.busy} onClick={()=>setSelected(undefined)}>Back to sources</button>:<button className="cp-admin-button" onClick={()=>choose()}><Plus size={16} aria-hidden="true" />Connect API source</button>}</header>
 {actions.error?<div className="cp-admin-notice" role="alert">{actions.error} <button className="cp-admin-button cp-admin-button--secondary" disabled={actions.busy} onClick={()=>void actions.refetch()}>Reload</button></div>:null}
 {actions.isPending?<p role="status">Loading sources…</p>:actions.isError?<p role="alert">Could not load sources. <button className="cp-admin-button" onClick={()=>void actions.refetch()}>Retry</button></p>:selected?<>
 <nav className="source-tabs" aria-label="Source settings"><button aria-current={tab==='connection'?'page':undefined} onClick={()=>setTab('connection')}>Connection</button><button disabled={!source} aria-current={tab==='bindings'?'page':undefined} onClick={()=>setTab('bindings')}>Attribute bindings</button></nav>
 {tab==='connection'?<SourceConnection key={`${selected}:${source?.revision??0}`} scope={scope} source={source} actions={actions} onSaved={saved=>{setSelected(saved.id);setTab('bindings')}}/>:source?<SourceBindings key={source.id} source={source} scope={scope} actions={actions}/>:null}
 {source&&tab==='connection'?<section className="source-retirement"><button className="cp-admin-button cp-admin-button--secondary" disabled={actions.busy||source.bindings.length>0} onClick={()=>setRemove(true)}>Delete source</button><small>Retire bindings and discard drafts before deleting this source.</small>{remove?<div className="cp-admin-notice"><p>Delete {source.name}? This removes its saved settings and credential.</p><button className="cp-admin-button" disabled={actions.busy} onClick={()=>void deleteSource()}>Confirm deletion</button><button className="cp-admin-button cp-admin-button--ghost" onClick={()=>setRemove(false)}>Cancel</button></div>:null}</section>:null}
 </>:<><label className="source-search">Find a source<input className="cp-admin-input" type="search" placeholder="Search sources…" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="cp-admin-table-scroll"><table className="cp-admin-table"><thead><tr><th>Source</th><th>Attribute bindings</th><th>Status</th><th></th></tr></thead><tbody>{actions.sources.filter(s=>`${s.name} ${s.base_url}`.toLowerCase().includes(search.toLowerCase())).map(s=><tr key={s.id}><td><strong>{s.name}</strong><small>{s.base_url}</small></td><td>{s.bindings.filter(b=>b.approved).length} approved<small>{s.bindings.filter(b=>b.draft).length} drafts</small></td><td>{s.enabled?'Enabled':'Disabled'}<small>API not checked</small></td><td><button className="cp-admin-button cp-admin-button--ghost" onClick={()=>choose(s)}>Manage source →</button></td></tr>)}</tbody></table></div>{!actions.sources.length?<p>No context sources yet. Connect your first authoritative API.</p>:null}<p className="source-footnote">A source provides facts; a policy makes the decision. Sources belong to this workspace and environment.</p></>}
 </section>;
}
