import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { translate } from '@vitalets/google-translate-api';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 1. Fetch the News HTML
    const response = await fetch(url);
    const html = await response.text();

    // 2. Extract article content using Readability
    const doc = new JSDOM(html, { url });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      return NextResponse.json({ error: 'Failed to parse article content' }, { status: 500 });
    }

    // Clean up empty lines and trim
    const cleanText = article.textContent
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .join('\n\n');

    // We now do Furigana on the client side to avoid Vercel timeouts and dictionary path issues.
    
    // 3. Translate to Korean
    let translation = "";
    try {
      const res = await translate(cleanText, { to: 'ko' });
      translation = res.text;
    } catch (translateError: any) {
      console.error("Translation error:", translateError);
      translation = "Translation failed: " + translateError.message;
    }

    return NextResponse.json({
      title: article.title,
      rawText: cleanText,
      translation: translation
    });
  } catch (error: any) {
    console.error('Error processing news:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error', stack: error.stack }, { status: 500 });
  }
}
