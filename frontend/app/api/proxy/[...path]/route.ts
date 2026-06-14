import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const pathStr = path.join('/');
    const url = new URL(request.url);
    const queryString = url.search;
    const response = await fetch(`${BACKEND_URL}/${pathStr}${queryString}`, {
      signal: AbortSignal.timeout(30000),
    });
    const text = await response.text();
    if (!text) {
      return NextResponse.json({});
    }
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy GET error:', error);
    return NextResponse.json({ documents: [], error: 'Backend error' });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join('/');
  const contentType = request.headers.get('content-type') || '';
  
  let body;
  let headers: Record<string, string> = {};
  
  if (contentType.includes('multipart/form-data')) {
    body = await request.formData();
  } else {
    body = await request.text();
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BACKEND_URL}/${pathStr}`, {
    method: 'POST',
    headers,
    body,
  });

  const respContentType = response.headers.get('content-type');
  if (respContentType?.includes('text/plain')) {
    const text = await response.text();
    return new NextResponse(text, { headers: { 'Content-Type': 'text/plain' } });
  }
  const data = await response.json();
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join('/');
  const response = await fetch(`${BACKEND_URL}/${pathStr}`, { method: 'DELETE' });
  const data = await response.json();
  return NextResponse.json(data);
}