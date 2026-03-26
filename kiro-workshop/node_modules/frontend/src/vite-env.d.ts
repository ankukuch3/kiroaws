/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly VITE_API_URL: string;
    readonly VITE_USER_POOL_ID: string;
    readonly VITE_USER_POOL_CLIENT_ID: string;
    readonly VITE_IDENTITY_POOL_ID: string;
    readonly [key: string]: string | undefined;
  };
}
