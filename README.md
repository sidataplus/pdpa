# Thai PDPA Website (Unofficial)

![Screen Capture](screen-capture.gif)

The content on this website is based on [the official document of Thailand's Personal Data Protection Act (PDPA) B.E. 2562](http://www.ratchakitcha.soc.go.th/DATA/PDF/2562/A/069/T_0052.PDF).

The website represents PDPA in a new format using interactive stacked pages and wiki-links, built with [Next.js](https://nextjs.org).

The goal is to provide ease of access to PDPA and allow tracking of article references. Users can open referenced articles and supplementary legal references on the side portion of the desktop screen or landscape tablet.

## How-to

This website is built with [Next.js](https://nextjs.org). To contribute, please consult its [documentation](https://nextjs.org/docs).

### Requirements

- Node.js v22.16.0 (minimum supported version is v20.9.0)
- npm

### Install

Clone this repository to your machine. At the repository's root directory, run

```{bash}
npm ci
```

### Development

Run

```{bash}
npm run dev
```

Then go to `localhost:3000` in your browser of choice. Any changes to the files saved will be automatically updated on the website.

### Build

Run

```{bash}
npm run check:production
```

This checks the source, verifies all 96 articles, builds the site, and validates the generated routes, links, JSON, metadata, and security configuration.

The generated static site will be available at `out`.

### Deployment

Once code is pushed or merged into the deployment branch on GitHub, Cloudflare Pages will build and deploy the site automatically. Cloudflare Pages should use `npm run check:production` as the build command and `out` as the build output directory. If unsure, open a Pull Request first instead of pushing directly to the deployment branch.

## Contributions

Contributions are highly welcome. Please submit your PRs.

## Roadmap

- Maintain the official Thai PDPA article content
- Add and maintain supplementary legal references
- ...(more to come)...
