'use strict';
const tgApi = require("./tg-api.js");

class Horo {
    constructor(iConfig) {
        this.name = iConfig.name;
        this.id = iConfig.id;
        this.coolingSpeed = iConfig.cooling_speed || 10;
        this.threshold = iConfig.threshold || 100;
        this.emojis = iConfig.emojis || ["😂", "😋"];
        this.maxRepeat = iConfig.max_repeat || 5;
        
        this.temperature = 0;
        
        this.autoCool = setInterval(() => this.coolDown(), 60000);
    }
    
    greet() {
        return tgApi("sendMessage", {
            chat_id: this.id,
            text: "咱在这里呐。"
        });
    }
    
    stop() {
        clearInterval(this.autoCool);
    }
    
    seeMessage(message) { return Promise.resolve().then(() => {
        if (message.text) {
            if (message.text.length < 40) {
                this.addTemp(Math.ceil(message.text.length / 2));
            } else {
                this.addTemp(20);
            }
        }
        if (message.photo || message.sticker || message.voice) {
            this.addTemp(5);
        }
        if (message.video) {
            this.addTemp(10);
        }
        if (message.forward_from_chat && message.forward_from_chat.id === this.id && message.forward_date - Date.now() / 1000 > 300) {
            this.addTemp(15);
        }
        
        if (this.temperature >= this.threshold) {
            setTimeout(() => this.sendEmoji(), 3000);
        }
    }); }
    
    sendEmoji() {
        this.temperature = 0;
        
        var text = "";
        var emoji = this.emojis[Math.floor(Math.random() * this.emojis.length)];
        
        var repeats = Math.floor(Math.random() * this.maxRepeat) + 1;
        for (var i = 0; i < repeats; i++) {
            text += emoji;
        }
        
        tgApi("sendMessage", {
            chat_id: this.id,
            text: text
        })
        .then(() => {
            console.log(`${this.name}: Sent: ${text}`);
        })
        .catch((err) => console.log(err));
    }
    
    addTemp(temperature) {
        this.temperature = this.temperature + temperature;
        console.log(`${this.name}: Temperature added ${temperature}, current: ${this.temperature}.`);
    }
    
    coolDown() {
        if (this.temperature > 0) {
            this.temperature = this.temperature - this.coolingSpeed;
            if (this.temperature < 0) this.temperature = 0;
            console.log(`${this.name}: Cooled down to ${this.temperature}.`);
        }
    }
}

module.exports = Horo;