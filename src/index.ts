import type { paths, components } from './types';

export const NOOKIPEDIA_API_VERSION = '1.6.0'; // This must match the version number in nookipedia-api.yaml

export type GetEndpoint<Path extends keyof paths> = paths[Path]['get'];
export type Params<Path extends keyof paths> = GetEndpoint<Path>['parameters'];
export type Query<Path extends keyof paths> = Params<Path>['query'];
export type JsonResponse<Path extends keyof paths> =
  GetEndpoint<Path>['responses'][200]['content']['application/json'];
export type OmitOptions<
  Path extends keyof paths,
  OmitKeys extends keyof Query<Path> = never
> = {
  query?: Omit<Query<Path>, 'month' | 'excludedetails' | OmitKeys>;
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
export type RecipeOptionOverride = {
  query?: {
    /** @description Specify a material to only get recipes that use that material. You can specify `material` up to six times (no recipe uses more than six materials). */
    material?: string | string[];
  };
};

export class NookipediaError extends Error {
  constructor(public body: ErrorBody, public code?: number) {
    super(body.title);
  }
}
export class NookipediaError400 extends NookipediaError {
  public code = 400;
  constructor(public body: components['schemas']['Error400']) {
    super(body);
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
      case 400:
        throw new NookipediaError400(body);
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
   * All New Horizons artwork
   * @description Get a list of all artwork and their details in *Animal Crossing: New Horizons*.
   */
  getAllArtwork(options?: OmitOptions<'/nh/art'>) {
    return this.request({
      path: '/nh/art',
      ...options
    });
  }

  /**
   * All New Horizons artwork names
   * @description Get a list of all artwork and their details in *Animal Crossing: New Horizons*.
   */
  getAllArtworkNames(options?: OmitOptions<'/nh/art'>) {
    return this.request<'/nh/art', string[]>({
      path: '/nh/art',
      ...options,
      query: {
        ...options?.query,
        excludedetails: 'true'
      }
    });
  }

  /**
   * Single New Horizons artwork
   * @description Retrieve information about a specific artwork in *Animal Crossing: New Horizons*.
   */
  getArtwork(artwork: string, options?: Options<'/nh/art/{artwork}'>) {
    return this.request({
      path: '/nh/art/{artwork}',
      replacePath: { artwork },
      ...options
    });
  }

  /**
   * All New Horizons bugs
   * @description Get a list of all bugs and their details in *Animal Crossing: New Horizons*.
   */
  getAllBugs(options?: OmitOptions<'/nh/bugs'>) {
    return this.request({
      path: '/nh/bugs',
      ...options
    });
  }

  /**
   * All New Horizons bugs by month
   * @param month Value may be the month's name (`jan`, `january`), the integer representing the month (`01`, `1`), or `current` for the current month. When `current` is specified, the return body will be an object with two arrays inside, one called `north` and the other `south` containing the fish available in each respective hemisphere. Note that the current month is calculated based off the API server's time, so it may be slightly off for you at the beginning or end of the month.
   * @description Get a list of all bugs and their details in *Animal Crossing: New Horizons*.
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
   * @description Get a list of all bugs and their details in *Animal Crossing: New Horizons*.
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
   * @param month Value may be the month's name (`jan`, `january`), the integer representing the month (`01`, `1`), or `current` for the current month. When `current` is specified, the return body will be an object with two arrays inside, one called `north` and the other `south` containing the fish available in each respective hemisphere. Note that the current month is calculated based off the API server's time, so it may be slightly off for you at the beginning or end of the month.
   * @description Get a list of all bugs and their details in *Animal Crossing: New Horizons*.
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
   * @description Retrieve information about a specific bug in *Animal Crossing: New Horizons*.
   */
  getBug(bug: string, options?: Options<'/nh/bugs/{bug}'>) {
    return this.request({
      path: '/nh/bugs/{bug}',
      replacePath: { bug },
      ...options
    });
  }

  /**
   * All New Horizons clothing
   * @description Get a list of all clothing items and their details in *Animal Crossing: New Horizons*.
   */
  getAllClothing(options?: OmitOptions<'/nh/clothing'>) {
    return this.request({
      path: '/nh/clothing',
      ...options
    });
  }

  /**
   * All New Horizons clothing names
   * @description Get a list of all clothing items and their details in *Animal Crossing: New Horizons*.
   */
  getAllClothingNames(options?: OmitOptions<'/nh/clothing'>) {
    return this.request<'/nh/clothing', string[]>({
      path: '/nh/clothing',
      ...options,
      query: {
        ...options?.query,
        excludedetails: 'true'
      }
    });
  }

  /**
   * Single New Horizons clothing
   * @description Retrieve information about a specific clothing item in *Animal Crossing: New Horizons*.
   */
  getClothing(clothing: string, options?: Options<'/nh/clothing/{clothing}'>) {
    return this.request({
      path: '/nh/clothing/{clothing}',
      replacePath: { clothing },
      ...options
    });
  }

  /**
   * All New Horizons events
   * @description Get a list of all ongoing or upcoming events in *Animal Crossing: New Horizons*.
   */
  getAllEvents(options?: Options<'/nh/events'>) {
    return this.request({
      path: '/nh/events',
      ...options
    });
  }

  /**
   * All New Horizons fish
   * @description Get a list of all fish and their details in *Animal Crossing: New Horizons*.
   */
  getAllFish(options?: OmitOptions<'/nh/fish'>) {
    return this.request({
      path: '/nh/fish',
      ...options
    });
  }

  /**
   * All New Horizons fish by month
   * @param month Value may be the month's name (`jan`, `january`), the integer representing the month (`01`, `1`), or `current` for the current month. When `current` is specified, the return body will be an object with two arrays inside, one called `north` and the other `south` containing the fish available in each respective hemisphere. Note that the current month is calculated based off the API server's time, so it may be slightly off for you at the beginning or end of the month.
   * @description Get a list of all fish and their details in *Animal Crossing: New Horizons*.
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
   * @description Get a list of all fish and their details in *Animal Crossing: New Horizons*.
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
   * @param month Value may be the month's name (`jan`, `january`), the integer representing the month (`01`, `1`), or `current` for the current month. When `current` is specified, the return body will be an object with two arrays inside, one called `north` and the other `south` containing the fish available in each respective hemisphere. Note that the current month is calculated based off the API server's time, so it may be slightly off for you at the beginning or end of the month.
   * @description Get a list of all fish and their details in *Animal Crossing: New Horizons*.
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
   * @description Retrieve information about a specific fish in *Animal Crossing: New Horizons*.
   */
  getFish(fish: string, options?: Options<'/nh/fish/{fish}'>) {
    return this.request({
      path: '/nh/fish/{fish}',
      replacePath: { fish },
      ...options
    });
  }

  /**
   * All New Horizons fossil groups with individual fossils
   * @description Get a list of all the fossil groups with their respective individual fossils in *Animal Crossing: New Horizons*.
   */
  getAllFossilGroupsWithFossils(options?: Options<'/nh/fossils/all'>) {
    return this.request({ path: '/nh/fossils/all', ...options });
  }

  /**
   * Single New Horizons fossil group with individual fossils
   * @description Retrieve information about a specific fossil group with their respective individual fossils in *Animal Crossing: New Horizons*.
   */
  getFossilGroupWithFossils(
    fossil: string,
    options?: Options<'/nh/fossils/all/{fossil}'>
  ) {
    return this.request({
      path: '/nh/fossils/all/{fossil}',
      replacePath: { fossil },
      ...options
    });
  }

  /**
   * All New Horizons fossil groups
   * @description Get a list of all the fossil groups in *Animal Crossing: New Horizons*.
   */
  getAllFossilGroups(options?: Options<'/nh/fossils/groups'>) {
    return this.request({ path: '/nh/fossils/groups', ...options });
  }

  /**
   * Single New Horizons fossil group
   * @description Retrieve information about a specific fossil group in *Animal Crossing: New Horizons*.
   */
  getFossilGroup(
    fossil_group: string,
    options?: Options<'/nh/fossils/groups/{fossil_group}'>
  ) {
    return this.request({
      path: '/nh/fossils/groups/{fossil_group}',
      replacePath: { fossil_group },
      ...options
    });
  }

  /**
   * All New Horizons fossils
   * @description Get a list of all the individual fossils in *Animal Crossing: New Horizons*.
   */
  getAllFossils(options?: Options<'/nh/fossils/individuals'>) {
    return this.request({ path: '/nh/fossils/individuals', ...options });
  }

  /**
   * Single New Horizons fossil
   * @description Retrieve information about a specific individual fossil in *Animal Crossing: New Horizons*.
   */
  getFossil(
    fossil: string,
    options?: Options<'/nh/fossils/individuals/{fossil}'>
  ) {
    return this.request({
      path: '/nh/fossils/individuals/{fossil}',
      replacePath: { fossil },
      ...options
    });
  }

  /**
   * All New Horizons furniture
   * @description Get a list of all furniture and their details in *Animal Crossing: New Horizons*.
   */
  getAllFurniture(options?: OmitOptions<'/nh/furniture'>) {
    return this.request({
      path: '/nh/furniture',
      ...options
    });
  }

  /**
   * All New Horizons furniture names
   * @description Get a list of all furniture and their details in *Animal Crossing: New Horizons*.
   */
  getAllFurnitureNames(options?: OmitOptions<'/nh/furniture'>) {
    return this.request<'/nh/furniture', string[]>({
      path: '/nh/furniture',
      ...options,
      query: {
        ...options?.query,
        excludedetails: 'true'
      }
    });
  }

  /**
   * Single New Horizons furniture
   * @description Retrieve information about a specific furniture in *Animal Crossing: New Horizons*.
   */
  getFurniture(
    furniture: string,
    options?: OmitOptions<'/nh/furniture/{furniture}'>
  ) {
    return this.request({
      path: '/nh/furniture/{furniture}',
      replacePath: { furniture },
      ...options
    });
  }

  /**
   * All New Horizons interior items
   * @description Get a list of all interior items (flooring, wallpaper, and rugs) and their details in *Animal Crossing: New Horizons*.
   */
  getAllInteriorItems(options?: OmitOptions<'/nh/interior'>) {
    return this.request({
      path: '/nh/interior',
      ...options
    });
  }

  /**
   * All New Horizons interior item names
   * @description Get a list of all interior items (flooring, wallpaper, and rugs) and their details in *Animal Crossing: New Horizons*.
   */
  getAllInteriorItemNames(options?: OmitOptions<'/nh/interior'>) {
    return this.request<'/nh/interior', string[]>({
      path: '/nh/interior',
      ...options,
      query: {
        ...options?.query,
        excludedetails: 'true'
      }
    });
  }

  /**
   * Single New Horizons interior item
   * @description Retrieve information about a specific interior item in *Animal Crossing: New Horizons*.
   */
  getInteriorItem(item: string, options?: Options<'/nh/interior/{item}'>) {
    return this.request({
      path: '/nh/interior/{item}',
      replacePath: { item },
      ...options
    });
  }

  /**
   * Miscellaneous New Horizons items
   * @description Get a list of all miscellaneous items (such as materials, star fragments, fruits, fences, and plants) and their details in *Animal Crossing: New Horizons*.
   */
  getAllMiscellaneousItems(options?: OmitOptions<'/nh/items'>) {
    return this.request({
      path: '/nh/items',
      ...options
    });
  }

  /**
   * Miscellaneous New Horizons item names
   * @description Get a list of all miscellaneous items (such as materials, star fragments, fruits, fences, and plants) and their details in *Animal Crossing: New Horizons*.
   */
  getAllMiscellaneousItemNames(options?: OmitOptions<'/nh/items'>) {
    return this.request<'/nh/items', string[]>({
      path: '/nh/items',
      ...options,
      query: {
        ...options?.query,
        excludedetails: 'true'
      }
    });
  }

  /**
   * Single New Horizons miscellaneous item
   * @description Retrieve information about a miscellaneous item (such as materials, star fragments, fruits, fences, and plants) in *Animal Crossing: New Horizons*.
   */
  getMiscellaneousItem(item: string, options?: Options<'/nh/items/{item}'>) {
    return this.request({
      path: '/nh/items/{item}',
      replacePath: { item },
      ...options
    });
  }

  /**
   * All New Horizons photos and posters
   * @description Get a list of all character photos+posters and their details in *Animal Crossing: New Horizons*.
   */
  getAllPhotosAndPosters(options?: OmitOptions<'/nh/photos'>) {
    return this.request({
      path: '/nh/photos',
      ...options
    });
  }

  /**
   * All New Horizons photo and poster names
   * @description Get a list of all character photos+posters and their details in *Animal Crossing: New Horizons*.
   */
  getAllPhotoAndPosterNames(options?: OmitOptions<'/nh/photos'>) {
    return this.request<'/nh/photos', string[]>({
      path: '/nh/photos',
      ...options,
      query: {
        ...options?.query,
        excludedetails: 'true'
      }
    });
  }

  /**
   * Single New Horizons photo or poster
   * @description Retrieve information about a character photo or poster in *Animal Crossing: New Horizons*.
   */
  getPhotoOrPoster(item: string, options?: Options<'/nh/photos/{item}'>) {
    return this.request({
      path: '/nh/photos/{item}',
      replacePath: { item },
      ...options
    });
  }

  /**
   * All New Horizons recipes
   * @description Get a list of all recipes and their details in *Animal Crossing: New Horizons*.
   */
  getAllRecipes(
    options?: OmitOptions<'/nh/recipes', 'material'> & RecipeOptionOverride
  ) {
    return this.request({
      path: '/nh/recipes',
      ...(options as Options<'/nh/recipes'>)
    });
  }

  /**
   * All New Horizons recipe names
   * @description Get a list of all recipes and their details in *Animal Crossing: New Horizons*.
   */
  getAllRecipeNames(
    options?: OmitOptions<'/nh/recipes', 'material'> & RecipeOptionOverride
  ) {
    return this.request<'/nh/recipes', string[]>({
      path: '/nh/recipes',
      ...options,
      query: {
        ...options?.query,
        excludedetails: 'true'
      } as Query<'/nh/recipes'>
    });
  }

  /**
   * Single New Horizons recipe
   * @description Retrieve information about a specific recipe in *Animal Crossing: New Horizons*.
   */
  getRecipe(item: string, options?: Options<'/nh/recipes/{item}'>) {
    return this.request({
      path: '/nh/recipes/{item}',
      replacePath: { item },
      ...options
    });
  }

  /**
   * All New Horizons sea creatures
   * @description Get a list of all sea creatures and their details in *Animal Crossing: New Horizons*.
   */
  getAllSeaCreatures(options?: OmitOptions<'/nh/sea'>) {
    return this.request({
      path: '/nh/sea',
      ...options
    });
  }

  /**
   * All New Horizons sea creatures by month
   * @param month Value may be the month's name (`jan`, `january`), the integer representing the month (`01`, `1`), or `current` for the current month. When `current` is specified, the return body will be an object with two arrays inside, one called `north` and the other `south` containing the fish available in each respective hemisphere. Note that the current month is calculated based off the API server's time, so it may be slightly off for you at the beginning or end of the month.
   * @description Get a list of all sea creatures and their details in *Animal Crossing: New Horizons*.
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
   * All New Horizons sea creature names
   * @description Get a list of all sea creatures and their details in *Animal Crossing: New Horizons*.
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
   * All New Horizons sea creature names by month
   * @param month Value may be the month's name (`jan`, `january`), the integer representing the month (`01`, `1`), or `current` for the current month. When `current` is specified, the return body will be an object with two arrays inside, one called `north` and the other `south` containing the fish available in each respective hemisphere. Note that the current month is calculated based off the API server's time, so it may be slightly off for you at the beginning or end of the month.
   * @description Get a list of all sea creatures and their details in *Animal Crossing: New Horizons*.
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
   * Single New Horizons sea creature
   * @description Retrieve information about a specific sea creature in *Animal Crossing: New Horizons*.
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

  /**
   * All New Horizons tools
   * @description Get a list of all tools and their details in *Animal Crossing: New Horizons*.
   */
  getAllTools(options?: OmitOptions<'/nh/tools'>) {
    return this.request({
      path: '/nh/tools',
      ...options
    });
  }

  /**
   * All New Horizons tool names
   * @description Get a list of all tools and their details in *Animal Crossing: New Horizons*.
   */
  getAllToolNames(options?: OmitOptions<'/nh/tools'>) {
    return this.request<'/nh/tools', string[]>({
      path: '/nh/tools',
      ...options,
      query: {
        ...options?.query,
        excludedetails: 'true'
      }
    });
  }

  /**
   * Single New Horizons tool
   * @description Retrieve information about a specific tool in *Animal Crossing: New Horizons*.
   */
  getTool(tool: string, options?: Options<'/nh/tools/{tool}'>) {
    return this.request({
      path: '/nh/tools/{tool}',
      replacePath: { tool },
      ...options
    });
  }

  /**
   * Villagers
   * @description This endpoint retrieves villager information from the entire *Animal Crossing* series, with the option to filter by species, personality, game, and/or birthday. Filters use the AND operator (e.g. asking for villagers who have species `frog` and personality `smug` will return all smug frogs). Note that villagers only include the animals that act as residents. Special characters, such as Tom Nook and Isabelle, are not accessed through this endpoint.
   */
  getAllVillagers(options?: OmitOptions<'/villagers'>) {
    return this.request({
      path: '/villagers',
      ...options
    });
  }

  /**
   * Villager names
   * @description This endpoint retrieves villager information from the entire *Animal Crossing* series, with the option to filter by species, personality, game, and/or birthday. Filters use the AND operator (e.g. asking for villagers who have species `frog` and personality `smug` will return all smug frogs). Note that villagers only include the animals that act as residents. Special characters, such as Tom Nook and Isabelle, are not accessed through this endpoint.
   */
  getAllVillagerNames(options?: OmitOptions<'/villagers'>) {
    return this.request<'/villagers', string[]>({
      path: '/villagers',
      ...options,
      query: {
        ...options?.query,
        excludedetails: 'true'
      }
    });
  }
}
