
import React, { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { Loader2, ImageOff } from 'lucide-react';

interface NoteImageProps {
  src?: string;
  alt?: string;
}

const NoteImage: React.FC<NoteImageProps> = ({ src, alt }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Immediate check: if src is missing, stop loading immediately.
    if (!src) {
        setLoading(false);
        return;
    }

    let objectUrl: string | null = null;
    let isMounted = true;

    const loadAsset = async () => {
      try {
        setLoading(true);
        setError(false);

        // Check if it's our internal protocol
        if (src.startsWith('asset://')) {
          const assetId = src.replace('asset://', '');
          
          // Timeout race to prevent infinite hanging on DB issues
          const timeoutPromise = new Promise((_, reject) => 
             setTimeout(() => reject(new Error('Timeout')), 10000)
          );

          const dbPromise = db.getAsset(assetId);

          // Use any cast to satisfy TS Promise.race type inference
          const asset = await Promise.race([dbPromise, timeoutPromise]) as any;

          if (asset && isMounted) {
            if (asset.blob) {
                objectUrl = URL.createObjectURL(asset.blob);
                setImgUrl(objectUrl);
            } else {
                setError(true);
            }
          } else if (isMounted) {
            setError(true);
          }
        } else {
          // Standard URL
          setImgUrl(src);
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAsset();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div className="w-full h-48 bg-gray-50 animate-pulse rounded-lg flex items-center justify-center text-gray-300 border border-gray-100 my-2">
        <Loader2 size={24} className="animate-spin" />
        <span className="ml-2 text-xs">加载图片...</span>
      </div>
    );
  }

  if (error || !imgUrl) {
    return (
      <div className="w-full h-32 bg-gray-50 border border-gray-200 border-dashed rounded-lg flex flex-col gap-2 items-center justify-center text-xs text-gray-400 my-2">
        <ImageOff size={20} />
        <span>图片无法显示</span>
      </div>
    );
  }

  return (
    <img 
      src={imgUrl} 
      alt={alt || "Note Attachment"} 
      className="rounded-lg max-w-full h-auto border border-gray-100 my-2 shadow-sm transition-opacity duration-300"
      loading="lazy"
    />
  );
};

export default NoteImage;
