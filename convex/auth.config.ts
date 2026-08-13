import type { AuthConfig } from 'convex/server';

// Firebase ID tokens are signed JWTs. Set these values from your Firebase
// project when deploying Convex. The exact issuer and JWKS URL must match the
// token claims for your Firebase project.
const authConfig: AuthConfig = {
  providers: process.env.FIREBASE_PROJECT_ID ? [{
    type: 'customJwt',
    applicationID: process.env.FIREBASE_PROJECT_ID,
    issuer: `https://securetoken.google.com/${process.env.FIREBASE_PROJECT_ID}`,
    jwks: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
    algorithm: 'RS256',
  }] : [],
};

export default authConfig;
