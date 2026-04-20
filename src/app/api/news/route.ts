import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export async function GET() {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL('https://news.yahoo.co.jp/rss/topics/top-picks.xml');
    
    // Get the first 5 news items
    const top5 = feed.items.slice(0, 5).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
    }));

    return NextResponse.json({ items: top5 });
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
