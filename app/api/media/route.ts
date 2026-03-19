import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    // Fetch resources from the 'needieshop' folder
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'needieshop/', // Folder prefix
      max_results: 100,
    });

    return NextResponse.json({ resources: result.resources });
  } catch (error) {
    console.error('Cloudinary API error:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}
