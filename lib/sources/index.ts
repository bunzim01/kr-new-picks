// 수집 소스 오케스트레이터 — CSV 파일, YouTube API, Instagram API 를 돌려 하나의 목록으로 합친다
// 같은 (플랫폼, 계정) 이 여러 소스에 있으면 나중 소스가 비어 있는 값만 채운다.

import fs from 'fs'
import path from 'path'
import { RawInfluencer } from '../influencer-types'
import { csvToInfluencers } from './csv'
import { searchYouTubeChannels } from './youtube'
import { fetchInstagramProfiles } from './instagram'

export interface SourceOptions {
  csvPaths?: string[]          // 파일 또는 폴더 (기본: data/influencers)
  youtubeKeywords?: string[]   // 비어 있으면 YouTube 수집 안 함
  youtubeLiveCheckLimit?: number
  instagramHandles?: string[]  // 추가로 조회할 계정
  enrichInstagram?: boolean    // CSV 의 Instagram 계정을 API 로 갱신
}

export interface SourceReport {
  source: string
  count: number
  notes: string[]
}

export interface SourceResult {
  rows: RawInfluencer[]
  report: SourceReport[]
}

function listCsvFiles(paths: string[]): string[] {
  const files: string[] = []
  for (const p of paths) {
    if (!fs.existsSync(p)) continue
    const stat = fs.statSync(p)
    if (stat.isDirectory()) {
      for (const f of fs.readdirSync(p)) {
        if (f.toLowerCase().endsWith('.csv')) files.push(path.join(p, f))
      }
    } else if (p.toLowerCase().endsWith('.csv')) {
      files.push(p)
    }
  }
  return files
}

/** 같은 (플랫폼, 계정) 끼리 합친다 — 앞선 값이 null/빈 값이면 뒤의 값으로 채운다 */
export function mergeInfluencers(lists: RawInfluencer[][]): RawInfluencer[] {
  const byKey = new Map<string, RawInfluencer>()
  for (const list of lists) {
    for (const r of list) {
      const key = `${r.platform}:${r.handle.toLowerCase()}`
      const prev = byKey.get(key)
      if (!prev) { byKey.set(key, { ...r }); continue }
      const merged = { ...prev } as Record<string, unknown>
      for (const [k, v] of Object.entries(r)) {
        const cur = merged[k]
        const empty = cur === null || cur === undefined || cur === '' || cur === false || cur === 0
        if (empty && v !== null && v !== undefined && v !== '') merged[k] = v
      }
      // 최신 팔로워 수는 더 큰 쪽이 아니라 나중 소스(API) 를 우선
      if (r.source.endsWith('-api') && r.followers > 0) merged.followers = r.followers
      merged.source = `${prev.source}+${r.source}`
      byKey.set(key, merged as unknown as RawInfluencer)
    }
  }
  return [...byKey.values()]
}

export async function runSources(opts: SourceOptions = {}): Promise<SourceResult> {
  const report: SourceReport[] = []
  const lists: RawInfluencer[][] = []

  // 1. CSV
  const csvFiles = listCsvFiles(opts.csvPaths ?? [path.join(process.cwd(), 'data', 'influencers')])
  for (const file of csvFiles) {
    const text = fs.readFileSync(file, 'utf-8')
    const name = path.basename(file, '.csv')
    const { rows, skipped } = csvToInfluencers(text, `csv:${name}`)
    lists.push(rows)
    report.push({ source: `CSV ${path.basename(file)}`, count: rows.length, notes: skipped.slice(0, 20) })
  }

  // 2. YouTube 키워드 검색
  if (opts.youtubeKeywords && opts.youtubeKeywords.length > 0) {
    const { rows, searches, warnings } = await searchYouTubeChannels(opts.youtubeKeywords, {
      liveCheckLimit: opts.youtubeLiveCheckLimit,
    })
    lists.push(rows)
    report.push({ source: 'YouTube API', count: rows.length, notes: [`검색 ${searches}회 사용`, ...warnings] })
  }

  // 3. Instagram 계정 조회 (CSV 의 Instagram 계정 갱신 + 추가 계정)
  const igHandles = new Set<string>(opts.instagramHandles ?? [])
  if (opts.enrichInstagram) {
    for (const list of lists) for (const r of list) if (r.platform === 'instagram') igHandles.add(r.handle)
  }
  if (igHandles.size > 0) {
    const { rows, warnings } = await fetchInstagramProfiles([...igHandles])
    lists.push(rows)
    report.push({ source: 'Instagram API', count: rows.length, notes: warnings.slice(0, 20) })
  }

  return { rows: mergeInfluencers(lists), report }
}
