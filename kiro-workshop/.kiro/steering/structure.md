# Project Structure

Yarn monorepo with three workspaces:

```
/
├── frontend/               # React + TypeScript SPA
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── contexts/       # React contexts (e.g. AuthContext)
│       ├── pages/          # Route-level page components
│       ├── services/       # API call functions (api.ts)
│       └── types/          # Shared TypeScript interfaces (user.ts, post.ts)
│
├── backend/                # Lambda function handlers
│   └── src/
│       ├── common/         # Shared utilities (middleware.js — withAuth wrapper)
│       └── functions/
│           ├── auth/       # register.js, login.js
│           ├── posts/      # createPost.js, getPosts.js, likePost.js
│           └── users/      # getProfile.js, updateProfile.js, followUser.js, unfollowUser.js, checkFollowing.js
│
└── infrastructure/         # AWS CDK stack
    └── lib/
        └── app-stack.ts    # Single stack defining all AWS resources
```

## Key Conventions

### Backend
- One file per Lambda handler under `backend/src/functions/{domain}/`
- Handlers that require auth wrap their export with `withAuth()` from `common/middleware.js`
- `withAuth` decodes the Cognito IdToken JWT and attaches `event.user = { id, username }` before calling the real handler
- All responses include CORS headers (`Access-Control-Allow-Origin: *`)
- Environment variables are the only way config reaches Lambda (no config files)
- Build output goes to `backend/dist/` — CDK reads zipped Lambda packages from `backend/dist/lambda-packages/{name}.zip`

### Frontend
- API calls are grouped by domain in `src/services/api.ts` (`authApi`, `usersApi`, `postsApi`)
- Auth state lives in `AuthContext` — access via `useAuth()` hook
- Token and user object are persisted in `localStorage`
- Protected pages use the `ProtectedRoute` wrapper in `App.tsx`
- Types are defined in `src/types/` and shared across services and components

### Infrastructure
- All AWS resources are defined in a single CDK stack (`AppStack`)
- DynamoDB tables use PAY_PER_REQUEST and have GSIs for common access patterns (e.g. `username-index`, `userId-index`, `postId-index`)
- CDK outputs (`CfnOutput`) map directly to the frontend `.env` variable names
