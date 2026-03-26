# Implementation Plan: User Profile Picture

## Overview

Implement profile picture upload, storage, and display. This involves a new Lambda handler, an S3 bucket for avatar storage, CDK infrastructure updates, two new frontend components (`Avatar`, `ProfilePictureUpload`), an API service method, and wiring avatars into the Feed and Profile pages.

## Tasks

- [~] 1. Add S3 profile pictures bucket and `uploadProfilePic` Lambda to CDK stack
  - [~] 1.1 Create the S3 bucket for profile pictures in `infrastructure/lib/app-stack.ts`
    - Add a new `s3.Bucket` (`ProfilePicsBucket`) with public-read bucket policy and `DESTROY` removal policy
    - Export the bucket as a public readonly property on `AppStack`
    - _Requirements: 1.1_

  - [~] 1.2 Create the `uploadProfilePic` Lambda and wire it into API Gateway
    - Add a new `lambda.Function` (`UploadProfilePicFunction`) with env vars `PROFILE_PICS_BUCKET` and `USERS_TABLE`
    - Grant the function `s3:PutObject` on the profile pics bucket and `grantReadWriteData` on `usersTable`
    - Add API Gateway resource `POST /users/{userId}/profile-picture` pointing to the new Lambda
    - Add a `CfnOutput` for the bucket name if needed for debugging
    - _Requirements: 1.1, 1.2_

- [~] 2. Implement `uploadProfilePic` Lambda handler
  - [~] 2.1 Create `backend/src/functions/users/uploadProfilePic.js`
    - Wrap with `withAuth` from `common/middleware.js`
    - Validate authenticated user matches `{userId}` path param — return 403 if not
    - Validate `contentType` is one of `image/jpeg`, `image/png`, `image/webp`, `image/gif` — return 400 if not
    - Validate `image` field is present — return 400 if missing
    - Decode base64 and validate decoded size ≤ 5 MB — return 400 if exceeded
    - Call `S3Client.PutObject` with key `avatars/{userId}`, correct `ContentType`, and decoded `Body`
    - Construct public URL and call `DynamoDBDocumentClient.UpdateCommand` to set `avatarUrl` on the user record
    - Return `{ avatarUrl }` on success; return 500 on S3 or DynamoDB failure
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [~] 2.2 Write property test for ownership enforcement (Property 2)
    - `// Feature: user-profile-pic, Property 2: Ownership enforcement`
    - Use fast-check to generate arbitrary pairs of distinct userIds; call handler authenticated as userA targeting userB; assert 403
    - **Property 2: Ownership enforcement**
    - **Validates: Requirements 1.3**

  - [~] 2.3 Write property test for invalid content type rejection (Property 3)
    - `// Feature: user-profile-pic, Property 3: Invalid content type rejection`
    - Use fast-check to generate arbitrary MIME type strings not in the allowed set; assert 400
    - Also assert 400 when decoded payload exceeds 5 MB
    - **Property 3: Invalid content type rejection**
    - **Validates: Requirements 1.4, 1.5**

  - [~] 2.4 Write unit tests for `uploadProfilePic` handler
    - Ownership check returns 403 for mismatched userId
    - Rejects each unsupported MIME type individually with 400
    - Rejects payload where decoded size > 5 MB with 400
    - Constructs correct S3 key `avatars/{userId}`
    - Returns 400 for missing `image` field
    - Returns 400 for invalid base64 encoding
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [~] 3. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [~] 4. Add `uploadProfilePicture` method to frontend API service
  - [~] 4.1 Add `uploadProfilePicture` to `usersApi` in `frontend/src/services/api.ts`
    - Signature: `uploadProfilePicture(userId, imageBase64, contentType, token): Promise<{ avatarUrl: string }>`
    - POST to `/users/{userId}/profile-picture` with JSON body `{ image, contentType }`
    - _Requirements: 1.1, 1.2_

- [~] 5. Create `Avatar` component
  - [~] 5.1 Create `frontend/src/components/Avatar.tsx`
    - Accept props `avatarUrl?: string`, `displayName: string`, `size?: 'sm' | 'md' | 'lg'` (32px / 48px / 96px)
    - Render `<img>` with `src={avatarUrl}` and `alt={displayName}` when `avatarUrl` is a non-empty string
    - Include `onError` handler on `<img>` to fall back to the initial-based placeholder if the URL becomes unreachable
    - Render a `<div>` with the first character of `displayName` as fallback when `avatarUrl` is absent or empty
    - _Requirements: 1.7, 1.8_

  - [ ] 5.2 Write property test for Avatar component rendering (Property 5)
    - `// Feature: user-profile-pic, Property 5: Avatar component rendering`
    - Use fast-check to generate arbitrary `avatarUrl` (string | undefined) and `displayName`; render `Avatar`; assert `<img>` when avatarUrl is non-empty, fallback div with first char when absent/empty
    - **Property 5: Avatar component rendering**
    - **Validates: Requirements 1.7, 1.8**

  - [ ] 5.3 Write unit tests for `Avatar` component
    - Renders `<img>` with correct `src` when `avatarUrl` is provided
    - Renders initial fallback when `avatarUrl` is undefined
    - Renders initial fallback when `avatarUrl` is empty string
    - Falls back to placeholder on `<img>` `onError`
    - _Requirements: 1.7, 1.8_

- [ ] 6. Create `ProfilePictureUpload` component
  - [ ] 6.1 Create `frontend/src/components/ProfilePictureUpload.tsx`
    - Accept props `currentAvatarUrl?: string`, `userId: string`, `onUploadSuccess: (newAvatarUrl: string) => void`
    - Render `<Avatar>` in a circular container with an "Edit" overlay button visible on hover
    - Hidden `<input type="file" accept="image/*">` triggered by the overlay button click
    - On file selection, read file as base64 using `FileReader` and call `usersApi.uploadProfilePicture`
    - Show inline error message below the control on upload failure
    - _Requirements: 1.1, 1.2_

  - [ ] 6.2 Write unit tests for `ProfilePictureUpload` component
    - File input triggers base64 conversion and API call
    - `onUploadSuccess` is called with the returned `avatarUrl`
    - Inline error message is shown on API failure
    - _Requirements: 1.1, 1.2_

- [ ] 7. Wire `Avatar` into Feed post cards
  - [ ] 7.1 Update `frontend/src/pages/Feed.tsx` to render `<Avatar size="sm">` next to each post's author link
    - Import and render `<Avatar avatarUrl={post.user?.avatarUrl} displayName={post.user?.displayName ?? ''} size="sm">` inside `.post-header` next to the existing `<Link>`
    - _Requirements: 1.7_

- [ ] 8. Wire avatar components into Profile page
  - [ ] 8.1 Update `frontend/src/pages/Profile.tsx` to show avatar in the profile header
    - For own profile: render `<ProfilePictureUpload currentAvatarUrl={user.avatarUrl} userId={userId} onUploadSuccess={...}>` and update `user` state with the new `avatarUrl` on success
    - For other profiles: render `<Avatar avatarUrl={user.avatarUrl} displayName={user.displayName} size="lg">`
    - _Requirements: 1.2, 1.7, 1.8_

- [ ] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Property-based integration test for upload round-trip (Property 1) and re-upload overwrite (Property 4)
  - [ ] 10.1 Write property test for upload round-trip (Property 1)
    - `// Feature: user-profile-pic, Property 1: Upload round-trip`
    - Use fast-check to generate arbitrary valid userId and image buffer; upload then call getProfile; assert returned `avatarUrl` matches upload response
    - **Property 1: Upload round-trip**
    - **Validates: Requirements 1.1, 1.2**

  - [ ] 10.2 Write property test for re-upload overwrites previous avatar (Property 4)
    - `// Feature: user-profile-pic, Property 4: Re-upload overwrites previous avatar`
    - Use fast-check to generate arbitrary userId and two distinct image buffers; upload both sequentially; assert final `avatarUrl` matches second upload only
    - **Property 4: Re-upload overwrites previous avatar**
    - **Validates: Requirements 1.6**

- [ ] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use **fast-check** (both frontend via Vitest and backend via Jest) with a minimum of 100 iterations each
- Each property test must include the tag comment `// Feature: user-profile-pic, Property N: ...`
- The S3 key format is `avatars/{userId}` (no extension); `ContentType` is set per object
- The `avatarUrl` field already exists on the `User` type and in `updateProfile.js` — no DynamoDB migration needed
