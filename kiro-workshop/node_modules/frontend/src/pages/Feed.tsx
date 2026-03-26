import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Post } from '../types/post';
import { postsApi, usersApi } from '../services/api';

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const { token } = useAuth();
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && nextToken) {
        fetchPosts(nextToken);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, nextToken]);

  const fetchPosts = async (nextToken?: string | null) => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await postsApi.getPosts(token, {
        limit: 10,
        sortBy,
        nextToken: nextToken || undefined
      });
      
      // Fetch user info for each post
      const postsWithUsers = await Promise.all(
        data.posts.map(async (post: Post) => {
          try {
            const userData = await usersApi.getProfile(post.userId, token);
            return { ...post, user: userData.user };
          } catch (error) {
            console.error('Error fetching user data:', error);
            return post;
          }
        })
      );
      
      setPosts(prevPosts => nextToken ? [...prevPosts, ...postsWithUsers] : postsWithUsers);
      setNextToken(data.nextToken);
    } catch (err) {
      setError('Failed to load posts. Please try again later.');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      setPosts([]);
      setNextToken(null);
      fetchPosts();
    }
  }, [token, sortBy]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleLike = async (postId: string) => {
    if (!token) return;
    
    try {
      await postsApi.likePost(postId, token);
      
      // Update post in state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, likesCount: post.likesCount + 1, liked: true } 
            : post
        )
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as 'newest' | 'popular');
  };

  return (
    <div className="feed-layout">
      <div className="feed-main">
        <div className="feed">
          <div className="feed-header">
            <h2>Recent</h2>
          </div>
          <div className="feed-controls">
            <label htmlFor="sort-by">Sort by:</label>
            <select 
              id="sort-by" 
              value={sortBy} 
              onChange={handleSortChange}
              className="sort-select"
            >
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
            </select>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="posts-list">
            {posts.length === 0 && !loading ? (
              <p>No posts yet. Be the first to post!</p>
            ) : (
              posts.map((post, index) => {
                if (posts.length === index + 1) {
                  return (
                    <div 
                      ref={lastPostElementRef}
                      key={post.id} 
                      className="post-card"
                    >
                      <div className="post-header">
                        <Link to={`/profile/${post.userId}`} className="user-link">
                          {post.user ? post.user.displayName : 'Unknown User'}
                        </Link>
                        <span className="post-date">{formatDate(post.createdAt)}</span>
                      </div>
                      <div className="post-content">{post.content}</div>
                      <div className="post-footer">
                        <button 
                          onClick={() => handleLike(post.id)} 
                          className={`like-button ${post.liked ? 'liked' : ''}`}
                          disabled={post.liked}
                        >
                          {post.likesCount} {post.likesCount === 1 ? 'Like' : 'Likes'}
                        </button>
                        <span>{post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}</span>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={post.id} className="post-card">
                      <div className="post-header">
                        <Link to={`/profile/${post.userId}`} className="user-link">
                          {post.user ? post.user.displayName : 'Unknown User'}
                        </Link>
                        <span className="post-date">{formatDate(post.createdAt)}</span>
                      </div>
                      <div className="post-content">{post.content}</div>
                      <div className="post-footer">
                        <button 
                          onClick={() => handleLike(post.id)} 
                          className={`like-button ${post.liked ? 'liked' : ''}`}
                          disabled={post.liked}
                        >
                          {post.likesCount} {post.likesCount === 1 ? 'Like' : 'Likes'}
                        </button>
                        <span>{post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}</span>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>
          
          {loading && <div className="loading">Loading posts...</div>}
        </div>
      </div>
      
      <div className="feed-sidebar">
        <div className="feed-sidebar-placeholder">
          <p>Future content area</p>
          <p>This space is reserved for upcoming features like trending topics, suggested users, or advertisements.</p>
        </div>
      </div>
    </div>
  );
};

export default Feed;
