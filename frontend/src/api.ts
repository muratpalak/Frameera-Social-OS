const prefix = '/api'
export async function api<T>(route: string, options?: RequestInit):Promise<T> {
  const response = await fetch(prefix+route, options)
  if(!response.ok) {
    let detail:string = `HTTP ${response.status}`
    try { const data=await response.json(); detail = typeof data.detail==='string' ? data.detail : JSON.stringify(data.detail||detail) } catch { /* ignore */ }
    throw new Error(detail)
  }
  if(response.status===204) return undefined as T
  return response.json() as Promise<T>
}
export function json(method:'POST'|'PATCH', body:unknown):RequestInit {
  return {method, headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}
}
