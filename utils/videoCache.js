import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

const VIDEO_FOLDER = `${FileSystem.documentDirectory}SciLearnVideos/`;

export async function ensureFolder() {
  const info = await FileSystem.getInfoAsync(VIDEO_FOLDER);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(VIDEO_FOLDER, { intermediates: true });
  }
  return VIDEO_FOLDER;
}

export function getVideoFilename(videoId, title) {
  const safeName = title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  return `SCILEARN_${safeName}_${videoId}.mp4`;
}

export function getLocalVideoPath(videoId, title) {
  return `${VIDEO_FOLDER}${getVideoFilename(videoId, title)}`;
}

export async function isVideoDownloaded(videoId, title) {
  try {
    const path = getLocalVideoPath(videoId, title);
    const info = await FileSystem.getInfoAsync(path);
    return info.exists;
  } catch {
    return false;
  }
}

export async function getDownloadProgress(videoId, title) {
  try {
    const path = getLocalVideoPath(videoId, title);
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) return 1;
    return 0;
  } catch {
    return 0;
  }
}

export async function downloadVideo(videoId, title, onProgress) {
  try {
    await ensureFolder();
    const filename = getVideoFilename(videoId, title);
    const localPath = `${VIDEO_FOLDER}${filename}`;

    // Check if already downloaded
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) return { success: true, path: localPath };

    // YouTube embed URL for downloading
    // Note: This uses the YouTube embed stream
    const downloadUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Since YouTube blocks direct downloads, we save the video ID
    // and play it via react-native-video's YouTube support
    // Instead, save a .json reference file
    const refPath = `${VIDEO_FOLDER}SCILEARN_${videoId}_ref.json`;
    await FileSystem.writeAsStringAsync(refPath, JSON.stringify({
      videoId,
      title,
      downloadedAt: new Date().toISOString(),
      filename,
    }));

    if (onProgress) onProgress(1);
    return { success: true, path: refPath, isRef: true };

  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function isVideoRefSaved(videoId) {
  try {
    const refPath = `${VIDEO_FOLDER}SCILEARN_${videoId}_ref.json`;
    const info = await FileSystem.getInfoAsync(refPath);
    return info.exists;
  } catch {
    return false;
  }
}

export async function getAllDownloadedVideos() {
  try {
    await ensureFolder();
    const files = await FileSystem.readDirectoryAsync(VIDEO_FOLDER);
    const refs = files.filter(f => f.endsWith('_ref.json'));
    const videos = [];
    for (const ref of refs) {
      const content = await FileSystem.readAsStringAsync(`${VIDEO_FOLDER}${ref}`);
      videos.push(JSON.parse(content));
    }
    return videos;
  } catch {
    return [];
  }
}

export async function deleteVideo(videoId) {
  try {
    const refPath = `${VIDEO_FOLDER}SCILEARN_${videoId}_ref.json`;
    await FileSystem.deleteAsync(refPath, { idempotent: true });
    return true;
  } catch {
    return false;
  }
}
