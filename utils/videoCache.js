import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const VIDEO_FOLDER = `${FileSystem.documentDirectory}SciLearnVideos/`;

export async function ensureFolder() {
  const info = await FileSystem.getInfoAsync(VIDEO_FOLDER);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(VIDEO_FOLDER, { intermediates: true });
  }
  return VIDEO_FOLDER;
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

export async function downloadVideo(videoId, title, onProgress) {
  try {
    await ensureFolder();
    const refPath = `${VIDEO_FOLDER}SCILEARN_${videoId}_ref.json`;
    await FileSystem.writeAsStringAsync(refPath, JSON.stringify({
      videoId, title,
      downloadedAt: new Date().toISOString(),
    }));
    if (onProgress) onProgress(1);
    return { success: true, path: refPath };
  } catch (e) {
    return { success: false, error: e.message };
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