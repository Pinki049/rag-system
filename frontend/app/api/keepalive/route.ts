export async function GET() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
  try {
    await fetch(`${BACKEND_URL}/health`);
    return Response.json({ status: 'ok' });
  } catch {
    return Response.json({ status: 'error' });
  }
}