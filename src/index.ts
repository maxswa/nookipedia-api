import type { paths, components } from './types';

export const NOOKIPEDIA_API_VERSION = '1.0.0'; // This must match the version number in nookipedia-api.yaml

export type GetEndpoint<Path extends keyof paths> = paths[Path]['get'];
export type Params<Path extends keyof paths> = GetEndpoint<Path>['parameters'];
export type Query<Path extends keyof paths> = Params<Path>['query'];
export type JsonResponse<Path extends keyof paths> =
  GetEndpoint<Path>['responses'][200]['content']['application/json'];
export type OmitOptions<Path extends keyof paths> = {
  query?: Omit<Query<Path>, 'month' | 'excludedetails'>;
  fetchOptions?: RequestInit;
};
export type Options<Path extends keyof paths> = {
  query?: Query<Path>;
  fetchOptions?: RequestInit;
};
export type MonthResponse<Items> = {
  month: string;
  north: Items;
  south: Items;
};
export type ErrorBody = {
  title?: string;
  details?: string;
};

export class NookipediaError extends Error {
  constructor(public body: ErrorBody, public code?: number) {
    super(body.title);
  }
}
export class NookipediaError401 extends NookipediaError {
  public code = 401;
  constructor(public body: components['schemas']['Error401']) {
    super(body);
  }
}
export class NookipediaError404 extends NookipediaError {
  public code = 404;
  constructor(public body: components['schemas']['Error404']) {
    super(body);
  }
}
export class NookipediaError500 extends NookipediaError {
  public code = 500;
  constructor(public body: components['schemas']['Error500']) {
    super(body);
  }
}

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

  async request<
    Path extends keyof paths,
    Response extends unknown = JsonResponse<Path>
  >(
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
  ): Promise<Response> {
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
    const body = await fetchResponse.json();
    if (fetchResponse.ok) {
      return body;
    }
    switch (fetchResponse.status) {
      case 401:
        throw new NookipediaError401(body);
      case 404:
        throw new NookipediaError404(body);
      case 500:
        throw new NookipediaError500(body);
      default:
        throw new NookipediaError(
          { title: 'Failed to fetch Nookipedia API' },
          fetchResponse.status
        );
    }
  }

  getAllBugs(options?: OmitOptions<'/nh/bugs'>) {
    return this.request({
      path: '/nh/bugs',
      ...options
    });
  }

  getAllBugsByMonth(month: string, options?: OmitOptions<'/nh/bugs'>) {
    return this.request<'/nh/bugs', MonthResponse<JsonResponse<'/nh/bugs'>>>({
      path: '/nh/bugs',
      ...options,
      query: {
        ...options?.query,
        month
      }
    });
  }

  getAllBugNames(options?: OmitOptions<'/nh/bugs'>) {
    return this.request<'/nh/bugs', string[]>({
      path: '/nh/bugs',
      ...options,
      query: {
        ...options?.query,
        excludedetails: 'true'
      }
    });
  }

  getAllBugNamesByMonth(month: string, options?: OmitOptions<'/nh/bugs'>) {
    return this.request<'/nh/bugs', MonthResponse<string[]>>({
      path: '/nh/bugs',
      ...options,
      query: {
        ...options?.query,
        excludedetails: 'true',
        month
      }
    });
  }

  getBug(bug: string, options?: Options<'/nh/bugs/{bug}'>) {
    return this.request({
      path: '/nh/bugs/{bug}',
      replacePath: { bug },
      ...options
    });
  }

  getAllFish(options?: OmitOptions<'/nh/fish'>) {
    return this.request({
      path: '/nh/fish',
      ...options
    });
  }

  getAllFishByMonth(month: string, options?: OmitOptions<'/nh/fish'>) {
    return this.request<'/nh/fish', MonthResponse<JsonResponse<'/nh/fish'>>>({
      path: '/nh/fish',
      ...options,
      query: {
        ...options?.query,
        month
      }
    });
  }

  getAllFishNames(options?: OmitOptions<'/nh/fish'>) {
    return this.request<'/nh/fish', string[]>({
      path: '/nh/fish',
      ...options,
      query: {
        ...options?.query,
        excludedetails: 'true'
      }
    });
  }

  getAllFishNamesByMonth(month: string, options?: OmitOptions<'/nh/fish'>) {
    return this.request<'/nh/fish', MonthResponse<string[]>>({
      path: '/nh/fish',
      ...options,
      query: {
        ...options?.query,
        excludedetails: 'true',
        month
      }
    });
  }

  getFish(fish: string, options?: Options<'/nh/fish/{fish}'>) {
    return this.request({
      path: '/nh/fish/{fish}',
      replacePath: { fish },
      ...options
    });
  }

  getAllSeaCreatures(options?: OmitOptions<'/nh/sea'>) {
    return this.request({
      path: '/nh/sea',
      ...options
    });
  }

  getAllSeaCreaturesByMonth(month: string, options?: OmitOptions<'/nh/sea'>) {
    return this.request<'/nh/sea', MonthResponse<JsonResponse<'/nh/sea'>>>({
      path: '/nh/sea',
      ...options,
      query: {
        ...options?.query,
        month
      }
    });
  }

  getAllSeaCreatureNames(options?: OmitOptions<'/nh/sea'>) {
    return this.request<'/nh/sea', string[]>({
      path: '/nh/sea',
      ...options,
      query: {
        ...options?.query,
        excludedetails: 'true'
      }
    });
  }

  getAllSeaCreatureNamesByMonth(
    month: string,
    options?: OmitOptions<'/nh/sea'>
  ) {
    return this.request<'/nh/sea', MonthResponse<string[]>>({
      path: '/nh/sea',
      ...options,
      query: {
        ...options?.query,
        excludedetails: 'true',
        month
      }
    });
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
