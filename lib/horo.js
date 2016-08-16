'use strict';
const tgApi = require("./tg-api.js");

class Horo {
    constructor(iConfig) {
        this.name = iConfig.name;
        this.id = iConfig.id;
        this.coolingSpeed = iConfig.cooling_speed || 10;
        this.threshold = iConfig.threshold || 100;
        
        this.temperature = 0;
    }
    
    greet() {
        return tgApi("sendMessage", {
            chat_id: this.id,
            text: "咱在这里呐。"
        });
    }
}

module.exports = Horo;