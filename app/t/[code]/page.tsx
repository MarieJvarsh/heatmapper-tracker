'use client';

import { useEffect, useState, useRef, use } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TrackingPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const sessionCode = resolvedParams.code;

  const [prototypeUrl, setPrototypeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchSession() {
      const { data, error } = await supabase
        .from('sessions')
        .select('figma_prototype_url')
        .eq('session_code', sessionCode)
        .single();

      if (error || !data) {
        setError('Invalid or expired prototype tracking link.');
      } else {
        setPrototypeUrl(data.figma_prototype_url);
      }
      setLoading(false);
    }

    fetchSession();
  }, [sessionCode]);

  const handlePointerDown = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate percentage coordinates
    const xPercent = Number(((x / rect.width) * 100).toFixed(2));
    const yPercent = Number(((y / rect.height) * 100).toFixed(2));

    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionCode,
          xPercent,
          yPercent,
          viewportWidth: Math.round(rect.width),
          viewportHeight: Math.round(rect.height),
        }),
      });
    } catch (err) {
      console.error('Failed to record click:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white font-sans">
        Loading Prototype Session...
      </div>
    );
  }

  if (error || !prototypeUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-red-400 font-sans p-4">
        {error || 'Prototype link missing.'}
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative select-none">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        className="w-full h-full relative"
      >
        <iframe
          src={prototypeUrl}
          className="w-full h-full border-0 pointer-events-auto"
          allowFullScreen
        />
      </div>
    </div>
  );
}