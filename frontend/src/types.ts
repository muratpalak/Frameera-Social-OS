export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'linkedin'
export type Status = 'draft' | 'scheduled' | 'published'
export type Kind = 'post' | 'reel' | 'story' | 'video' | 'carousel'
export type Page = 'dashboard' | 'calendar' | 'content' | 'library' | 'analytics' | 'clients' | 'studio'
export type Lang = 'tr' | 'de' | 'en'
export interface Client { id:number; name:string; industry:string; color:string; brand_voice:string; accounts:Record<string,string>; created_at:string }
export interface Post { id:number; client_id:number; platform:Platform; title:string; caption:string; content_type:Kind; status:Status; scheduled_at:string|null; asset_id:number|null; created_at:string }
export type PostPayload = Omit<Post, 'id'|'created_at'>
export interface Asset {id:number; client_id:number; filename:string; mime_type:string; size_bytes:number;url:string;created_at:string}
export interface DailyMetric {day:string;impressions:number;reach:number;engagements:number;views:number;followers_gained:number}
export interface PlatformMetric {platform:Platform;impressions:number;reach:number;engagements:number;views:number;followers_gained:number;engagement_rate:number}
export interface Analytics {summary:Omit<DailyMetric,'day'> & {engagement_rate:number};daily:DailyMetric[];platforms:PlatformMetric[];source:{demo_entries:number;manual_entries:number};days:number}
export interface CaptionVariant {title:string;caption:string;hashtags:string}
