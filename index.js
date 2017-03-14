const fs = require("fs");
const path = require("path");
const request = require("request");
const cheerio = require("cheerio");
const express = require("express");
const app = express();

const cache = {};

const config = loadConfig();

config.projects.forEach((proj) => {
	app.get(`/${proj.slug}`, (req, res) => {
		get(proj)
			.then((data) => {
				res.status(200);
				res.set("Content-Type", "application/json");
				res.send(data);
				res.end();
			})
			.catch((e) => {
				res.status(500);
				res.end();
			});
	});
});

app.listen(config.port, () => {
	console.log(`Listening on port ${config.port}`);
});

function loadConfig() {
	const data = fs.readFileSync(path.join(__dirname, "config.json"));
	return JSON.parse(data);
}

function get(proj) {
	const now = Date.now();
	if (now - cache[proj.id] < proj.cacheDuration * 60 * 1000) { // less than an hour old
		console.log("loading cached");
		return new Promise((resolve, reject) => {
			fs.readFile(path.join(__dirname, "cache", `${proj.id}.json`), (err, data) => {
				if (err) reject(err);
				else resolve(data);
			});
		});
	} else {
		console.log("generating");
		return generateAndCache(proj);
	}
}

function generateAndCache(proj) {
	return new Promise((resolve, reject) => {
		request(`http://minecraft.curseforge.com/projects/${proj.id}`, (err, res) => {
			if (err) {
				reject(err);
				return;
			}
			request(`http://minecraft.curseforge.com${res.request.uri.pathname}/files`, (err, res, body) => {
				if (err) {
					reject(err);
					return;
				}
				const re = new RegExp(proj.versionRegex);
				const $ = cheerio.load(body);
				const files = [];
				$(".project-file-list-item").toArray().map((it) => $(it)).forEach((el) => {
					const f = {};
					const type = el.find(".project-file-release-type > div");
					f.type = type.attr("class").split("-")[0];
					const link = el.find(".project-file-name > div > .project-file-name-container > a");
					const name = link.text();
					const res = re.exec(name);
					f.ver = res[1];
					f.url = "https://minecraft.curseforge.com" + link.attr("href");
					const mcVer = el.find(".project-file-game-version > .version-label").text();
					f.mcVer = mcVer;
					files.push(f);
				});
				const json = generateJson(proj, files);
				const s = JSON.stringify(json, null, "\t");
				fs.writeFile(path.join(__dirname, "cache", `${proj.id}.json`), s);
				cache[proj.id] = Date.now();
				resolve(s);
			});
		});
	});
}

/*
files is ordered newest -> oldest
files[0] = {
	type: "release",
	ver: "3.7.5",
	mcVer: "1.11.2",
	url: "https://minecraft.curseforge.com/projects/shadowmc/files/2378170"
}
*/
function generateJson(proj, files) {
	const o = {
		homepage: proj.homepage,
		promos: {}
	};
	for (const f of files) {
		// all versions
		if (!o.hasOwnProperty(f.mcVer)) {
			o[f.mcVer] = {};
		}
		o[f.mcVer][f.ver] = `See ${f.url} for changelog`;

		// promos
		if (!o.promos.hasOwnProperty(`${f.mcVer}-latest`)) {
			o.promos[`${f.mcVer}-latest`] = f.ver;
		}
		if (f.type == "release" && !o.promos.hasOwnProperty(`${f.mcVer}-recommended`)) {
			o.promos[`${f.mcVer}-recommended`] = f.ver;
		}
	}
	return o;
}
