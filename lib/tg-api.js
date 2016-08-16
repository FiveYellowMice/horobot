const https = require("https");

var config;

function tgApi(method, data) { return new Promise((resolve, reject) => {
    var request = https.request({
        hostname: "api.telegram.org",
        method: "POST",
        path: `/bot${config.token.api}/${method}`,
        headers: {
            "content-type": "application/json"
        }
    });
    request.end(JSON.stringify(data));
    request.on("error", (err) => {
        reject(err);
    });
    
    request.on("response", (response) => {
        var body = [];
        response.on("data", (chunk) => body.push(chunk));
        response.on("end", () => {
            var responseText = Buffer.concat(body);
            try {
                var responseJson = JSON.parse(responseText);
                if (responseJson.ok === true) {
                    resolve(responseJson.result);
                } else {
                    reject(new Error(responseJson.description));
                }
            } catch (err) {
                reject(err);
            }
        });
        response.on("error", (err) => {
            reject(err);
        });
    });
}); }

tgApi.initialize = function initialize(newConfig) {
    config = newConfig;
}

module.exports = tgApi;