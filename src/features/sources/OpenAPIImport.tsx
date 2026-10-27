import { usePendingChanges } from "../auth/pending/PendingChanges";
import { useState } from 'react';
import { sourceApi, type Operation } from './api';
import type { SourceActions } from './useSources';
import type { EnvironmentScope } from '../access/environment-scope';

export function OpenAPIImport({scope,actions,onChoose}:{scope:EnvironmentScope;actions:SourceActions;onChoose:(operation:Operation)=>void}){
 const [document,setDocument]=useState(''),[operations,setOperations]=useState<Operation[]>([]),[error,setError]=useState('');
 usePendingChanges(!!document);
 async function read(file:File|undefined){if(!file)return;if(file.size>1<<20){setError('Use a JSON or YAML document up to 1 MiB.');return}setDocument(await file.text());setOperations([]);setError('')}
 async function inspect(){setError('');setOperations([]);const result=await actions.run(signal=>sourceApi.import(scope,document,signal));if(result)setOperations(result.operations)}
 return <details className="source-import"><summary>Import an OpenAPI description</summary><p>Upload or paste OpenAPI 3 JSON/YAML. Import proposes GET operations; it does not call or approve their servers.</p><label>OpenAPI file<input type="file" accept=".json,.yaml,.yml" disabled={actions.busy} onChange={e=>void read(e.target.files?.[0])}/></label><label>Document<textarea className="cp-admin-input source-code" rows={6} value={document} onChange={e=>{setDocument(e.target.value);setOperations([])}}/></label>{error?<p role="alert">{error}</p>:null}<button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={actions.busy||!document} onClick={()=>void inspect()}>Inspect GET operations</button>
 {operations.length?<ul className="source-operation-list">{operations.map((operation,i)=><li key={`${operation.path}:${i}`}><strong>GET {operation.path}</strong><small>{operation.summary||operation.operation_id}</small>{operation.issue?<p role="status">{operation.issue}. Configure a supported operation manually.</p>:<button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={()=>onChoose(operation)}>Use this operation</button>}</li>)}</ul>:null}</details>;
}
