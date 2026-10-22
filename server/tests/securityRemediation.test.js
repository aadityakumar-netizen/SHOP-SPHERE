import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';
import env from '../src/config/env.js';
import { signToken, verifyToken } from '../src/utils/jwt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRootDir = path.resolve(__dirname, '..');

console.log('===============================================================');
console.log('  ShopSphere Security Remediation Test Suite (High Findings)   ');
console.log('===============================================================');

let passedCount = 0;
let failedCount = 0;

function report(description, fn) {
  try {
    fn();
    console.log(`  ✓ PASSED: ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ FAILED: ${description}`);
    console.error(`    ${err.message}`);
    failedCount++;
  }
}

async function asyncReport(description, fn) {
  try {
    await fn();
    console.log(`  ✓ PASSED: ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ FAILED: ${description}`);
    console.error(`    ${err.message}`);
    failedCount++;
  }
}

// -------------------------------------------------------------
// SECTION 1: JWT Secret Configuration & Fail-Safe Startup Guards
// -------------------------------------------------------------
console.log('\n[1. JWT Startup Guards & Insecure Fallback Rejection]');

function runConfigCheckWithEnv(envOverrides) {
  const runnerScript = `
    import('./src/config/env.js')
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err.message);
        process.exit(1);
      });
  `;

  const childEnv = { ...process.env, ...envOverrides };
  const res = spawnSync(process.execPath, ['--input-type=module', '-e', runnerScript], {
    cwd: serverRootDir,
    env: childEnv,
    encoding: 'utf-8',
  });

  return {
    status: res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
  };
}

report('Startup Guard: Rejects missing/empty JWT_SECRET with exit code 1', () => {
  const res = runConfigCheckWithEnv({ JWT_SECRET: '' });
  assert.strictEqual(res.status, 1, 'Process should exit with non-zero code when JWT_SECRET is empty');
  assert.ok(
    res.stderr.includes('[FATAL CONFIG ERROR] JWT_SECRET environment variable is missing or empty'),
    `Stderr should contain fatal error message, got: ${res.stderr}`
  );
});

report('Startup Guard: Rejects known insecure fallback secret (shopsphere_dev_jwt_secret_key_change_me_in_production)', () => {
  const res = runConfigCheckWithEnv({
    JWT_SECRET: 'shopsphere_dev_jwt_secret_key_change_me_in_production',
  });
  assert.strictEqual(res.status, 1, 'Process should exit with code 1 for known fallback');
  assert.ok(
    res.stderr.includes('[FATAL CONFIG ERROR] Insecure fallback or placeholder JWT_SECRET detected'),
    `Stderr should contain fallback rejection message, got: ${res.stderr}`
  );
});

report('Startup Guard: Rejects example placeholder secret (your_jwt_secret_key_change_in_production)', () => {
  const res = runConfigCheckWithEnv({
    JWT_SECRET: 'your_jwt_secret_key_change_in_production',
  });
  assert.strictEqual(res.status, 1, 'Process should exit with code 1 for placeholder');
  assert.ok(
    res.stderr.includes('[FATAL CONFIG ERROR] Insecure fallback or placeholder JWT_SECRET detected'),
    `Stderr should contain fallback rejection message, got: ${res.stderr}`
  );
});

report('Startup Guard: Rejects replacement placeholder secret (replace_with_a_secure_random_jwt_secret_key)', () => {
  const res = runConfigCheckWithEnv({
    JWT_SECRET: 'replace_with_a_secure_random_jwt_secret_key',
  });
  assert.strictEqual(res.status, 1, 'Process should exit with code 1 for placeholder');
  assert.ok(
    res.stderr.includes('[FATAL CONFIG ERROR] Insecure fallback or placeholder JWT_SECRET detected'),
    `Stderr should contain fallback rejection message, got: ${res.stderr}`
  );
});

report('Startup Guard: Succeeds cleanly when a valid, unique secret is configured', () => {
  const validSecret = 'test_secure_random_jwt_secret_key_for_automated_testing_12345';
  const res = runConfigCheckWithEnv({ JWT_SECRET: validSecret });
  assert.strictEqual(res.status, 0, `Process should exit cleanly (0), got status ${res.status}: ${res.stderr}`);
  assert.strictEqual(res.stderr.trim(), '', 'No fatal config error should be emitted');
});

// -------------------------------------------------------------
// SECTION 2: JWT Signing, Verification & Algorithm Enforcement
// -------------------------------------------------------------
console.log('\n[2. JWT Signing & Algorithm Pinning (HS256)]');

report('JWT Token: Signs and verifies token payload correctly', () => {
  const testPayload = { id: 'usr_test_123', email: 'test@example.com', role: 'customer' };
  const token = signToken(testPayload, '1h');
  assert.ok(typeof token === 'string' && token.split('.').length === 3, 'Token should be a 3-part JWT');

  const decoded = verifyToken(token);
  assert.strictEqual(decoded.id, testPayload.id);
  assert.strictEqual(decoded.email, testPayload.email);
  assert.strictEqual(decoded.role, testPayload.role);
});

report('JWT Token: Header explicitly pins algorithm to HS256', () => {
  const token = signToken({ id: '123' }, '1h');
  const [headerB64] = token.split('.');
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf-8'));
  assert.strictEqual(header.alg, 'HS256', `Algorithm should be HS256, got: ${header.alg}`);
});

// -------------------------------------------------------------
// SECTION 3: Strict CORS Origin Validation & Preflight Handling
// -------------------------------------------------------------
console.log('\n[3. Strict CORS Origin Validation & Preflight Handling]');

const baseUrl = `http://localhost:${env.PORT || 5000}`;

async function runCorsTests() {
  await asyncReport('CORS Allowed: Configured CLIENT_URL is permitted with credentials', async () => {
    const origin = env.CLIENT_URL;
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { Origin: origin },
    });
    assert.strictEqual(
      res.headers.get('access-control-allow-origin'),
      origin,
      'Allowed origin must receive exact match ACAO'
    );
    assert.strictEqual(
      res.headers.get('access-control-allow-credentials'),
      'true',
      'Credentials must be allowed for trusted origin'
    );
  });

  await asyncReport('CORS Allowed: Local dev origin http://localhost:5173 is permitted', async () => {
    const origin = 'http://localhost:5173';
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { Origin: origin },
    });
    assert.strictEqual(res.headers.get('access-control-allow-origin'), origin);
  });

  await asyncReport('CORS Allowed: Local dev origin http://127.0.0.1:5173 is permitted', async () => {
    const origin = 'http://127.0.0.1:5173';
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { Origin: origin },
    });
    assert.strictEqual(res.headers.get('access-control-allow-origin'), origin);
  });

  await asyncReport('CORS Allowed: Local dev origin http://localhost:3000 is permitted', async () => {
    const origin = 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { Origin: origin },
    });
    assert.strictEqual(res.headers.get('access-control-allow-origin'), origin);
  });

  await asyncReport('CORS Preflight: OPTIONS request from allowed origin returns 204 with allowed headers', async () => {
    const origin = 'http://localhost:5173';
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization, Content-Type',
      },
    });
    assert.strictEqual(res.status, 204, `Preflight should return 204 No Content, got: ${res.status}`);
    assert.strictEqual(res.headers.get('access-control-allow-origin'), origin);
    assert.strictEqual(res.headers.get('access-control-allow-credentials'), 'true');
    assert.ok(
      res.headers.get('access-control-allow-methods').includes('GET'),
      'Should include GET method'
    );
  });

  await asyncReport('CORS Rejected: Untrusted domain (http://evil-attacker.com) is NOT reflected in ACAO', async () => {
    const untrustedOrigin = 'http://evil-attacker.com';
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { Origin: untrustedOrigin },
    });
    assert.strictEqual(
      res.headers.get('access-control-allow-origin'),
      null,
      'Untrusted origin must not receive Access-Control-Allow-Origin header'
    );
    assert.strictEqual(
      res.headers.get('access-control-allow-credentials'),
      null,
      'Untrusted origin must not receive Access-Control-Allow-Credentials header'
    );
  });

  await asyncReport('CORS Preflight Rejected: OPTIONS from untrusted origin does NOT receive ACAO header', async () => {
    const untrustedOrigin = 'http://evil-attacker.com';
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: untrustedOrigin,
        'Access-Control-Request-Method': 'POST',
      },
    });
    assert.strictEqual(
      res.headers.get('access-control-allow-origin'),
      null,
      'Preflight from untrusted origin must not receive Access-Control-Allow-Origin'
    );
  });

  await asyncReport('CORS Non-Browser: Requests with no Origin header (curl/Postman) succeed normally', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    const data = await res.json();
    assert.ok(data.service, 'Service response should be returned');
    assert.strictEqual(
      res.headers.get('access-control-allow-origin'),
      null,
      'Non-browser request should not have ACAO header attached'
    );
  });

  console.log('\n===============================================================');
  console.log(`  SECURITY TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('===============================================================');

  if (failedCount > 0) {
    process.exitCode = 1;
  }
}

runCorsTests().catch((err) => {
  console.error('\n❌ Security Test Suite encountered unhandled error:', err);
  process.exitCode = 1;
});
