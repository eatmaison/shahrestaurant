import { loadConfig } from '../src/config.mjs';
const config=loadConfig();
console.log(JSON.stringify({enabled:config.enabled,ready:config.ready,missing:config.missing,allowedNumberCount:config.allowedNumbers.length,emailConfigured:!!(config.resendKey&&config.emailFrom),transferConfigured:!!config.transferNumber},null,2));
if(config.enabled&&!config.ready)process.exitCode=1;
