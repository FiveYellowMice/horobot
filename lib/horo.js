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
        if (message.forward_from_chat && message.forward_from_chat.id === this.id && message.forward_date - Date.now() / 1000 < 300) {
            this.addTemp(15);
        }
        
        if (this.temperature >= this.threshold) {
            this.temperature = 0;
            
            setTimeout(() => {
                this.sendEmoji();
            }, 3000);
        }
    }); }
    
    sendEmoji() {
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
    
    addEmoji(emoji, replyTo) { return Promise.resolve().then(() => {
        if (!emoji) {
            return tgApi("sendMessage", {
                chat_id: this.id,
                text: `咱不觉得 "${emoji}" 是个 Emoji 。`,
                reply_to_message_id: replyTo
            });
        }
        if (this.emojis.indexOf(emoji) !== -1) {
            return tgApi("sendMessage", {
                chat_id: this.id,
                text: `看来人类还不知道 "${emoji}" 已经在咱的列表中了。`,
                reply_to_message_id: replyTo
            });
        }
        
        this.emojis.push(emoji);
        console.log(`${this.name}: Added Emoji ${emoji}.`);
        return tgApi("sendMessage", {
            chat_id: this.id,
            text: `汝的 "${emoji}" 借咱用一用。`,
            reply_to_message_id: replyTo
        });
    }); }
    
    removeEmoji(emoji, replyTo) { return Promise.resolve().then(() => {
        if (this.emojis.indexOf(emoji) === -1) {
            return tgApi("sendMessage", {
                chat_id: this.id,
                text: `汝认为 "${emoji}" 在咱的列表里吗？`,
                reply_to_message_id: replyTo
            });
        }
        
        this.emojis = this.emojis.filter((e) => e !== emoji);
        console.log(`${this.name}: Removed Emoji ${emoji}.`);
        return tgApi("sendMessage", {
            chat_id: this.id,
            text: `"${emoji}" 果然不好吃。`,
            reply_to_message_id: replyTo
        });
    }); }
}

module.exports = Horo;