import {createServer} from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.HBM_PREVIEW_PORT||5180);
createServer((req,res)=>{const url=new URL(req.url,'http://localhost');const file=resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));if(!file.startsWith(root)||!existsSync(file)){res.writeHead(404);return res.end('Not found')}res.setHeader('Content-Type',{'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'}[extname(file)]||'text/plain');res.end(readFileSync(file))}).listen(port,'127.0.0.1',()=>console.log(`HBM Lab: http://127.0.0.1:${port}`));
