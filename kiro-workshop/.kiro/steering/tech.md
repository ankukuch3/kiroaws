# Tech Stack

## Frontend
- React 18 with TypeScript
- Vite as build tool
- React Router v6 for routing
- Plain CSS (no UI framework)
- Playwright for e2e tests
- ESLint with TypeScript rules

## Backend
- Node.js Lambda functions (CommonJS, `.js`)
- AWS SDK v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-cognito-identity-provider`)
- `uuid` for ID generation
- No framework — each Lambda is a standalone handler file

## Infrastructure
- AWS CDK v2 (TypeScript)
- API Gateway REST API
- AWS Cognito (User Pool + Identity Pool) for auth
- DynamoDB (PAY_PER_REQUEST billing) for all data
- S3 + CloudFront for frontend hosting
- Lambda runtime: Node.js 22.x

## Package Manager
- Yarn workspaces (root `package.json` defines `frontend`, `backend`, `infrastructure` workspaces)

## Common Commands

```bash
# Frontend
yarn start:frontend        # dev server (Vite)
yarn build:frontend        # tsc + vite build

# Backend
yarn build:backend         # copies src/* to dist/, strips .ts files

# Infrastructure
yarn deploy:infra          # cdk deploy

# Full deploy
yarn deploy                # build:backend + deploy:infra + deploy:frontend + CDN invalidation

# Frontend tests
yarn workspace frontend test:e2e          # Playwright (headless)
yarn workspace frontend test:e2e:headed   # Playwright (headed)
```

## Environment Variables
Frontend reads from `frontend/.env`:
- `VITE_API_URL` — API Gateway base URL (no trailing slash)
- `VITE_USER_POOL_ID`, `VITE_USER_POOL_CLIENT_ID`, `VITE_IDENTITY_POOL_ID` — Cognito config

Backend Lambdas receive env vars injected by CDK:
- `USERS_TABLE`, `POSTS_TABLE`, `LIKES_TABLE`, `FOLLOWS_TABLE` — DynamoDB table names
- `USER_POOL_ID`, `USER_POOL_CLIENT_ID` — Cognito (auth functions only)
