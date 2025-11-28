
import { WebDAVConfig } from '../types';

export interface WebDAVFile {
  href: string;
  lastModified: string;
  contentLength: number;
  isCollection: boolean;
  name: string;
}

export class WebDAVClient {
  private config: WebDAVConfig;
  private authHeader: string;

  constructor(config: WebDAVConfig) {
    this.config = config;
    this.authHeader = 'Basic ' + btoa(`${config.username}:${config.password || ''}`);
  }

  private getUrl(path: string): string {
    // Remove trailing slash from base and leading slash from path to avoid doubles
    const base = this.config.url.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    return `${base}/${cleanPath}`;
  }

  private async request(method: string, path: string, body?: BodyInit | null, headers: Record<string, string> = {}): Promise<Response> {
    const url = this.getUrl(path);
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': this.authHeader,
        ...headers
      },
      body
    });

    if (response.status === 401) {
      throw new Error('WebDAV Authentication Failed');
    }
    
    return response;
  }

  async exists(path: string): Promise<boolean> {
    try {
      const response = await this.request('PROPFIND', path, null, { 'Depth': '0' });
      return response.status >= 200 && response.status < 300;
    } catch (e) {
      return false;
    }
  }

  async mkcol(path: string): Promise<void> {
    const response = await this.request('MKCOL', path);
    if (response.status !== 201 && response.status !== 405) { // 405 = already exists
      throw new Error(`Failed to create directory: ${path}`);
    }
  }

  async put(path: string, data: string | Blob): Promise<void> {
    const response = await this.request('PUT', path, data);
    if (!response.ok) {
      throw new Error(`Failed to upload file: ${path}`);
    }
  }

  async get(path: string): Promise<string> {
    const response = await this.request('GET', path);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${path}`);
    }
    return await response.text();
  }

  // Parse directory listing
  async listFiles(path: string): Promise<WebDAVFile[]> {
    const response = await this.request('PROPFIND', path, null, { 'Depth': '1' });
    if (!response.ok) return [];

    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const responses = Array.from(xml.querySelectorAll('response'));

    const files: WebDAVFile[] = [];
    
    // Helper to handle namespace prefixes (D: vs d: vs none)
    const getText = (el: Element, tagName: string) => {
        const node = el.getElementsByTagName(tagName)[0] || 
                     el.getElementsByTagName('D:' + tagName)[0] || 
                     el.getElementsByTagName('d:' + tagName)[0];
        return node ? node.textContent : '';
    };

    responses.forEach(resp => {
      const href = getText(resp, 'href') || '';
      const propstat = resp.querySelector('propstat');
      if (!propstat) return;

      const prop = propstat.querySelector('prop');
      if (!prop) return;

      const lastModified = getText(prop, 'getlastmodified') || '';
      const contentLength = parseInt(getText(prop, 'getcontentlength') || '0', 10);
      const resourcetype = prop.getElementsByTagName('resourcetype')[0] || 
                           prop.getElementsByTagName('D:resourcetype')[0] || 
                           prop.getElementsByTagName('d:resourcetype')[0];
      
      const isCollection = resourcetype && (
          resourcetype.getElementsByTagName('collection').length > 0 ||
          resourcetype.getElementsByTagName('D:collection').length > 0 ||
          resourcetype.getElementsByTagName('d:collection').length > 0
      );
      
      // Filter out the requested directory itself
      // Usually href ends with the requested path
      // Simple logic: if href equals requested path (normalized), skip
      
      const name = href.replace(/\/$/, '').split('/').pop() || '';
      
      if (name) {
          files.push({
            href,
            name,
            lastModified,
            contentLength,
            isCollection: !!isCollection
          });
      }
    });

    return files.filter(f => f.name !== path.replace(/\/$/, '').split('/').pop());
  }
}
