import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '../../api/http-client';
import { sourceApi, sourceKey, type Source } from './api';
import type { EnvironmentScope } from '../access/environment-scope';

export function useSources(scope:EnvironmentScope) {
 const client=useQueryClient();
 const query=useQuery({queryKey:sourceKey(scope),queryFn:({signal})=>sourceApi.list(scope,signal),staleTime:Infinity,refetchOnWindowFocus:false});
 const controller=useRef<AbortController|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>()=>controller.current?.abort(),[]);
 async function run<T>(operation:(signal:AbortSignal)=>Promise<T>):Promise<T|undefined>{
  if(controller.current)return;
  const current=new AbortController();controller.current=current;setBusy(true);setError('');
  try{return await operation(current.signal)}catch(cause){if(!current.signal.aborted)setError(cause instanceof HttpError&&cause.status===409?'This configuration changed. Reload before reviewing again.':cause instanceof HttpError&&cause.status===400?'Check the fields, source credentials and approved tool selection.':'The request failed. Check your connection and retry.');return undefined}
  finally{if(!current.signal.aborted){setBusy(false);controller.current=null}}
 }
 function saved(source:Source){client.setQueryData<{items:Source[]}>(sourceKey(scope),old=>({items:old?.items.some(s=>s.id===source.id)?old.items.map(s=>s.id===source.id?source:s):[...(old?.items??[]),source]}))}
 function removed(id:string){client.setQueryData<{items:Source[]}>(sourceKey(scope),old=>({items:(old?.items??[]).filter(s=>s.id!==id)}))}
 return {...query,sources:query.data?.items??[],busy,error,run,saved,removed};
}
export type SourceActions=ReturnType<typeof useSources>;
