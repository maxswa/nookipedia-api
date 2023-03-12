import {
  ErrorBody,
  NookipediaApi,
  NookipediaError,
  NookipediaError401,
  NOOKIPEDIA_API_VERSION
} from './index';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { resolve } from 'path';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  })
) as jest.Mock;

const mockFetch = fetch as jest.Mock;

beforeEach(() => {
  mockFetch.mockClear();
});

describe('NookipediaApi', () => {
  it('NOOKIPEDIA_API_VERSION matches version in OpenAPI spec', async () => {
    const file = readFileSync(
      resolve(__dirname, '../nookipedia-api.yaml'),
      'utf8'
    );
    const yaml = parse(file);
    expect(yaml.info.version).toEqual(NOOKIPEDIA_API_VERSION);
  });
  it('adds API key header', async () => {
    const apiKey = 'apiKey';
    const nookipedia = new NookipediaApi(apiKey);
    await nookipedia.getAllBugs();
    expect(mockFetch.mock.lastCall?.[1]?.headers?.get('X-API-KEY')).toEqual(
      apiKey
    );
  });
  it('adds version header', async () => {
    const nookipedia = new NookipediaApi('');
    await nookipedia.getAllBugs();
    expect(
      mockFetch.mock.lastCall?.[1]?.headers?.get('Accept-Version')
    ).toEqual(NOOKIPEDIA_API_VERSION);
  });
  it('properly merges headers', async () => {
    const apiKey = 'apiKey';
    const testValue = 'testValue';
    const nookipedia = new NookipediaApi(apiKey);
    await nookipedia.getAllBugs({
      fetchOptions: { headers: new Headers({ Test: testValue }) }
    });
    expect(mockFetch.mock.lastCall?.[1]?.headers?.get('X-API-KEY')).toEqual(
      apiKey
    );
    expect(mockFetch.mock.lastCall?.[1]?.headers?.get('Test')).toEqual(
      testValue
    );
  });
  it('passes other fetch options', async () => {
    const apiKey = 'apiKey';
    const method = 'POST';
    const nookipedia = new NookipediaApi(apiKey);
    await nookipedia.getAllBugs({
      fetchOptions: { method }
    });
    expect(mockFetch.mock.lastCall?.[1]?.headers?.get('X-API-KEY')).toEqual(
      apiKey
    );
    expect(mockFetch.mock.lastCall?.[1]?.method).toEqual(method);
  });
  it('properly builds search params', async () => {
    const nookipedia = new NookipediaApi('');
    const query = {
      month: 'jan',
      excludedetails: 'true',
      thumbsize: 20
    };
    await nookipedia.getAllBugs({
      query
    });
    const url = new URL(mockFetch.mock.lastCall?.[0]);
    expect(url.searchParams.get('month')).toEqual(query.month);
    expect(url.searchParams.get('excludedetails')).toEqual(
      query.excludedetails
    );
    expect(url.searchParams.get('thumbsize')).toEqual(
      query.thumbsize.toString()
    );
  });
  it('url is valid with or without trailing slash', async () => {
    const nookipedia = new NookipediaApi('', 'https://api.nookipedia.com');
    const nookipedia2 = new NookipediaApi('', 'https://api.nookipedia.com/');
    await nookipedia.getAllBugs();
    await nookipedia2.getAllBugs();
    const [[noTrail], [trail]] = mockFetch.mock.calls;
    expect(noTrail).toEqual(trail);
  });
  it('properly replaces path', async () => {
    const bug = 'coolBug';
    const nookipedia = new NookipediaApi('');
    await nookipedia.getBug(bug);
    expect(mockFetch.mock.lastCall?.[0]?.slice(-bug.length)).toEqual(bug);
    expect(mockFetch.mock.lastCall?.[0]?.includes('{')).toEqual(false);
    expect(mockFetch.mock.lastCall?.[0]?.includes('}')).toEqual(false);
  });
  it('throws NookipediaError when response is not ok', async () => {
    mockFetch.mockReturnValueOnce(
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({})
      })
    );
    const nookipedia = new NookipediaApi('');
    await expect(nookipedia.getAllBugs()).rejects.toThrow(NookipediaError);
  });
  it('throws specific NookipediaError when status is supported', async () => {
    mockFetch.mockReturnValueOnce(
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({})
      })
    );
    const nookipedia = new NookipediaApi('');
    await expect(nookipedia.getAllBugs()).rejects.toThrow(NookipediaError401);
  });
});
const errorBody: ErrorBody = { title: 'title', details: 'details' };
