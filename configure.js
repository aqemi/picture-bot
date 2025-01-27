const { readFileSync } = require('node:fs');

(async function () {
  try {
    const deployment = readFileSync('.deployment', 'utf-8');
    const [url] = deployment.match(/https?:\/\/[a-zA-Z0-9-./]+/) ?? [];
    if (!url) {
      throw new Error('Deployment url not found');
    }
    
    const response = await fetch(`${url}/install`);
    const result = await response.json();
    console.info(result);
  } catch (error) {
    console.error(error);
  }
})();


