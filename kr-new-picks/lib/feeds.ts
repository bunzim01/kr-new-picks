import { FeedConfig } from './types';

// 10개 RSS 피드 설정
export const RSS_FEEDS: FeedConfig[] = [
  {
    name: 'TechCrunch',
    url: 'https://feeds.feedburner.com/TechCrunch',
    priority: 'high',
    defaultCategory: 'Gadgets'
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    priority: 'high',
    defaultCategory: 'Gadgets'
  },
  {
    name: 'Wired',
    url: 'https://feeds.wired.com/wired/index',
    priority: 'high',
    defaultCategory: 'Gadgets'
  },
  {
    name: 'Product Hunt',
    url: 'https://www.producthunt.com/feed',
    priority: 'high',
    defaultCategory: 'Gadgets'
  },
  {
    name: 'Engadget',
    url: 'https://feeds.feedburner.com/Engadget',
    priority: 'medium',
    defaultCategory: 'Gadgets'
  },
  {
    name: 'Gizmodo',
    url: 'https://gizmodo.com/rss',
    priority: 'medium',
    defaultCategory: 'Gadgets'
  },
  {
    name: 'Mashable',
    url: 'https://mashable.com/feeds/rss/all',
    priority: 'medium'
  },
  {
    name: 'Cool Things',
    url: 'https://www.coolthings.com/feed',
    priority: 'medium',
    defaultCategory: 'Home'
  },
  {
    name: 'Uncrate',
    url: 'https://uncrate.com/feed',
    priority: 'medium',
    defaultCategory: 'Home'
  },
  {
    name: 'High Consumption',
    url: 'https://hiconsumption.com/feed',
    priority: 'low'
  }
];

// 피드별 메타데이터
export const FEED_METADATA: Record<string, { priority: 'high' | 'medium' | 'low' }> = {
  TechCrunch: { priority: 'high' },
  'The Verge': { priority: 'high' },
  Wired: { priority: 'high' },
  'Product Hunt': { priority: 'high' },
  Engadget: { priority: 'medium' },
  Gizmodo: { priority: 'medium' },
  Mashable: { priority: 'medium' },
  'Cool Things': { priority: 'medium' },
  Uncrate: { priority: 'medium' },
  'High Consumption': { priority: 'low' }
};
