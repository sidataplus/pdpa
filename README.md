# Thai PDPA Website (Unofficial)

The content on this website is based on [the official document of Thailand's Personal Data Protection Act (PDPA) B.E. 2562](http://www.ratchakitcha.soc.go.th/DATA/PDF/2562/A/069/T_0052.PDF).

The website represents PDPA in a new format using interactive stacked pages and wiki-links, built with [Next.js](https://nextjs.org) (licensed under MIT).

The goal is to provide ease of access to PDPA and allow tracking of article references. Users can open referenced articles on the side portion of the desktop screen or landscape tablet (not on mobile or narrow screen).

## How-to

### Requirements

- Node.js v20+
- npm

### Install

Clone this repository to your machine. At the repository's root directory, run

```bash
npm install
```

### Development

Run

```bash
npm run dev
```

Then go to `http://localhost:3000` in your browser of choice. Any changes to the files saved will be automatically updated on the website.

### Sync Excel Data

If you update the title or PDF links in `data/โยงประกาศ PDPA.xlsx`, you must run the following command to sync the changes to the markdown files:

```bash
npm run sync
```

### Build

Run

```bash
npm run build
```

The generated static site will be available at `./out`

### Deployment

Once code pushed/merged into `master` branch on GitHub, Cloudflare Pages will automatically build and deploy the site. (**If unsure, don't push to master but file a Pull Request first.**)

## Contributions

Contributions are highly welcome. Please submit your PRs.

## License

MIT
