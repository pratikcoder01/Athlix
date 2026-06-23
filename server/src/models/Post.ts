import { Schema, model, Document } from 'mongoose';
import { IPost } from '../types';

export interface IPostDocument extends IPost, Document {}

const PostSchema = new Schema<IPostDocument>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'none'],
      default: 'none',
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Post = model<IPostDocument>('Post', PostSchema);
