const http = require("http");
const fs = require("fs");
const url = require("url");
const path = require("path");
const yaml = require("js-yaml");
const mime = require("mime-types");
const tgApi = require("./lib/tg-api.js");
const Horo = require("./lib/horo.js");
const templates = require("./lib/templates.js");
const finalhandler = require("finalhandler");
const serveStatic = require("serve-static")(__dirname, {
	maxAge: 900000,
	setHeaders: (res, filePath, stat) => {
		res.setHeader("content-type", mime.contentType(path.extname(filePath)));
	}
});

var config = yaml.safeLoad(fs.readFileSync(__dirname + "/config.yaml"));
tgApi.initialize(config);

// Initialize instances of Horo
var horos = [];
for (var i in config.groups) {
	var group = config.groups[i];
	horos.push(new Horo(group));
}

// Start server
http.createServer((request, response) => {
	//console.log(`${request.method} ${request.url}`);
	
	if (request.url === `/webhook/${config.token.webhook}/`) {
		var body = [];
		request.on("data", (chunk) => body.push(chunk));
		request.on("end", () => processUpdate(Buffer.concat(body)));
		response.statusCode = 204;
		response.end();
	} else if (request.url.startsWith("/static/")) {
		serveStatic(request, response, finalhandler(request, response));
	} else if (url.parse(request.url).pathname === "/status") {
		response.writeHead(200, {
			"content-type": "text/html; charset=utf-8"
		});
		response.end(templates.status({ instances: horos }));
	} else {
		response.statusCode = 404;
		response.end("Not found.");
	}
}).listen(config.listen.port, config.listen.address, () => {
	console.log(`Listening on [${config.listen.address}]:${config.listen.port}...`);
});


function processUpdate(updateJson) {
	try {
		var update = JSON.parse(updateJson);
	} catch (err) {
		console.log(err);
		return;
	}
	
	if (update.message) {
		processMessage(update.message)
		.catch(console.log);
	}
}

function processMessage(message) { return Promise.resolve().then(() => {
	//console.log(message);
	
	if (["group", "supergroup"].indexOf(message.chat.type) === -1) {
		return tgApi("sendMessage", {
			chat_id: message.chat.id,
			text: "I'm not in a group!"
		});
	}
	
	var instance = horos.filter((h) => h.id === message.chat.id)[0];
	
	if (!instance) {
		//return Promise.reject(new Error(`Group ${message.chat.id} is not registered.`));
		return;
		/*tgApi("sendMessage", {
			chat_id: message.chat.id,
			text: `Group ${message.chat.id} is not registered.`
		});*/
	}
	
	if (message.text && message.text.startsWith("/status@yoitsuhorobot")) {
		return tgApi("sendMessage", {
			chat_id: message.chat.id,
			text: `<b>Name: </b>${instance.name}\n` +
				`<b>ID: </b>${instance.id}\n` +
				`<b>Temperature: </b>${instance.temperature}\n` +
				`<b>Cooling speed: </b>${instance.coolingSpeed}\n` +
				`<b>Threshold: </b>${instance.threshold}\n` +
				`<b>Emojis: </b>${instance.emojis.join(" ")}\n` +
				`\nMore: https://horobot.ml/status`,
			parse_mode: "HTML",
			reply_to_message_id: message.message_id
		});
	} else if (message.text && message.text.startsWith("/temperature@yoitsuhorobot")) {
		return tgApi("sendMessage", {
			chat_id: message.chat.id,
			text: instance.temperature,
			reply_to_message_id: message.message_id
		});
	}
	
	//console.log(message);
	return instance.seeMessage(message);
}); }