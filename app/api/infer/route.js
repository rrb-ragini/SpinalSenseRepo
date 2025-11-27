// app/api/infer/route.js
import { analyzeImageWithVision } from "../vision/route.js"; // adjust path if needed

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('file'); // frontend must use fd.append('file', file)

    if (!file) {
      return Response.json({ error: "No file. Expected form key 'file'." }, { status: 400 });
    }

    // Basic validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return Response.json({ error: 'Unsupported file type: ' + file.type }, { status: 400 });
    }

    // Read bytes
    const buffer = Buffer.from(await file.arrayBuffer());

    // Call analysis helper (will preprocess and call OpenAI)
    const result = await analyzeImageWithVision(buffer, file.type, { maxSize: 1024 });

    if (!result) {
      return Response.json({ error: 'Analysis failed (no result).' }, { status: 500 });
    }

    // If model says cannot measure => forward message (status 400)
    if (result.can_measure === false) {
      return Response.json({
        error: 'Could not interpret this X-ray.',
        explanation: result.explanation ?? 'Image quality / orientation / spine not visible',
      }, { status: 400 });
    }

    // Success
    return Response.json({
      cobb_angle: typeof result.cobb_angle === 'number' ? result.cobb_angle : null,
      severity: result.severity ?? null,
      explanation: result.explanation ?? null,
      overlay_url: result.overlay_url ?? null
    }, { status: 200 });

  } catch (err) {
    console.error('infer route error:', err);
    return Response.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}
