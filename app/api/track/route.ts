import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionCode, xPercent, yPercent, viewportWidth, viewportHeight, frameId } = body;

    // 1. Find the session ID using the session code
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('session_code', sessionCode)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 2. Insert click event
    const { error: insertError } = await supabase
      .from('click_events')
      .insert({
        session_id: session.id,
        x_percent: xPercent,
        y_percent: yPercent,
        viewport_width: viewportWidth,
        viewport_height: viewportHeight,
        frame_id: frameId || 'default_frame',
      });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}