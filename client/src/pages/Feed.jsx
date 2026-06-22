import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useFeed, useCreatePost, useLikePost } from '../hooks/useQueries';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { Heart, MessageCircle, Send, Loader, Image, Award, Swords } from 'lucide-react';

const Feed = () => {
  const { user } = useAuth();
  const { data: posts, isLoading: feedLoading } = useFeed();
  const createPostMutation = useCreatePost();
  const likePostMutation = useLikePost();
  
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaLoading, setMediaLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      caption: '',
    },
  });

  const onSubmit = async (data) => {
    setErrorMsg('');
    try {
      await createPostMutation.mutateAsync({
        caption: data.caption,
        mediaUrl: mediaUrl,
      });
      reset();
      setMediaUrl('');
    } catch (err) {
      setErrorMsg('Failed to publish post. Please check inputs.');
    }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMediaLoading(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('avatar', file); // Utilize avatar upload endpoint for image uploads convenience

    try {
      const response = await api.post('/profile/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) {
        setMediaUrl(response.data.profileImage);
      }
    } catch (err) {
      setErrorMsg('Error uploading image to Cloudinary');
    } finally {
      setMediaLoading(false);
    }
  };

  if (feedLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-dojo-muted">
        <Loader className="animate-spin mr-2" />
        <span>Loading Dojo feed...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Messages */}
      {errorMsg && (
        <div className="mb-4 rounded bg-dojo-primary bg-opacity-10 border border-dojo-primary p-3.5 text-xs text-dojo-primary">
          {errorMsg}
        </div>
      )}

      {/* Create Post Box */}
      <div className="glass-panel rounded-xl p-6 mb-8">
        <div className="flex gap-4">
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dojo-border text-sm font-bold text-dojo-primary uppercase">
              {user.name.charAt(0)}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-4">
            <div>
              <textarea
                {...register('caption', { required: 'Caption message is required' })}
                rows={3}
                placeholder="Share technique reviews, spar rounds, or training progression notes..."
                className="w-full rounded bg-dojo-dark border border-dojo-border p-3 text-white placeholder-dojo-muted focus:outline-none focus:border-dojo-primary transition resize-none text-sm"
              />
              {errors.caption && (
                <p className="text-xs text-dojo-primary mt-1">{errors.caption.message}</p>
              )}
            </div>

            {/* Media Upload Preview */}
            {mediaUrl && (
              <div className="relative border border-dojo-border rounded-lg overflow-hidden bg-dojo-dark">
                <img src={mediaUrl} alt="Post preview" className="max-h-60 mx-auto object-contain" />
                <button
                  type="button"
                  onClick={() => setMediaUrl('')}
                  className="absolute top-2 right-2 bg-black bg-opacity-70 text-white hover:bg-opacity-95 p-1 rounded-full text-xs font-bold w-6 h-6 flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <label className="flex items-center space-x-1.5 text-xs text-dojo-muted hover:text-dojo-primary cursor-pointer transition">
                {mediaLoading ? <Loader className="animate-spin" size={16} /> : <Image size={16} />}
                <span>{mediaLoading ? 'Uploading image...' : 'Add image attachment'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMediaUpload}
                  disabled={mediaLoading}
                  className="hidden"
                />
              </label>

              <button
                type="submit"
                disabled={createPostMutation.isPending || mediaLoading}
                className="px-5 py-2.5 bg-dojo-primary text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-opacity-90 flex items-center gap-1.5 transition disabled:opacity-50 shadow-glow-red"
              >
                {createPostMutation.isPending ? (
                  <Loader className="animate-spin" size={14} />
                ) : (
                  <Send size={12} />
                )}
                <span>Post Update</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Feed Posts */}
      <div className="space-y-6">
        <AnimatePresence>
          {posts && posts.length > 0 ? (
            posts.map((post) => {
              const hasLiked = post.likes?.includes(user.id);
              const author = post.userId;

              return (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="glass-panel rounded-xl p-6"
                >
                  {/* Author Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {author?.profileImage ? (
                        <img
                          src={author.profileImage}
                          alt={author.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dojo-border text-sm font-bold text-dojo-primary uppercase">
                          {author?.name ? author.name.charAt(0) : '?'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-white text-sm">{author?.name || 'Dojo Athlete'}</h4>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span className="text-[10px] bg-dojo-primary bg-opacity-10 text-dojo-primary px-2 py-0.5 rounded border border-dojo-primary border-opacity-25 flex items-center gap-0.5 uppercase">
                            <Swords size={9} />
                            <span>{author?.discipline}</span>
                          </span>
                          <span className="text-[10px] bg-dojo-secondary bg-opacity-10 text-dojo-secondary px-2 py-0.5 rounded border border-dojo-secondary border-opacity-25 flex items-center gap-0.5 uppercase">
                            <Award size={9} />
                            <span>{author?.beltRank} Belt</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-dojo-border border border-dojo-border text-dojo-muted rounded">
                      {author?.role}
                    </span>
                  </div>

                  {/* Caption */}
                  <p className="text-dojo-text text-sm leading-relaxed mb-4 whitespace-pre-line">
                    {post.caption}
                  </p>

                  {/* Media Url */}
                  {post.mediaUrl && (
                    <div className="border border-dojo-border rounded-lg overflow-hidden mb-4 bg-dojo-dark">
                      <img src={post.mediaUrl} alt="Feed media" className="w-full max-h-96 object-contain" />
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center gap-6 border-t border-dojo-border pt-4 text-xs font-semibold text-dojo-muted">
                    <button
                      onClick={() => likePostMutation.mutate(post._id)}
                      className={`flex items-center gap-1.5 transition ${
                        hasLiked ? 'text-dojo-primary' : 'hover:text-dojo-primary'
                      }`}
                    >
                      <Heart size={16} fill={hasLiked ? 'currentColor' : 'none'} />
                      <span>{post.likes?.length || 0} Likes</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <MessageCircle size={16} />
                      <span>{post.comments?.length || 0} Comments</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-20 border border-dashed border-dojo-border rounded-lg text-dojo-muted">
              The dojo is quiet. Publish the first post to kick off the community!
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Feed;
