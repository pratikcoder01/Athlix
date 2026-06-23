import { Schema, model, Document } from 'mongoose';
import { IComment } from '../types';

export interface ICommentDocument extends IComment, Document {}

const CommentSchema = new Schema<ICommentDocument>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content cannot be empty'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Comment = model<ICommentDocument>('Comment', CommentSchema);
