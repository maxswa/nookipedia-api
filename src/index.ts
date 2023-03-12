import type { paths } from './types';

export const NOOKIPEDIA_API_VERSION = '1.0.0'; // This must match the version number in nookipedia-api.yaml

export type GetEndpoint<Path extends keyof paths> = paths[Path]['get'];
export type Params<Path extends keyof paths> = GetEndpoint<Path>['parameters'];
export type Query<Path extends keyof paths> = Params<Path>['query'];
export type Options<Path extends keyof paths> = {
  query?: Query<Path>;
  fetchOptions?: RequestInit;
};

export class NookipediaApi {
  constructor(
    /**
     * API key used to access the Nookipedia API
     */
    public apiKey: string,
    /**
     * Base API URL, defaults to https://api.nookipedia.com/
     */
    public apiUrl = 'https://api.nookipedia.com/'
  ) {}

  async request<Path extends keyof paths>(
    args: (Params<Path> extends { path: unknown }
      ? {
          path: Path;
          replacePath: Params<Path>['path'];
        }
      : {
          path: Path;
          replacePath?: never;
        }) &
      Options<Path>
  ): Promise<
    GetEndpoint<Path>['responses'][200]['content']['application/json']
  > {
    const { path, query, fetchOptions, replacePath } = args;
    let finalPath: string = path;
    Object.entries(replacePath ?? ({} as Record<string, string>)).forEach(
      ([key, value]) => {
        finalPath = finalPath.replace(`{${key}}`, value);
      }
    );
    const url = new URL(finalPath, this.apiUrl);
    if (query) {
      (
        Object.entries(query) as [
          string,
          string | number | string[] | number[]
        ][]
      ).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((val) => {
            url.searchParams.append(key, val.toString());
          });
        } else {
          url.searchParams.set(key, value.toString());
        }
      });
    }
    const headers = new Headers(fetchOptions?.headers);
    headers.set('Accept-Version', NOOKIPEDIA_API_VERSION);
    headers.set('X-API-KEY', this.apiKey);
    const fetchResponse = await fetch(url.href, {
      ...fetchOptions,
      headers
    });
    return fetchResponse.json();
  }

  getAllBugs(options?: Options<'/nh/bugs'>) {
    return this.request({ path: '/nh/bugs', ...options });
  }

  getBug(bug: string, options?: Options<'/nh/bugs/{bug}'>) {
    return this.request({
      path: '/nh/bugs/{bug}',
      replacePath: { bug },
      ...options
    });
  }

  getAllFish(options?: Options<'/nh/fish'>) {
    return this.request({ path: '/nh/fish', ...options });
  }

  getFish(fish: string, options?: Options<'/nh/fish/{fish}'>) {
    return this.request({
      path: '/nh/fish/{fish}',
      replacePath: { fish },
      ...options
    });
  }

  getAllSeaCreatures(options?: Options<'/nh/sea'>) {
    return this.request({ path: '/nh/sea', ...options });
  }

  getSeaCreature(
    sea_creature: string,
    options?: Options<'/nh/sea/{sea_creature}'>
  ) {
    return this.request({
      path: '/nh/sea/{sea_creature}',
      replacePath: { sea_creature },
      ...options
    });
  }
}
