import { Response, NextFunction } from 'express';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { Notification } from '../models/Notification';
import { AuthenticatedRequest } from '../types';
import { Types } from 'mongoose';

// @desc    Get all community feed posts
// @route   GET /api/posts
// @access  Private
export const getPosts = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const posts = await Post.find()
      .populate('authorId', 'name email role')
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const { content, mediaUrl, mediaType } = req.body;

    const post = await Post.create({
      authorId: req.user._id,
      content,
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || 'none',
    });

    const populatedPost = await Post.findById(post._id).populate('authorId', 'name email role');

    // Emit real-time update to all active users
    const io = req.app.get('io');
    if (io) {
      io.emit('new_post', populatedPost);
    }

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: populatedPost,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user like on post
// @route   POST /api/posts/:id/like
// @access  Private
export const toggleLikePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = req.user._id as Types.ObjectId;
    const likeIndex = post.likes?.findIndex((id: any) => id.toString() === userId.toString());

    let liked = false;
    post.likes = post.likes || [];

    if (likeIndex === -1 || likeIndex === undefined) {
      // Like the post
      post.likes.push(userId);
      liked = true;

      // Trigger notification for the author if they are not the liker
      if (post.authorId.toString() !== userId.toString()) {
        const notificationMessage = `${req.user.name} liked your post`;
        const notification = await Notification.create({
          recipientId: post.authorId,
          senderId: userId,
          type: 'social',
          message: notificationMessage,
          read: false,
          link: '/feed',
        });

        // Socket notify
        const io = req.app.get('io');
        if (io) {
          io.to(post.authorId.toString()).emit('notification', {
            id: notification._id,
            type: 'social',
            message: notificationMessage,
            createdAt: notification.createdAt,
          });
        }
      }
    } else {
      // Unlike the post
      post.likes.splice(likeIndex, 1);
    }

    await post.save();

    res.status(200).json({
      success: true,
      liked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Comment on post
// @route   POST /api/posts/:id/comments
// @access  Private
export const commentPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      authorId: req.user._id,
      postId: post._id,
      content,
    });

    post.commentsCount = (post.commentsCount || 0) + 1;
    await post.save();

    const populatedComment = await Comment.findById(comment._id).populate('authorId', 'name email role');

    // Notify post author if not the commenter
    if (post.authorId.toString() !== req.user._id.toString()) {
      const notificationMessage = `${req.user.name} commented on your post: "${content.substring(0, 20)}..."`;
      const notification = await Notification.create({
        recipientId: post.authorId,
        senderId: req.user._id,
        type: 'social',
        message: notificationMessage,
        read: false,
        link: '/feed',
      });

      // Socket notify
      const io = req.app.get('io');
      if (io) {
        io.to(post.authorId.toString()).emit('notification', {
          id: notification._id,
          type: 'social',
          message: notificationMessage,
          createdAt: notification.createdAt,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for a specific post
// @route   GET /api/posts/:id/comments
// @access  Private
export const getCommentsByPostId = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const comments = await Comment.find({ postId: req.params.id })
      .populate('authorId', 'name email role')
      .sort({ createdAt: 1 })
      .exec();

    res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    next(error);
  }
};
