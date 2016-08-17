const fs = require("fs");
const _ = require("lodash");

var templates = {};

templates.status = _.template(fs.readFileSync(__dirname + "/../templates/status.html", "utf8"));

module.exports = templates;