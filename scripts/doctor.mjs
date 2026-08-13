const required = ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_CONVEX_URL'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing environment values: ${missing.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log('Core Resit environment is configured.');
}
