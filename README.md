# nookipedia-api

[![npm](https://img.shields.io/npm/v/nookipedia-api.svg?style=flat-square)](https://www.npmjs.com/package/nookipedia-api)
[![downloads](https://img.shields.io/npm/dm/nookipedia-api.svg?style=flat-square)](https://npm-stat.com/charts.html?package=nookipedia-api)
[![types](https://img.shields.io/npm/types/nookipedia-api.svg?style=flat-square)](https://github.com/maxswa/nookipedia-api/blob/master/src/types.ts)
[![build](https://img.shields.io/github/actions/workflow/status/maxswa/nookipedia-api/main.yml?branch=main&style=flat-square)](https://github.com/maxswa/nookipedia-api/actions/workflows/main.yml?query=branch%3Amain)

Simple JS wrapper for the [Nookipedia API](https://api.nookipedia.com/)

[Click here for documentation of the latest version of the Nookipedia API](https://api.nookipedia.com/doc)

## Installation

With npm:

```
$ npm install nookipedia-api
```

With Yarn:

```
$ yarn add nookipedia-api
```

## Usage

Install the package and then import it into your project:

```typescript
import { NookipediaApi } from 'nookipedia-api';
```

Create a `NookipediaApi` object with your API key:

```typescript
const nookipedia = new NookipediaApi('<api-key>');
```

Make a request with the new object:

```typescript
const bugs = await nookipedia.getAllBugs();
console.log(bugs);

/*
  Output:
  [
    {
      name: 'agrias butterfly',
      url: 'https://nookipedia.com/wiki/Agrias_butterfly',
      number: '10',
      image_url: 'https://dodo.ac/np/images/6/60/Agrias_Butterfly_NH_Icon.png',
      ...
    },
    ...
  ]
*/
```

### Error Handling

It's important to handle any errors (E.g. `404`):

```typescript
try {
  const bug = await nookipedia.getBug('fish');
} catch (error) {
  console.error(error);
}
```

Get more information from your errors with `instanceof`:

```typescript
try {
  const bug = await nookipedia.getBug('fish');
} catch (error) {
  if (error instanceof NookipediaError) {
    console.error(error.body.title);
    console.error(error.body.details);
  }
}
```

### Options

Pass options with query params or fetch options:

```typescript
const controller = new AbortController();
const bugs = await nookipedia.getBug('agrias butterfly', {
  query: {
    thumbsize: 200
  },
  fetchOptions: {
    signal: controller.signal
  }
});
console.log(bugs);

/*
  Output:
  [
    {
      name: 'agrias butterfly',
      url: 'https://nookipedia.com/wiki/Agrias_butterfly',
      number: '10',
      image_url: 'https://dodo.ac/np/images/6/60/Agrias_Butterfly_NH_Icon.png',
      render_url: 'https://dodo.ac/np/images/thumb/d/db/Agrias_Butterfly_NH.png/200px-Agrias_Butterfly_NH.png',
      ...
    },
    ...
  ]
*/
```
