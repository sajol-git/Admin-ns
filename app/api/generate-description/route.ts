import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { name, category, brand } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
    
    const prompt = `Write a premium, SEO-optimized product description for an e-commerce store.
    Product Name: ${name}
    Category: ${category || 'General'}
    Brand: ${brand || 'Unknown'}
    
    The description should be engaging, highlight key benefits, and be formatted in HTML (use <p>, <ul>, <li>, <strong> tags). Keep it under 150 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return NextResponse.json({ description: response.text });
  } catch (error) {
    console.error('Error generating description:', error);
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}
