import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { uploadToSupabaseStorage } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Maximum file size: 25MB
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds maximum allowed limit (25MB)' }, { status: 400 });
    }

    const fileNameLower = file.name.toLowerCase();
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileNameLower);
    const isPdf = file.type === 'application/pdf' || fileNameLower.endsWith('.pdf');
    const isDoc = /\.(doc|docx|xls|xlsx|txt|rtf|csv)$/i.test(fileNameLower) ||
      file.type.includes('word') ||
      file.type.includes('officedocument') ||
      file.type.includes('excel') ||
      file.type.includes('text');

    if (!isImage && !isPdf && !isDoc) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload an image (.jpg, .png, .webp) or document (.pdf, .doc, .docx, .xls, .xlsx)' },
        { status: 400 }
      );
    }

    const fileType = isPdf ? 'PDF' : isImage ? 'IMAGE' : 'DOCUMENT';

    // Determine accurate MIME type for cloud storage
    let mimeType = file.type;
    if (!mimeType || mimeType === 'application/octet-stream') {
      if (fileNameLower.endsWith('.docx')) {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (fileNameLower.endsWith('.doc')) {
        mimeType = 'application/msword';
      } else if (fileNameLower.endsWith('.xlsx')) {
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (fileNameLower.endsWith('.xls')) {
        mimeType = 'application/vnd.ms-excel';
      } else if (isPdf) {
        mimeType = 'application/pdf';
      } else if (isImage) {
        mimeType = 'image/jpeg';
      } else {
        mimeType = 'application/octet-stream';
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Try Supabase Storage first (for Vercel / Cloud persistence)
    const supabaseResult = await uploadToSupabaseStorage(
      buffer,
      file.name,
      mimeType
    );

    if (supabaseResult?.publicUrl) {
      return NextResponse.json({
        success: true,
        fileUrl: supabaseResult.publicUrl,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        storageProvider: 'supabase',
      });
    }

    // 2. Fallback to local filesystem storage (for local dev)
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });

      const ext = path.extname(file.name);
      const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueFileName = `${Date.now()}-${baseName}${ext}`;
      const filePath = path.join(uploadDir, uniqueFileName);

      await writeFile(filePath, buffer);

      const fileUrl = `/uploads/${uniqueFileName}`;

      return NextResponse.json({
        success: true,
        fileUrl,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        storageProvider: 'local',
      });
    } catch (fsErr: any) {
      console.error('Local filesystem upload error (e.g. read-only Vercel lambda):', fsErr);
      return NextResponse.json(
        { error: 'Storage error. Please configure Supabase Storage credentials.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
