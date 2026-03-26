# Product

This is a micro-blogging application (similar to Twitter/X) where users can create short posts, follow other users, and like posts.

## Core Features
- User registration and authentication
- Create and view posts (max 280 characters)
- Like posts
- Follow/unfollow users
- User profiles with follower/following counts
- Feed of posts sortable by newest or popular

## Users & Auth
- Users register with username, email, password, and display name
- Auth is handled via AWS Cognito; the frontend stores the Cognito IdToken in localStorage
- Protected routes redirect unauthenticated users to `/login`
