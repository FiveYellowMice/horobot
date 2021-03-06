'use strict';
const tgApi = require("./tg-api.js");
const emojiRegex = require("./emoji-regex.js");

class Horo {
    constructor(iConfig) {
        this.name = iConfig.name;
        this.id = iConfig.id;
        this.coolingSpeed = iConfig.cooling_speed || 10;
        this.threshold = iConfig.threshold || 100;
        this.emojis = iConfig.emojis || ["😂", "😋"];
        this.maxRepeat = iConfig.max_repeat || 5;
        this.userEmojiLimit = iConfig.user_emoji_limit !== undefined ? iConfig.user_emoji_limit : 100;
        
        this.temperature = 0;
        this.userEmojis = [];
        
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
        // Collect user-generated Emojis
        if (this.userEmojiLimit > 0 && message.text) {
            var matchedEmojis = message.text.match(emojiRegex.sequences);
            
            if (matchedEmojis) {
                matchedEmojis = matchedEmojis.map((x) => {
                    // Convert sequences of same Emoji to single Emoji
                    if (emojiRegex.sequenceOfSame.test(x)) {
                        return x.match(emojiRegex.sequenceOfSame)[1];
                    } else {
                        return x;
                    }
                });
                console.log(`${this.name}: Matched ${matchedEmojis} in message.`);
                this.userEmojis = this.userEmojis.concat(matchedEmojis);
            }
            
            while (this.userEmojis.length > this.userEmojiLimit) {
                this.userEmojis.shift();
            }
        }
        
        // Add temperature based on content
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
        
        // Send Emoji when reaching threshold
        if (this.temperature >= this.threshold) {
            this.temperature = 0;
            
            setTimeout(() => {
                this.sendEmoji()
                .catch((err) => console.log(err));
            }, 3000);
        }
    }); }
    
    sendEmoji() {
        var text = "";
        var useUserEmojis = this.userEmojis.length && Math.floor(Math.random() * 2) === 1;
        var emoji;
        
        if (useUserEmojis) {
            emoji = this.userEmojis[Math.floor(Math.random() * this.userEmojis.length)];
        } else {
            emoji = this.emojis[Math.floor(Math.random() * this.emojis.length)];
        }
        
        var repeats;
        if (emojiRegex.one.test(emoji)) {
            repeats = Math.floor(Math.random() * this.maxRepeat) + 1;
        } else {
            repeats = 1;
        }
        
        for (var i = 0; i < repeats; i++) {
            text += emoji;
        }
        
        return tgApi("sendMessage", {
            chat_id: this.id,
            text: text
        })
        .then(() => {
            console.log(`${this.name}: Sent: ${text}`);
        });
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
        if (!emoji || !emojiRegex.one.test(emoji)) {
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