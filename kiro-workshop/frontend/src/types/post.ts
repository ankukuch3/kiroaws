import { User } from './user';

export interface Post {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  user?: User;
  liked?: boolean;
}
