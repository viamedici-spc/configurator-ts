import {test,afterAll as after} from 'vitest';
import assert from 'node:assert/strict';
import {SessionFactory,ConfigurationModelSourceType,AttributeType,GlobalAttributeIdKeyBuilder,isActiveAttributesSession} from '../../../src';
const original=globalThis.fetch;after(()=>{globalThis.fetch=original;});
const empty=()=>({booleanDecisions:[],numericDecisions:[],componentDecisions:[],choiceValueDecisions:[]});
const booleanDecisions=(localId:string,state:boolean)=>({...empty(),booleanDecisions:[{attributeId:{localId},state,kind:'Explicit'}]});
const consequence=(ids:string[],satisfied=false)=>({isConfigurationSatisfied:satisfied,canAttributeContributeToConfigurationSatisfaction:ids.map(localId=>({localId})),booleanConsequences:ids.map(localId=>({attributeId:{localId},isSatisfied:satisfied,selection:'Mandatory',possibleDecisionStates:[true,false],isPossibleDecisionStatesImmutable:false})),choiceConsequences:[],numericConsequences:[],componentConsequences:[]});
let serial=0;
type BatchFixture={
 write:()=>Response;
 readDecisions:()=>Response|Promise<Response>;
 readConsequences:()=>Response|Promise<Response>;
};
async function fixture(batch?:BatchFixture,scopeSatisfaction:boolean|null=true){
 const calls:Array<{path:string;method:string;body:any;headers:Headers}>=[];let count=0,full=false,firstScopeResolve:()=>void=()=>{},hold=false,missing=false,unsupported=false,attributeMissing=false,batchWritten=false;
 let gate=Promise.resolve();
 globalThis.fetch=async(input:any,init:any)=>{
  const path=new URL(String(input)).pathname,method=init?.method??'GET',body=init?.body?JSON.parse(String(init.body)):null,headers=new Headers(init?.headers);calls.push({path,method,body,headers});
  if(path.endsWith('/v2/session')&&method==='POST')return Response.json({sessionId:'session-'+(++count)});
  if(path.endsWith('/active-attributes')){
   if(attributeMissing)return Response.json({type:'AttributeNotFound',detail:'Attribute was removed'},{status:404});
   if(unsupported)return Response.json({detail:'unknown operation'},{status:405});
   if(missing){missing=false;return Response.json({type:'SessionNotFound',title:'Session missing',detail:'Expired session'},{status:404});}
   if(hold){hold=false;await gate;}
   if(method==='DELETE')full=true;
   return Response.json({consequences:{...consequence(method==='DELETE'?['A','B']:body.activeAttributes.map((id:any)=>id.localId),true),isConfigurationSatisfied:method==='DELETE'?true:scopeSatisfaction},affectedDecisions:empty()});
  }
  if(path.endsWith('/consequence'))return batchWritten&&batch?batch.readConsequences():Response.json(consequence(['A','B'],full));
  if(path.endsWith('/decision')&&method==='GET')return batchWritten&&batch?batch.readDecisions():Response.json(empty());
  if(path.endsWith('/decision')&&method==='PUT')return Response.json({consequences:consequence(['A'],true),affectedDecisions:{...empty(),booleanDecisions:[{attributeId:{localId:'A'},state:true,kind:'Explicit'}]}});
  if(path.endsWith('/decision/many')){
   batchWritten=true;
   return batch?.write()??Response.json({consequences:consequence(['A','B'],true),affectedDecisions:empty(),rejectedDecisions:empty()});
  }
  if(method==='DELETE')return new Response(null,{status:204});
  throw new Error('Unexpected request '+method+' '+path);
 };
 const session=await SessionFactory.createSession({apiBaseUrl:'https://engine.test/case-'+(++serial),sessionInitialisationOptions:{accessToken:'test-only'},configurationModelSource:{type:ConfigurationModelSourceType.Channel,channel:'test',deploymentName:'root'}});
 if(!isActiveAttributesSession(session))throw new Error('Expected active attributes support from the native factory.');
 return {session,calls,hold(){hold=true;gate=new Promise<void>(resolve=>{firstScopeResolve=resolve;});},release(){firstScopeResolve();},missing(){missing=true;},unsupported(){unsupported=true;},attributeMissing(){attributeMissing=true;}};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const scopes=(calls:any[])=>calls.filter(call=>call.path.endsWith('/active-attributes'));
test('unknown configuration satisfaction replaces a prior boolean and reaches subscribers',async()=>{
 const f=await fixture(undefined,null);
 const seen:unknown[][]=[];
 const subscription=f.session.addConfigurationChangedListener((value,changes)=>{
  seen.push([value.isSatisfied,changes.isSatisfied,changes.satisfactionChanged]);
 });
 try{
  await f.session.makeDecision({type:AttributeType.Boolean,attributeId:{localId:'A'},state:true});
  assert.equal(f.session.getConfiguration().isSatisfied,true);
  const before=f.calls.length;
  await f.session.setActiveAttributes([{localId:'A'}]);
  assert.equal(f.session.getConfiguration().isSatisfied,null);
  assert.deepEqual(seen.at(-1),[null,null,true]);
  assert.equal(f.session.getConfigurationChanges().satisfactionChanged,true);
  assert.deepEqual(f.calls.slice(before).map(call=>call.method),['POST']);
  await f.session.setActiveAttributes(null);
  assert.equal(f.session.getConfiguration().isSatisfied,true);
  assert.deepEqual(seen.at(-1),[true,true,undefined]);
 }finally{subscription.unsubscribe();await f.session.close();}
});
test('scope DELETE applies its own consequences without refetching decisions or consequences',async()=>{
 const f=await fixture();try{
  const key=GlobalAttributeIdKeyBuilder({localId:'B'});assert.equal(f.session.getConfiguration().attributes.get(key)?.isSatisfied,false);
  await f.session.setActiveAttributes([{localId:'A'}]);assert.equal(f.session.getConfiguration().attributes.size,2,'Inactive cached attributes are retained.');assert.equal(f.session.getConfiguration().attributes.get(key)?.isSatisfied,false);
  await f.session.makeDecision({type:AttributeType.Boolean,attributeId:{localId:'A'},state:true});
  await f.session.setActiveAttributes(null);assert.equal(f.session.getConfiguration().attributes.get(key)?.isSatisfied,true);assert.equal(f.session.getActiveAttributes(),null);
  assert.ok(f.session.getDecisions().some(decision=>decision.attributeId.localId==='A'&&decision.state===true),'An unaffected explicit decision stays selected.');
  assert.equal(f.calls.at(-1)?.method,'DELETE');
  assert.ok(f.calls.at(-1)?.path.endsWith('/active-attributes'));
  assert.deepEqual(scopes(f.calls).map(call=>call.method),['POST','DELETE']);assert.equal(scopes(f.calls)[0].body.activeAttributes[0].localId,'A');assert.equal(scopes(f.calls)[1].body,null);assert.ok(scopes(f.calls).every(call=>call.headers.get('X-SESSION-ID')==='session-1'));
 }finally{await f.session.close();}
});
test('a scoped decision batch confirms while both engine snapshots refresh in the background',async()=>{
 let releaseRead=()=>{};
 const reply=new Promise<void>(resolve=>{releaseRead=resolve;});
 const rejected={type:AttributeType.Boolean,attributeId:{localId:'A'},state:false} as const;
 const accepted={type:AttributeType.Boolean,attributeId:{localId:'B'},state:false} as const;
 const f=await fixture({
  write:()=>Response.json({consequences:consequence(['A']),affectedDecisions:empty(),rejectedDecisions:booleanDecisions('A',false)}),
  readDecisions:async()=>{await reply;return Response.json(booleanDecisions('B',false));},
  readConsequences:()=>Response.json(consequence(['A'],true))
 });
 try{
  await f.session.setActiveAttributes([{localId:'A'}]);
  await f.session.makeDecision({...rejected,state:true});
  const before=f.calls.length;
  let confirmed=false;
  const pending=f.session.setMany([accepted,rejected],{type:'DropExistingDecisions',conflictHandling:{type:'Automatic'}})
   .then(result=>{confirmed=true;return result;});
  await tick();
  const calls=f.calls.slice(before).map(call=>call.method+' '+call.path.split('/configuration/')[1]);
  assert.equal(calls[0],'PUT decision/many');
  assert.deepEqual(calls.slice(1).sort(),['GET consequence','GET decision']);
  assert.equal(confirmed,true);
  assert.equal(f.session.getPendingOperationCount(),0);
  assert.equal(f.session.getScopedDecisionRefreshState?.().status,'refreshing');
  assert.ok(f.session.getDecisions().some(decision=>decision.attributeId.localId==='A'));
  assert.deepEqual((await pending).rejectedDecisions.map(d=>[d.type,d.attributeId.localId,d.state]),[['Boolean','A',false]]);
  releaseRead();
  await tick();
  assert.equal(f.session.getScopedDecisionRefreshState?.().status,'idle');
  assert.deepEqual(f.session.getDecisions().map(decision=>[decision.attributeId.localId,decision.state]),[['B',false]]);
  const configuration=f.session.getConfiguration();
  assert.equal(configuration.isSatisfied,true);
  const a=configuration.attributes.get(GlobalAttributeIdKeyBuilder({localId:'A'}));
  const b=configuration.attributes.get(GlobalAttributeIdKeyBuilder({localId:'B'}));
  assert.ok(a?.type===AttributeType.Boolean&&b?.type===AttributeType.Boolean);
  assert.equal(a.decision,null);
  assert.equal(b.decision?.state,false);
  assert.deepEqual(f.session.getActiveAttributes(),[{localId:'A'}]);
 }finally{releaseRead();await f.session.close();}
});
test('only a bulk write with a restricted scope needs the extra snapshot reads',async()=>{
 const f=await fixture();
 const decision={type:AttributeType.Boolean,attributeId:{localId:'A'},state:true} as const;
 try{
  let before=f.calls.length;
  await f.session.makeManyDecisions([decision],{type:'KeepExistingDecisions'});
  assert.deepEqual(f.calls.slice(before).map(call=>call.method),['PUT']);
  await f.session.setActiveAttributes([]);
  before=f.calls.length;
  await f.session.makeManyDecisions([],{type:'KeepExistingDecisions'});
  assert.equal(f.calls.length,before);
  await f.session.makeManyDecisions([decision],{type:'KeepExistingDecisions'});
  assert.deepEqual(f.calls.slice(before).map(call=>call.method),['PUT','GET','GET']);
 }finally{await f.session.close();}
});
test('a failed snapshot read retains the accepted batch response without replaying the write',async()=>{
 let failRead=true;
 const f=await fixture({
  write:()=>Response.json({consequences:consequence(['A'],true),affectedDecisions:booleanDecisions('A',true),rejectedDecisions:empty()}),
  readDecisions:()=>Response.json(booleanDecisions('A',true)),
  readConsequences:()=>failRead
   ? Response.json({type:'InternalServerError',title:'Read failed',detail:'Read failed'},{status:500})
   : Response.json(consequence(['A'],true))
 });
 try{
  await f.session.setActiveAttributes([{localId:'A'}]);
  const before=f.calls.length;
  const result=await f.session.makeManyDecisions([{type:AttributeType.Boolean,attributeId:{localId:'A'},state:true}],{type:'KeepExistingDecisions'});
  assert.deepEqual(result.rejectedDecisions,[]);
  await tick();
  assert.deepEqual(f.calls.slice(before).filter(call=>call.method==='PUT').map(call=>call.path.split('/configuration/')[1]),['decision/many']);
  assert.ok(f.session.getDecisions().some(decision=>decision.attributeId.localId==='A'&&decision.state===true));
  assert.equal(f.session.getPendingOperationCount(),0);
  assert.equal(f.session.getScopedDecisionRefreshState?.().status,'error');
  failRead=false;
  f.session.retryScopedDecisionRefresh?.();
  assert.equal(f.session.getScopedDecisionRefreshState?.().status,'refreshing');
  await tick();
  assert.equal(f.session.getScopedDecisionRefreshState?.().status,'idle');
  assert.equal(f.calls.slice(before).filter(call=>call.method==='PUT').length,1);
 }finally{await f.session.close();}
});
test('a newer decision can finish during refresh and stale snapshots never overwrite it',async()=>{
 let releaseRead=()=>{};
 const reply=new Promise<void>(resolve=>{releaseRead=resolve;});
 let reads=0;
 const decision={type:AttributeType.Boolean,attributeId:{localId:'A'},state:true} as const;
 const f=await fixture({
  write:()=>Response.json({consequences:consequence(['A']),affectedDecisions:empty(),rejectedDecisions:empty()}),
  readDecisions:async()=>{
   if(++reads===1){await reply;return Response.json(booleanDecisions('B',false));}
   return Response.json(booleanDecisions('A',true));
  },
  readConsequences:()=>Response.json(consequence(['A'],true))
 });
 try{
  await f.session.setActiveAttributes([{localId:'A'}]);
  await f.session.makeManyDecisions([{...decision,state:false}],{type:'KeepExistingDecisions'});
  let laterCompleted=false;
  const later=f.session.makeDecision(decision).then(()=>{laterCompleted=true;});
  await tick();
  assert.equal(laterCompleted,true);
  await later;
  releaseRead();
  await tick();
  assert.equal(reads,2,'The obsolete read is replaced with a snapshot of the latest confirmed state.');
  assert.deepEqual(f.session.getDecisions().map(d=>[d.attributeId.localId,d.state]),[['A',true]]);
 }finally{releaseRead();await f.session.close();}
});
test('clearing a scope supersedes the background refresh and its late response',async()=>{
 let releaseRead=()=>{};
 const reply=new Promise<void>(resolve=>{releaseRead=resolve;});
 const f=await fixture({
  write:()=>Response.json({consequences:consequence(['A']),affectedDecisions:empty(),rejectedDecisions:empty()}),
  readDecisions:async()=>{await reply;return Response.json(booleanDecisions('B',false));},
  readConsequences:()=>Response.json(consequence(['A'],false))
 });
 try{
  await f.session.setActiveAttributes([{localId:'A'}]);
  await f.session.setMany([{type:AttributeType.Boolean,attributeId:{localId:'A'},state:true}],{type:'KeepExistingDecisions'});
  assert.equal(f.session.getScopedDecisionRefreshState?.().status,'refreshing');
  await f.session.setActiveAttributes(null);
  assert.equal(f.session.getScopedDecisionRefreshState?.().status,'idle');
  releaseRead();
  await tick();
  assert.equal(f.session.getConfiguration().isSatisfied,true);
  assert.equal(f.session.getDecisions().length,0);
 }finally{releaseRead();await f.session.close();}
});
test('rapid changes keep the latest target and skip obsolete queued scopes without racing a running request',async()=>{
 const f=await fixture();try{f.hold();const first=f.session.setActiveAttributes([{localId:'A'}]);await tick();const obsolete=f.session.setActiveAttributes([{localId:'B'}]),latest=f.session.setActiveAttributes(null);assert.equal(scopes(f.calls).length,1);f.release();await Promise.all([first,obsolete,latest]);assert.deepEqual(scopes(f.calls).map(call=>call.method),['POST','DELETE']);assert.equal(f.session.getPendingOperationCount(),0);}finally{f.release();await f.session.close();}
});
test('decisions made during a scope update queue safely and publish pending status until the engine settles',async()=>{
 const f=await fixture(),counts:number[]=[];const subscription=f.session.addPendingOperationsChangedListener(()=>counts.push(f.session.getPendingOperationCount()));
 try{f.hold();const scope=f.session.setActiveAttributes([{localId:'A'}]);await tick();const decision=f.session.makeDecision({type:AttributeType.Boolean,attributeId:{localId:'A'},state:true});assert.equal(f.calls.filter(call=>call.method==='PUT').length,0);assert.equal(f.session.getPendingOperationCount(),2);f.release();await Promise.all([scope,decision]);assert.deepEqual(f.calls.filter(call=>call.method==='PUT'||call.path.endsWith('/active-attributes')).map(call=>call.method),['POST','PUT']);assert.equal(counts.at(-1),0);assert.equal(f.session.getDecisions().some(decision=>decision.attributeId.localId==='A'),true);}finally{subscription.unsubscribe();f.release();await f.session.close();}
});
test('reinitialization reapplies active attributes, while a changed model context starts unrestricted',async()=>{
 const f=await fixture();try{await f.session.setActiveAttributes([{localId:'A'}]);await f.session.reinitialize();assert.equal(scopes(f.calls).length,2);assert.equal(scopes(f.calls).at(-1)?.headers.get('X-SESSION-ID'),'session-2');await f.session.setSessionContext({...f.session.getSessionContext(),deploymentName:'ignored',disableConfigurationModelTrimming:true} as any);assert.equal(f.session.getActiveAttributes(),null);assert.equal(scopes(f.calls).length,2);}finally{await f.session.close();}
});
test('SessionNotFound stays a session recovery error and is not mistaken for an unsupported AA endpoint',async()=>{
 const f=await fixture();try{f.missing();await f.session.setActiveAttributes([{localId:'A'}]);assert.ok(f.calls.filter(call=>call.path.endsWith('/v2/session')&&call.method==='POST').length>=2);assert.equal(f.session.getActiveAttributes()?.[0].localId,'A');}finally{await f.session.close();}
});
test('older engines report unsupported AA without replacing cached data or hanging pending operations',async()=>{
 const f=await fixture();try{const before=f.session.getConfiguration();f.unsupported();await assert.rejects(()=>f.session.setActiveAttributes([{localId:'A'}]),(error:any)=>error.activeAttributesUnsupported===true);assert.deepEqual(f.session.getConfiguration(),before);assert.equal(f.session.getPendingOperationCount(),0);}finally{await f.session.close();}
});
test('decisions reuse the confirmed scope and equivalent repeated active sets issue no HTTP requests',async()=>{
 const f=await fixture();try{
  await f.session.setActiveAttributes([{localId:'A'},{localId:'B'}]);const before=scopes(f.calls).length;
  await f.session.makeDecision({type:AttributeType.Boolean,attributeId:{localId:'A'},state:true});
  await f.session.makeManyDecisions([{type:AttributeType.Boolean,attributeId:{localId:'B'},state:false}],{type:'DropExistingDecisions',conflictHandling:{type:'Automatic'}});
  await f.session.setActiveAttributes([{localId:'B'},{localId:'A'},{localId:'A'}]);
  assert.equal(scopes(f.calls).length,before);assert.equal(f.session.getActiveAttributes()!.length,2);
  await f.session.setActiveAttributes(null);await f.session.setActiveAttributes(null);assert.equal(scopes(f.calls).length,before+1);
 }finally{await f.session.close();}
});
test('an uncertain failed scope change must still send a retry of the last confirmed set',async()=>{
 const f=await fixture();try{await f.session.setActiveAttributes([{localId:'A'}]);f.unsupported();await assert.rejects(()=>f.session.setActiveAttributes([{localId:'B'}]));const before=scopes(f.calls).length;await assert.rejects(()=>f.session.setActiveAttributes([{localId:'A'}]));assert.equal(scopes(f.calls).length,before+1);}finally{await f.session.close();}
});

test('typed attribute 404 responses retain their domain error rather than claiming unsupported AA',async()=>{
 const f=await fixture();try{f.attributeMissing();await assert.rejects(()=>f.session.setActiveAttributes([{localId:'A'}]),(error:any)=>!error.activeAttributesUnsupported);}finally{await f.session.close();}
});
test('fresh-context recovery clears an old active set and replays explicit decisions without replaying AA',async()=>{
 const f=await fixture();try{await f.session.makeDecision({type:AttributeType.Boolean,attributeId:{localId:'A'},state:true});await f.session.setActiveAttributes([{localId:'A'}]);f.unsupported();await assert.rejects(()=>f.session.setActiveAttributes(null));const before=scopes(f.calls).length,context=f.session.getSessionContext();await f.session.setSessionContext(context);assert.equal(scopes(f.calls).length,before);assert.equal(f.session.getActiveAttributes(),null);assert.equal(f.session.getSessionContext(),context);assert.ok(f.calls.some(call=>call.path.includes('/decision/many')&&JSON.stringify(call.body).includes('A')),'explicit decisions must be replayed in the new unrestricted session');}finally{await f.session.close();}
});
