import { httpClient } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
export type SourceConfig = { name: string; base_url: string; auth_type: 'none'|'bearer'|'api_key'; api_key_header?: string; timeout_millis: number; cache_ttl_seconds: number; enabled: boolean };
export type Parameter = { name: string; in: 'path'|'query'; from: 'subject_id'|'issuer'|'resource_id'|'argument'; pointer?: string };
export type Attribute = { name: string; pointer: string; type: string };
export type BindingConfig = { name: string; server_id: string; tool_name: string; entity: 'subject'|'resource'; entity_type: string; path: string; parameters: Parameter[]; attributes: Attribute[] };
export type BindingVersion = BindingConfig & { source_revision: number; schema_sha256: string };
export type Binding = { id: string; revision: number; draft?: BindingVersion; approved?: BindingVersion };
export type Source = SourceConfig & { id: string; revision: number; config_revision: number; credential_configured: boolean; bindings: Binding[] };
export type Operation = { operation_id: string; path: string; summary: string; issue?: string; parameters: { name:string; in:'path'|'query'; required:boolean; type:string }[]; fields: { pointer:string; type:string }[] };
export const sourceKey = (s: EnvironmentScope) => ['attribute-sources',s.userId,s.tenantId,s.environmentId] as const;
const path = (s: EnvironmentScope): `/v1/${string}` => `/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/attribute-sources`;
// Credentials travel only through the authenticated same-origin write operation.
export const sourceApi = {
 dependencies: (s:EnvironmentScope,id:string,signal:AbortSignal) => httpClient<{items:{agent_id:string;agent_name:string;policy_id:string;policy_name:string}[]}>(`/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/permission-dependencies?binding_id=${encodeURIComponent(id)}`,{signal}),
 list: (s:EnvironmentScope,signal:AbortSignal) => httpClient<{items:Source[]}>(path(s),{signal}),
 save: (s:EnvironmentScope,id:string|undefined,input:SourceConfig & {revision:number;credential?:string},signal:AbortSignal) => httpClient<Source>(`${path(s)}${id?`/${id}`:''}`,{method:id?'PUT':'POST',json:input,signal}),
 remove: (s:EnvironmentScope,source:Source,signal:AbortSignal) => httpClient<void>(`${path(s)}/${source.id}`,{method:'DELETE',json:{revision:source.revision},signal}),
 binding: (s:EnvironmentScope,source:Source,id:string|undefined,action:'draft'|'approve'|'discard'|'retire',config:BindingConfig|undefined,signal:AbortSignal) => httpClient<Source>(`${path(s)}/${source.id}/bindings${id?`/${id}/${action}`:''}`,{method:id&&action==='draft'?'PUT':'POST',json:{revision:source.revision,...(config?{config}:{})},signal}),
 import: (s:EnvironmentScope,document:string,signal:AbortSignal) => httpClient<{operations:Operation[]}>(`${path(s)}/import-openapi`,{method:'POST',json:{document},signal}),
 preview: (s:EnvironmentScope,id:string,sample:unknown,attributes:Attribute[],signal:AbortSignal) => httpClient<{sample_only:true;values:unknown}>(`${path(s)}/${id}/preview`,{method:'POST',json:{sample,attributes},signal}),
};
