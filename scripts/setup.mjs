import { existsSync, copyFileSync } from 'node:fs';

if (!existsSync('.env.local')) {
  copyFileSync('.env.example', '.env.local');
  console.log('Created .env.local from .env.example. Add your Firebase, Convex, and provider values.');
} else {
  console.log('.env.local already exists; leaving it unchanged.');
}

console.log('Next steps:');
console.log('  1. Run: firebase login');
console.log('  2. Run: firebase use <your-project-id>');
console.log('  3. Run: pnpm convex:dev');
console.log('  4. Run: pnpm dev');
