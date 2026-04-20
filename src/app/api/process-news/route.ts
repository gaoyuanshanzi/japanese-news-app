import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import { translate } from '@vitalets/google-translate-api';
import path from 'path';

// Note: Kuroshiro initialization can be slow, so we cache it globally in development
let kuroshiroInstance: Kuroshiro | null = null;

async function getKuroshiro() {
  if (kuroshiroInstance) return kuroshiroInstance;
  
  const kuroshiro = new Kuroshiro();
  
  // Need to provide the dictionary path for Kuromoji.
  // We use the public/dict folder so Vercel can trace it correctly.
  const dictPath = path.join(process.cwd(), 'public', 'dict');
  
  await kuroshiro.init(new KuromojiAnalyzer({ dictPath }));
  kuroshiroInstance = kuroshiro;
  return kuroshiro;
}

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

    // 3. Add Furigana using Kuroshiro
    const kuroshiro = await getKuroshiro();
    // Use 'ruby' mode for HTML generation, romanji/hiragana/katakana depends on to parameter
    const furiganaHtml = await kuroshiro.convert(cleanText, {
      to: 'hiragana',
      mode: 'furigana',
    });

    // 4. Translate to Korean
    // We split into chunks if needed, but google-translate-api usually handles reasonably sized texts.
    // For large articles, might need to chunk, but Yahoo news is usually short.
    let translation = "";
    try {
      const res = await translate(cleanText, { to: 'ko' });
      translation = res.text;
    } catch (translateError) {
      console.error("Translation error:", translateError);
      translation = "Translation failed or rate limited.";
    }

    return NextResponse.json({
      title: article.title,
      furiganaHtml: furiganaHtml,
      translation: translation
    });
  } catch (error) {
    console.error('Error processing news:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
