import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, generateFileName } from '@/lib/r2/upload';
import { createSupabaseServer } from '@/lib/supabase/server';

// Tipos permitidos
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario está autenticado y es admin
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar rol admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Leer el FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'products';

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo no permitido. Usa: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar tamaño
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `El archivo supera el máximo de ${MAX_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    // Convertir a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generar nombre único y subir a R2
    const fileName = generateFileName(folder, file.name);
    const publicUrl = await uploadToR2(buffer, fileName, file.type);

    return NextResponse.json({ url: publicUrl, key: fileName });

  } catch (error: any) {
    console.error('[UPLOAD_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al subir la imagen' },
      { status: 500 }
    );
  }
}
