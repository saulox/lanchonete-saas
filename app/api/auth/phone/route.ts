import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };

  if (!email) {
    return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 });
  }

  const supabase = await createClient();
  const origin = request.headers.get('origin') ?? new URL(request.url).origin;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`
    }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: 'Link mágico enviado para o e-mail informado.' });
}
