import { Request } from 'express';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { unlinkSync, writeFileSync } from 'fs';

/**
 * Validates uploaded video file for Karate Kata Analyzer
 * Checks:
 * - File extension (mp4, mov, avi, webm)
 * - File size (max 200MB)
 * - Duration (max 120 seconds)
 * - File integrity (basic ffprobe check)
 */
export class VideoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VideoValidationError';
  }
}

/**
 * Validate video file using ffprobe for duration and integrity
 * @param file Express Multer file object
 * @returns Promise that resolves if valid, rejects with VideoValidationError
 */
export const validateVideoFile = async (file: Express.Multer.File): Promise<void> => {
  // Check file extension
  const allowedExtensions = ['.mp4', '.mov', '.avi', '.webm'];
  const fileExtension = file.originalname.substring(
    file.originalname.lastIndexOf('.')
  ).toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    throw new VideoValidationError(
      `Invalid video format. Allowed formats: ${allowedExtensions.join(', ')}`
    );
  }

  // Check file size (max 200MB)
  const maxSizeInBytes = 200 * 1024 * 1024; // 200MB
  if (file.size > maxSizeInBytes) {
    throw new VideoValidationError(
      `Video file too large. Maximum size allowed is 200MB. Your file: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
    );
  }

  // Save file temporarily for validation
  const tempDir = tmpdir();
  const tempFilePath = join(tempDir, `athlix-validation-${Date.now()}${fileExtension}`);

  try {
    // Write buffer to temp file
    writeFileSync(tempFilePath, file.buffer);

    // Use ffprobe to get duration and check integrity
    // ffprobe -v error -show_entries format=duration -of json <file>
    const ffprobeCommand = `ffprobe -v error -show_entries format=duration -of json "${tempFilePath}"`;
    const output = execSync(ffprobeCommand, { encoding: 'utf8' });
    const { format } = JSON.parse(output);
    const durationSeconds = parseFloat(format.duration);

    // Check duration (max 2 minutes)
    if (durationSeconds > 120) {
      throw new VideoValidationError(
        `Video duration too long. Maximum duration allowed is 120 seconds (2 minutes). ` +
        `Your video: ${durationSeconds.toFixed(2)} seconds`
      );
    }

    // Basic integrity check - if ffprobe succeeded, file is at least readable
  } catch (error: any) {
    // Clean up temp file on error
    if (error.status === 127) { // ffprobe not found
      throw new VideoValidationError(
        'Video validation system not available. Please contact administrator.'
      );
    }
    // Re-throw validation errors
    if (error instanceof VideoValidationError) {
      throw error;
    }
    // Handle other errors (ffprobe failure, etc.)
    throw new VideoValidationError(
      `Invalid or corrupted video file: ${error.message}`
    );
  } finally {
    // Clean up temp file
    try {
      unlinkSync(tempFilePath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
};

export default validateVideoFile;