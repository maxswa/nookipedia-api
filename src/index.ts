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

  /**
   * All New Horizons bugs
   * @description Get a list of all bugs and their details in *Animal Crossing: New Horizons*. Note that while cached, this endpoint will be very responsive; however, hitting the endpoint in between cache refreshes can result in a response time of 5 to 15 seconds.
   */
  getAllBugs(options?: OmitOptions<'/nh/bugs'>) {
    return this.request({
      path: '/nh/bugs',
      ...options
    });
  }

  /**
   * All New Horizons bugs by month
   * @param month Value may be the month's name (`jan`, `january`), the integer representing the number (`01`, `1`), or `current` for the current month. When `current` is specified, the return body will be an object with two arrays inside, one called `north` and the other `south` containing the fish available in each respective hemisphere. Note that the current month is calculated based off the API server's time, so it may be slightly off for you at the beginning or end of the month.
   * @description Get a list of all bugs and their details in *Animal Crossing: New Horizons*. Note that while cached, this endpoint will be very responsive; however, hitting the endpoint in between cache refreshes can result in a response time of 5 to 15 seconds.
   */
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

  /**
   * All New Horizons bug names
   * @description Get a list of all bugs and their details in *Animal Crossing: New Horizons*. Note that while cached, this endpoint will be very responsive; however, hitting the endpoint in between cache refreshes can result in a response time of 5 to 15 seconds.
   */
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

  /**
   * All New Horizons bug names by month
   * @param month Value may be the month's name (`jan`, `january`), the integer representing the number (`01`, `1`), or `current` for the current month. When `current` is specified, the return body will be an object with two arrays inside, one called `north` and the other `south` containing the fish available in each respective hemisphere. Note that the current month is calculated based off the API server's time, so it may be slightly off for you at the beginning or end of the month.
   * @description Get a list of all bugs and their details in *Animal Crossing: New Horizons*. Note that while cached, this endpoint will be very responsive; however, hitting the endpoint in between cache refreshes can result in a response time of 5 to 15 seconds.
   */
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

  /**
   * Single New Horizons bug
   * @description Optional extended description in CommonMark or HTML.
   */
  getBug(bug: string, options?: Options<'/nh/bugs/{bug}'>) {
    return this.request({
      path: '/nh/bugs/{bug}',
      replacePath: { bug },
      ...options
    });
  }

  /**
   * All New Horizons fish
   * @description Get a list of all fish and their details in *Animal Crossing: New Horizons*. Note that while cached, this endpoint will be very responsive; however, hitting the endpoint in between cache refreshes can result in a response time of 5 to 15 seconds.
   */
  getAllFish(options?: OmitOptions<'/nh/fish'>) {
    return this.request({
      path: '/nh/fish',
      ...options
    });
  }

  /**
   * All New Horizons fish by month
   * @param month Value may be the month's name (`jan`, `january`), the integer representing the number (`01`, `1`), or `current` for the current month. When `current` is specified, the return body will be an object with two arrays inside, one called `north` and the other `south` containing the fish available in each respective hemisphere. Note that the current month is calculated based off the API server's time, so it may be slightly off for you at the beginning or end of the month.
   * @description Get a list of all fish and their details in *Animal Crossing: New Horizons*. Note that while cached, this endpoint will be very responsive; however, hitting the endpoint in between cache refreshes can result in a response time of 5 to 15 seconds.
   */
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

  /**
   * All New Horizons fish names
   * @description Get a list of all fish and their details in *Animal Crossing: New Horizons*. Note that while cached, this endpoint will be very responsive; however, hitting the endpoint in between cache refreshes can result in a response time of 5 to 15 seconds.
   */
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

  /**
   * All New Horizons fish names by month
   * @param month Value may be the month's name (`jan`, `january`), the integer representing the number (`01`, `1`), or `current` for the current month. When `current` is specified, the return body will be an object with two arrays inside, one called `north` and the other `south` containing the fish available in each respective hemisphere. Note that the current month is calculated based off the API server's time, so it may be slightly off for you at the beginning or end of the month.
   * @description Get a list of all fish and their details in *Animal Crossing: New Horizons*. Note that while cached, this endpoint will be very responsive; however, hitting the endpoint in between cache refreshes can result in a response time of 5 to 15 seconds.
   */
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

  /**
   * Single New Horizons fish
   * @description Optional extended description in CommonMark or HTML.
   */
  getFish(fish: string, options?: Options<'/nh/fish/{fish}'>) {
    return this.request({
      path: '/nh/fish/{fish}',
      replacePath: { fish },
      ...options
    });
  }

  /**
   * All NH sea creatures
   * @description Get a list of all sea creatures and their details in *Animal Crossing: New Horizons*. Note that while cached, this endpoint will be very responsive; however, hitting the endpoint in between cache refreshes can result in a response time of 5 to 15 seconds.
   */
  getAllSeaCreatures(options?: OmitOptions<'/nh/sea'>) {
    return this.request({
      path: '/nh/sea',
      ...options
    });
  }

  /**
   * All NH sea creatures by month
   * @param month Value may be the month's name (`jan`, `january`), the integer representing the number (`01`, `1`), or `current` for the current month. When `current` is specified, the return body will be an object with two arrays inside, one called `north` and the other `south` containing the fish available in each respective hemisphere. Note that the current month is calculated based off the API server's time, so it may be slightly off for you at the beginning or end of the month.
   * @description Get a list of all sea creatures and their details in *Animal Crossing: New Horizons*. Note that while cached, this endpoint will be very responsive; however, hitting the endpoint in between cache refreshes can result in a response time of 5 to 15 seconds.
   */
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

  /**
   * All NH sea creature names
   * @description Get a list of all sea creatures and their details in *Animal Crossing: New Horizons*. Note that while cached, this endpoint will be very responsive; however, hitting the endpoint in between cache refreshes can result in a response time of 5 to 15 seconds.
   */
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

  /**
   * All NH sea creature names by month
   * @param month Value may be the month's name (`jan`, `january`), the integer representing the number (`01`, `1`), or `current` for the current month. When `current` is specified, the return body will be an object with two arrays inside, one called `north` and the other `south` containing the fish available in each respective hemisphere. Note that the current month is calculated based off the API server's time, so it may be slightly off for you at the beginning or end of the month.
   * @description Get a list of all sea creatures and their details in *Animal Crossing: New Horizons*. Note that while cached, this endpoint will be very responsive; however, hitting the endpoint in between cache refreshes can result in a response time of 5 to 15 seconds.
   */
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

  /**
   * Single NH sea creature
   * @description Optional extended description in CommonMark or HTML.
   */
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
