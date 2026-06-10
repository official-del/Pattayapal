const baseUrl = (process.env.SMOKE_BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '');
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 8000);

const checks = [
  { name: 'health', path: '/api/health', statuses: [200] },
  { name: 'ready', path: '/api/ready', statuses: [200] },
  { name: 'works', path: '/api/works', statuses: [200] },
  { name: 'categories', path: '/api/categories', statuses: [200] },
  { name: 'posts', path: '/api/posts', statuses: [200] },
];

const request = async (check) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${check.path}`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    const text = await response.text();
    const ok = check.statuses.includes(response.status);
    return {
      ...check,
      ok,
      status: response.status,
      body: text.slice(0, 160),
    };
  } catch (error) {
    return {
      ...check,
      ok: false,
      status: 'ERR',
      body: error.message,
    };
  } finally {
    clearTimeout(timer);
  }
};

console.log(`Running Backend smoke test against ${baseUrl}`);

const results = [];
for (const check of checks) {
  const result = await request(check);
  results.push(result);
  const marker = result.ok ? 'PASS' : 'FAIL';
  console.log(`${marker} ${result.name} ${check.path} -> ${result.status}`);
  if (!result.ok && result.body) {
    console.log(`  ${result.body}`);
  }
}

const failed = results.filter((result) => !result.ok);
if (failed.length > 0) {
  console.error(`Smoke test failed: ${failed.length}/${results.length} checks failed.`);
  process.exit(1);
}

console.log(`Smoke test passed: ${results.length}/${results.length} checks passed.`);
