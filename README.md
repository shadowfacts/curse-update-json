# curse-update-json
A Node.js application for generating [Forge Update JSONs](http://mcforge.readthedocs.io/en/latest/gettingstarted/autoupdate/) from scraped [CurseForge](https://minecraft.curseforge.com/) data.

## Installation
1. Install [Node.js](https://nodejs.org/).
2. Clone this repository.
3. Run `npm install` in the repository directory.
5. Create the `cache` directory inside the repository directory.
4. Run `node index.js` to start the server.

## Config
```json
{
	"port": 8080,
	"projects": [
		{
			"curse": "shadowmc",
			"slug": "shadowmc",
			"homepage": "https://minecraft.curseforge.com/projects/shadowmc",
			"versionRegex": "ShadowMC-.+-(.+)\\.jar",
			"cacheDuration": 120
		}
	]
}
```

- `port`: The port to run the `curse-update-json` server on.
- `projects`: An array of all projects to use for this instance. Each element is an object with the following properties
  - `curse`: The slug for the CurseForge project that appears in the URL.
  - `slug`: The string slug to serve the JSON from. e.g. if it's running on a server at `example.com`, the port is `80`, and the slug is `examplemod`, it will be accessible from `http://example.com/examplemod`.
  - `homepage`: The string for the homepage URL to use in the Forge update JSON
  - `versionRegex`: A regular expression for extracting the version number from the file name on CurseForge. The version number should be in group 1.
  - `cacheDuration`: The length of time (in minutes) to cache the update JSON for. Don't make this too small, as we don't want to bombard CurseForge servers with too many requests. 