import { usePendingChanges } from "../auth/pending/PendingChanges";
import { SelectMenu } from '../../components/ui/dropdown/SelectMenu';
import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { mcpApi, mcpKey } from '../mcp/api';
import { sourceApi, type Source, type Binding, type BindingConfig, type Operation } from './api';
import { OpenAPIImport } from './OpenAPIImport';
import { BindingFields } from './BindingFields';
import type { EnvironmentScope } from '../access/environment-scope';
import type { SourceActions } from './useSources';

function configFrom(binding:Binding|undefined):BindingConfig{
 const version=binding?.draft??binding?.approved;
 if(!version)return {name:'',server_id:'',tool_name:'',entity:'resource',entity_type:'',path:'',parameters:[],attributes:[{name:'',pointer:'',type:'string'}]};
 return {name:version.name,server_id:version.server_id,tool_name:version.tool_name,entity:version.entity,entity_type:version.entity_type,path:version.path,parameters:version.parameters,attributes:version.attributes};
}
export function BindingEditor({source,binding,scope,actions,onClose}:{source:Source;binding?:Binding;scope:EnvironmentScope;actions:SourceActions;onClose:()=>void}){
 const [config,setConfig]=useState(()=>configFrom(binding)),[sample,setSample]=useState('{}'),[preview,setPreview]=useState<unknown>(),[sampleError,setSampleError]=useState('');
 const [initialConfig]=useState(()=>JSON.stringify(config));
 usePendingChanges(actions.busy || JSON.stringify(config)!==initialConfig || sample!=='{}');
 const servers=useInfiniteQuery({queryKey:mcpKey(scope),queryFn:({signal,pageParam})=>mcpApi.list(scope,pageParam,signal),initialPageParam:0,getNextPageParam:last=>last.next_offset??undefined});
 const items=servers.data?.pages.flatMap(p=>p.items)??[];const selectedServer=items.find(s=>s.id===config.server_id);
 function choose(operation:Operation){setConfig({...config,name:config.name||operation.operation_id||'API attributes',path:operation.path,parameters:operation.parameters.map(p=>({name:p.name,in:p.in,from:config.entity==='subject'?'subject_id':'resource_id'})),attributes:operation.fields.slice(0,32).map((field,i)=>({name:(field.pointer.split('/').at(-1)||`attribute_${i+1}`).replace(/[^A-Za-z0-9_]/g,'_').replace(/^[^A-Za-z]/,'a_'),pointer:field.pointer,type:field.type}))});setPreview(undefined)}
 async function save(){const result=await actions.run(signal=>sourceApi.binding(scope,source,binding?.id,'draft',config,signal));if(result){actions.saved(result);onClose()}}
 async function testSample(){setPreview(undefined);setSampleError('');let value:unknown;try{value=JSON.parse(sample)}catch{setSampleError('Enter valid JSON sample data.');return}const result=await actions.run(signal=>sourceApi.preview(scope,source.id,value,config.attributes,signal));if(result)setPreview(result.values)}
 return <section className="cp-admin-panel source-form"><h2>{binding?'Edit attribute binding':'New attribute binding'}</h2><OpenAPIImport scope={scope} actions={actions} onChoose={choose}/><form onSubmit={e=>{e.preventDefault();void save()}}><fieldset disabled={actions.busy}>
 <label>Binding name<input className="cp-admin-input" required maxLength={80} value={config.name} onChange={e=>setConfig({...config,name:e.target.value})}/></label>
 <div className="source-field-pair"><label>MCP server<SelectMenu block required label="MCP server" value={config.server_id} onChange={v=>setConfig({...config,server_id:v,tool_name:''})} options={[{value:'',label:'Select server'},...items.filter(s=>s.enabled).map(s=>({value:s.id,label:s.name}))]}/></label><label>Tool<SelectMenu block required label="Tool" value={config.tool_name} onChange={v=>setConfig({...config,tool_name:v})} options={[{value:'',label:'Select approved tool'},...(selectedServer?.tools.filter(t=>t.enabled&&t.selected&&t.reviewed&&t.change!=='removed').map(t=>({value:t.name,label:t.name}))??[])]}/></label></div>
 {servers.hasNextPage?<button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={()=>void servers.fetchNextPage()}>Load more servers</button>:null}{servers.isError?<p role="alert">Could not load servers. <button type="button" onClick={()=>void servers.refetch()}>Retry</button></p>:null}
 <div className="source-field-pair"><label>Enrich<SelectMenu block label="Enrich" value={config.entity} onChange={v=>setConfig({...config,entity:v as BindingConfig['entity']})} options={[{value:'resource',label:'Resource'},{value:'subject',label:'User'}]}/></label><label>AuthZEN entity type<input className="cp-admin-input" required value={config.entity_type} onChange={e=>setConfig({...config,entity_type:e.target.value})} placeholder={config.entity==='subject'?'user':'account'}/></label></div>
 <label>GET path<input className="cp-admin-input source-code" required value={config.path} onChange={e=>setConfig({...config,path:e.target.value})} placeholder="/accounts/{id}"/></label><small>Relative to {source.base_url}. Use query parameters for complex identifiers.</small>
 <BindingFields value={config} onChange={value=>{setConfig(value);setPreview(undefined)}}/>
 <div className="source-actions"><button className="cp-admin-button" disabled={!config.attributes.length}>Save draft</button><button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={onClose}>Cancel</button></div>
 </fieldset></form><details className="source-sample"><summary>Test sample extraction</summary><label>Sample API response<textarea className="cp-admin-input source-code" rows={6} value={sample} onChange={e=>{setSample(e.target.value);setPreview(undefined)}}/></label><button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={actions.busy} onClick={()=>void testSample()}>Extract sample</button>{sampleError?<p role="alert">{sampleError}</p>:null}{preview!==undefined?<><p role="status">Sample only. No API call or policy decision.</p><pre>{JSON.stringify(preview,null,2)}</pre></>:null}</details></section>;
}
