import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/user';
import { Post } from '../types/post';
import { usersApi, postsApi } from '../services/api';

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, token } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
  });
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !token) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user profile
        const userData = await usersApi.getProfile(userId, token);
        setUser(userData.user);
        setFormData({
          displayName: userData.user.displayName,
          bio: userData.user.bio || '',
        });
        
        // Fetch user's posts
        const postsData = await postsApi.getPosts(token, { userId });
        setPosts(postsData.posts);

        // Check if current user is following this user
        if (!isOwnProfile) {
          try {
            const followData = await usersApi.checkFollowing(userId, token);
            setIsFollowing(followData.following);
          } catch (error) {
            console.error('Error checking follow status:', error);
          }
        }
      } catch (err) {
        setError('Failed to load profile. Please try again later.');
        console.error('Error fetching profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, token, isOwnProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !token) return;
    
    try {
      const data = await usersApi.updateProfile(userId, formData, token);
      setUser(data.user);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Error updating profile:', err);
    }
  };

  const handleFollow = async () => {
    if (!userId || !token || !user) return;
    
    try {
      if (isFollowing) {
        await usersApi.unfollowUser(userId, token);
      } else {
        await usersApi.followUser(userId, token);
      }
      
      // Update follow status and counts
      setIsFollowing(!isFollowing);
      setUser({
        ...user,
        followersCount: isFollowing 
          ? (user.followersCount || 0) - 1 
          : (user.followersCount || 0) + 1,
      });
    } catch (err) {
      setError(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user. Please try again.`);
      console.error('Error following/unfollowing user:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!user) {
    return <div className="error-message">User not found</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="edit-profile-form">
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            
            <div className="form-actions">
              <button type="submit">Save</button>
              <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <h2>{user.displayName}</h2>
            <p className="username">@{user.username}</p>
            {user.bio && <p className="bio">{user.bio}</p>}
            <div className="profile-stats">
              <span>{user.followersCount || 0} followers</span>
              <span>{user.followingCount || 0} following</span>
            </div>
            {isOwnProfile ? (
              <button onClick={() => setIsEditing(true)} className="edit-profile-button">
                Edit Profile
              </button>
            ) : (
              <button 
                onClick={handleFollow} 
                className={`follow-button ${isFollowing ? 'following' : ''}`}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </>
        )}
      </div>
      
      <div className="profile-posts">
        <h3>Posts</h3>
        {posts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          <div className="posts-list">
            {posts.map(post => (
              <div key={post.id} className="post-card">
                <div className="post-content">{post.content}</div>
                <div className="post-footer">
                  <span className="post-date">{formatDate(post.createdAt)}</span>
                  <span>{post.likesCount} likes</span>
                  <span>{post.commentsCount} comments</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
