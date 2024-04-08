const { spawn } = require('node:child_process');
const { tunnel, install, bin } = require('cloudflared');
const wait = require('wait-on');

(async function () {
  try {
    process.env.VERBOSE = 'true';
    await install(bin);
    spawn(bin, ['--version'], { stdio: 'inherit', shell: true });
    await wait({ resources: ['http://localhost:8787'], timeout: 10_000 });
    const { url, connections, child, stop } = tunnel({ '--url': 'localhost:8787' });

    // show the url
    const link = await url;
    console.info('LINK:', link);
    // wait for the all 4 connections to be established
    const conns = await Promise.all(connections);

    // show the connections
    console.log('Connections Ready!', conns);

    child.on('exit', (code) => {
      console.log('tunnel process exited with code', code);
    });

    process.on('SIGINT', function () {
      console.info('Ctrl-C...');
      stop();
      process.exit(0);
    });

    await wait({ resources: [link], timeout: 60_000 });

    const response = await fetch(`${link}/install`);
    const data = await response.json();
    console.log('Bot registered', data);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
