import { usePendingChanges } from "../auth/pending/PendingChanges";
import { SelectMenu } from '../../components/ui/dropdown/SelectMenu';
import { useState } from 'react';
import { sourceApi, type Source, type SourceConfig } from './api';
import type { EnvironmentScope } from '../access/environment-scope';
import type { SourceActions } from './useSources';

type Props={scope:EnvironmentScope;source?:Source;actions:SourceActions;onSaved:(source:Source)=>void};
export function SourceConnection({scope,source,actions,onSaved}:Props){
 const [config,setConfig]=useState<SourceConfig>(source?{name:source.name,base_url:source.base_url,auth_type:source.auth_type,api_key_header:source.api_key_header,timeout_millis:source.timeout_millis,cache_ttl_seconds:source.cache_ttl_seconds,enabled:source.enabled}:{name:'',base_url:'',auth_type:'bearer',timeout_millis:1000,cache_ttl_seconds:0,enabled:true});
 const [credential,setCredential]=useState(''),[review,setReview]=useState(false);
 const [initialConfig]=useState(()=>JSON.stringify(config));
 usePendingChanges(actions.busy || !!credential || JSON.stringify(config)!==initialConfig);
 function field<K extends keyof SourceConfig>(key:K,value:SourceConfig[K]){setConfig({...config,[key]:value});setReview(false)}
 async function save(){const result=await actions.run(signal=>sourceApi.save(scope,source?.id,{...config,revision:source?.revision??0,...(credential?{credential}:{})},signal));if(result){setCredential('');actions.saved(result);onSaved(result)}}
 return <div className="source-columns"><form className="cp-admin-panel source-form" onSubmit={e=>{e.preventDefault();setReview(true)}}><h2>Connection details</h2><fieldset disabled={actions.busy}>
 <label>Source name<input className="cp-admin-input" required maxLength={80} value={config.name} onChange={e=>field('name',e.target.value)}/></label>
 <label>Base URL<input className="cp-admin-input" required type="url" value={config.base_url} onChange={e=>field('base_url',e.target.value)}/></label><small>Approved API destination. Bindings supply identifiers, not arbitrary URLs.</small>
 <label>Authentication<SelectMenu block label="Authentication" value={config.auth_type} onChange={v=>setConfig({...config,auth_type:v as SourceConfig['auth_type'],api_key_header:undefined})} options={[{value:'bearer',label:'Bearer token'},{value:'api_key',label:'API key'},{value:'none',label:'No authentication'}]}/></label>
 {config.auth_type==='api_key'?<label>API key header<input className="cp-admin-input" required value={config.api_key_header??''} onChange={e=>field('api_key_header',e.target.value)} placeholder="X-API-Key"/></label>:null}
 {config.auth_type!=='none'?<label>API credential<input className="cp-admin-input" type="password" autoComplete="new-password" value={credential} onChange={e=>setCredential(e.target.value)} placeholder={source?.credential_configured?'Saved credential. Leave blank to retain.':'Enter API credential'} required={!source?.credential_configured}/></label>:null}
 <div className="source-field-pair"><label>Timeout (ms)<input className="cp-admin-input" type="number" min={100} max={3000} required value={config.timeout_millis} onChange={e=>field('timeout_millis',Number(e.target.value))}/></label><label>Cache TTL (seconds)<input className="cp-admin-input" type="number" min={0} max={300} required value={config.cache_ttl_seconds} onChange={e=>field('cache_ttl_seconds',Number(e.target.value))}/></label></div>
 <label className="source-check"><input type="checkbox" checked={config.enabled} onChange={e=>field('enabled',e.target.checked)}/>Enabled</label>
 <small>TTL 0 fetches fresh facts for each evaluation. Source failure stops dependent evaluations.</small>
 <button className="cp-admin-button" type="submit">Review connection</button>
 </fieldset></form><aside className="source-help"><h2>Keep facts authoritative</h2><p>Credentials stay in Chokepoint. Your client and identity provider do not fetch these attributes.</p><p>Saving a source does not test its API. Changed source settings require existing bindings to be reviewed again.</p>{review?<section className="cp-admin-notice"><h3>Review connection</h3><dl><dt>Destination</dt><dd>{config.base_url}</dd><dt>Authentication</dt><dd>{config.auth_type}</dd><dt>Source status</dt><dd>{config.enabled?'Enabled':'Disabled'}</dd></dl><p>{source?.bindings.some(b=>b.approved)?'Saving invalidates existing binding approvals. Dependent calls will stop until bindings are reviewed again.':'Save this connection, then configure an attribute binding.'}</p><button className="cp-admin-button" disabled={actions.busy} onClick={()=>void save()}>{actions.busy?'Saving…':'Confirm & save'}</button></section>:null}</aside></div>;
}
