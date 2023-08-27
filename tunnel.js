const { tunnel } = require('cloudflared');

(async function () {
  try {
    const { url, connections, child, stop } = tunnel({ '--url': 'localhost:8787' });

    // show the url
    const link = await url;
    console.log('LINK:', link);
    // wait for the all 4 connections to be established
    const conns = await Promise.all(connections);

    // show the connections
    console.log('Connections Ready!', conns);

    child.on('exit', (code) => {
      console.log('tunnel process exited with code', code);
    });

    process.on('SIGINT', function () {
      console.log('Ctrl-C...');
      stop()
      process.exit(0);
    });
    
    const { default: open } = await import('open');
    await open(`${link}/install`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
