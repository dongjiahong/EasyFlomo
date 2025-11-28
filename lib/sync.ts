
import { WebDAVConfig, Note } from '../types';
import { db } from './db';
import { WebDAVClient } from './webdav';

const ROOT_FOLDER = 'flomo_data';
const NOTES_FOLDER = 'flomo_data/notes';
const ASSETS_FOLDER = 'flomo_data/assets';

// Get ISO Week Number (YYYY-Www)
function getWeekShardingKey(timestamp: number): string {
  const date = new Date(timestamp);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const year = d.getUTCFullYear();
  const weekNo = Math.ceil((((d.getTime() - new Date(Date.UTC(year, 0, 1)).getTime()) / 86400000) + 1) / 7);
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

export async function syncNotes(config: WebDAVConfig, onProgress?: (msg: string) => void) {
  const client = new WebDAVClient(config);

  // 1. Initialize Folders
  onProgress?.('正在连接服务器...');
  if (!(await client.exists(ROOT_FOLDER))) await client.mkcol(ROOT_FOLDER);
  if (!(await client.exists(NOTES_FOLDER))) await client.mkcol(NOTES_FOLDER);
  if (!(await client.exists(ASSETS_FOLDER))) await client.mkcol(ASSETS_FOLDER);

  // 2. Prepare Local Data Grouped by Week
  onProgress?.('正在整理本地数据...');
  const localNotes = await db.getAllNotes();
  const localGroups = new Map<string, Note[]>();

  localNotes.forEach(note => {
    const key = getWeekShardingKey(note.timestamp);
    if (!localGroups.has(key)) localGroups.set(key, []);
    localGroups.get(key)!.push(note);
  });

  // 3. List Remote Files (Lazy Loading Strategy)
  onProgress?.('获取远程文件列表...');
  const remoteFiles = await client.listFiles(NOTES_FOLDER);
  // Sort descending: Process newest weeks first for "Lazy Load" effect in UI
  remoteFiles.sort((a, b) => b.name.localeCompare(a.name));

  const allKeys = new Set([
    ...localGroups.keys(), 
    ...remoteFiles.map(f => f.name.replace('.json', ''))
  ]);

  // Convert to array and sort desc
  const sortedKeys = Array.from(allKeys).sort().reverse();

  // 4. Sync Each Week
  let processedCount = 0;
  for (const key of sortedKeys) {
    onProgress?.(`正在同步: ${key} (${processedCount + 1}/${sortedKeys.length})`);
    
    const fileName = `${key}.json`;
    const filePath = `${NOTES_FOLDER}/${fileName}`;
    
    let remoteNotes: Note[] = [];
    let localWeekNotes = localGroups.get(key) || [];
    let hasChanges = false;

    // A. Fetch Remote
    const remoteFile = remoteFiles.find(f => f.name === fileName);
    if (remoteFile) {
      try {
        const content = await client.get(filePath);
        remoteNotes = JSON.parse(content);
      } catch (e) {
        console.error(`Error fetching ${fileName}`, e);
      }
    }

    // B. Merge Logic
    const mergedMap = new Map<string, Note>();
    
    // Put all remote notes in map first
    remoteNotes.forEach(n => mergedMap.set(n.id, n));

    // Merge local notes
    for (const localNote of localWeekNotes) {
      const remoteNote = mergedMap.get(localNote.id);
      
      if (!remoteNote) {
        // New local note
        mergedMap.set(localNote.id, localNote);
        hasChanges = true;
      } else {
        // Conflict resolution: Last Write Wins based on updatedAt
        const localTime = localNote.updatedAt || 0;
        const remoteTime = remoteNote.updatedAt || 0;

        if (localTime > remoteTime) {
          mergedMap.set(localNote.id, localNote);
          hasChanges = true;
        } else if (remoteTime > localTime) {
          // Remote is newer, update local DB later
          mergedMap.set(localNote.id, remoteNote);
        }
        // Equal: do nothing
      }
    }

    // C. Update Local DB
    const finalNotes = Array.from(mergedMap.values());
    for (const note of finalNotes) {
        const localNote = localWeekNotes.find(n => n.id === note.id);
        const remoteNote = remoteNotes.find(n => n.id === note.id);
        
        // If local doesn't exist or is older, update local
        if (!localNote || (remoteNote && (remoteNote.updatedAt || 0) > (localNote.updatedAt || 0))) {
            await db.updateNote(note);
        }
    }

    // D. Upload if changed (Local > Remote or New Local)
    // We compare finalNotes with the original remoteNotes string to see if we need to PUT
    const finalContent = JSON.stringify(finalNotes);
    // Simple check: if remote didn't exist, or length different, or content different.
    // Optimization: We set hasChanges=true above if we merged a local winner.
    // But we also need to check if we merged a remote winner into a file that didn't have it?
    // Actually, if we merged, finalNotes is the source of truth.
    // If remoteFile existed, we compare. If not, we upload.
    
    // To minimize PUTs, verify if the stringified result is different from what we downloaded
    let needsUpload = false;
    if (!remoteFile) {
        needsUpload = true;
    } else {
        // We could re-stringify remoteNotes but order might differ. 
        // hasChanges tracks if we injected a LOCAL note into the set.
        // But what if we just consumed remote notes and didn't change them?
        // We only upload if *our local state* modified the shared state.
        if (hasChanges) needsUpload = true;
    }

    // E. Sync Assets for these notes
    // We only upload assets for notes that exist in the final merged set
    for (const note of finalNotes) {
        // Skip deleted notes assets? Maybe keep them for history or delete later?
        // For now, simple logic: if note has assets, try sync.
        if (note.assetIds && note.assetIds.length > 0 && !note.isDeleted) {
            for (const assetId of note.assetIds) {
                const isSynced = await db.isAssetSynced(assetId);
                if (!isSynced) {
                    const asset = await db.getAsset(assetId);
                    if (asset) {
                        onProgress?.(`上传图片: ${assetId.substring(0, 6)}...`);
                        await client.put(`${ASSETS_FOLDER}/${assetId}`, asset.blob);
                        await db.markAssetSynced(assetId);
                    }
                }
            }
        }
    }

    if (needsUpload) {
        await client.put(filePath, finalContent);
    }

    processedCount++;
    // Notify progress listener to reload UI? 
    // The calling function can reload data after sync completes or we could emit events.
    // For lazy load UI effect, we would ideally reload here. 
  }
  
  onProgress?.('同步完成');
}
