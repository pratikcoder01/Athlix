const Post = require('../models/Post');

// @desc    Create a new community post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const { caption, mediaUrl } = req.body;

    const post = await Post.create({
      userId: req.user.id,
      caption,
      mediaUrl: mediaUrl || '',
    });

    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name profileImage beltRank role discipline');

    res.status(201).json({ success: true, post: populatedPost });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all community feed posts
// @route   GET /api/posts
// @access  Private
exports.getFeed = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('userId', 'name profileImage beltRank role discipline')
      .populate('comments.user', 'name profileImage beltRank')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like status on a post
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      const err = new Error('Post not found');
      err.statusCode = 404;
      return next(err);
    }

    const likeIndex = post.likes.indexOf(req.user.id);
    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(req.user.id);
    }

    await post.save();
    res.status(200).json({ success: true, likes: post.likes });
  } catch (error) {
    next(error);
  }
};
