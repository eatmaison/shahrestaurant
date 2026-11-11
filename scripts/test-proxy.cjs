/* eslint-disable @typescript-eslint/no-require-imports -- Node regression harness uses the installed NextRequest class. */
/* No network or database calls: only event access is isolated from the real proxy module. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const root=process.cwd(),fromApp=createRequire(path.join(root,'package.json')),ts=fromApp('typescript'),{NextRequest}=fromApp('next/server');
let guardCalls=0;
function evaluate(source,imports){const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const evaluatedModule={exports:{}};new Function('require','module','exports',output)(id=>{if(!(id in imports))throw new Error('Unexpected import '+id);return imports[id];},evaluatedModule,evaluatedModule.exports);return evaluatedModule.exports;}
const locale=evaluate(fs.readFileSync(path.join(root,'app/lib/locale.ts'),'utf8'),{});
const sourcePath=process.argv[2]||path.join(root,'proxy.ts');
const {proxy}=evaluate(fs.readFileSync(sourcePath,'utf8'),{'next/server':fromApp('next/server'),'./app/lib/eventAccess':{hasEventAdminAccess:async()=>{guardCalls++;return false;}},'./app/lib/locale':locale});
function request(url,method='GET'){return new NextRequest(url,{method,headers:{host:new URL(url).host}});}
(async()=>{let failed=0,passed=0;const cases=[
['https://shahrestaurant.nl/en/?q=a%20b&ref=x','https://shahrestaurant.nl/en?q=a%20b&ref=x'],
['https://shahrestaurant.nl/menukaart/','https://shahrestaurant.nl/menukaart'],
['https://shahrestaurant.nl/privacy/','https://shahrestaurant.nl/privacy'],
['https://shahrestaurant.nl/order/?q=butter%20chicken','https://shahrestaurant.nl/menukaart?q=butter%20chicken'],
['https://www.shahrestaurant.nl/ORDER/?q=x','https://shahrestaurant.nl/menukaart?q=x'],
['https://shahrestaurant.nl/en/menu/','https://shahrestaurant.nl/en/menu'],
['https://shahrestaurant.nl/api/webhook/?id=example','https://shahrestaurant.nl/api/webhook?id=example','POST']];
for(const [url,expected,method]of cases){try{const response=await proxy(request(url,method));assert.equal(response.status,308);assert.equal(response.headers.get('location'),expected);assert.notEqual(response.headers.get('location'),url,'No self redirect');passed++;}catch(e){failed++;console.log('FAIL',new URL(url).pathname,e.code||e.name);}}
for(const pathName of ['/en','/menukaart','/privacy']){try{const response=await proxy(request('https://shahrestaurant.nl'+pathName));assert.equal(response.status,200);assert.equal(response.headers.get('location'),null);passed++;}catch(e){failed++;console.log('FAIL canonical',pathName,e.code||e.name);}}
try{assert.equal(guardCalls,0);assert.equal((await proxy(request('https://shahrestaurant.nl/events'))).status,404);assert.equal((await proxy(request('https://shahrestaurant.nl/api/parties'))).status,403);assert.equal(guardCalls,2);assert.equal((await proxy(request('https://shahrestaurant.nl/api/parties/webhook','POST'))).status,200);assert.equal(guardCalls,2);assert.equal((await proxy(request('https://private.shahrestaurant.nl/'))).status,404);passed++;}catch(e){failed++;console.log('FAIL event security',e.code||e.name);}
console.log(JSON.stringify({passed,failed,realNextRequest:true,networkCalls:0,databaseCalls:0,sourcePath}));process.exitCode=failed?1:0;})();
