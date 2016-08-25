'use strict';
const EventEmitter = require('events');

class FollowSuit extends EventEmitter {
    constructor(emoji, threshold) {
        super();
        this.emoji = emoji;
        this.threshold = threshold || 10;
        this.minInterval = 120000; // Milisecs
        
        this.temperature = 0;
        this.messageCount = 0;
        this.lastReactTime = 0;
        this.expireTimer = null;
    }
    
    seeMessage(message) { process.nextTick(() => {
        if (!message.text) return;
        var occurence = message.text.split(this.emoji).length - 1;
        if (!occurence) return;
        
        var temperatureBefore = this.temperature;
        this.messageCount++;
        this.temperature += occurence;
        this.emit("add", occurence, temperatureBefore <= 0);
        
        if (this.expireTimer) clearTimeout(this.expireTimer);
        this.expireTimer = setTimeout(() => {
            this.temperature = 0;
            this.messageCount = 0;
            this.emit("expire");
            this.expireTimer = null;
        }, 60000);
        
        
        if (
            this.temperature >= this.threshold && 
            Date.now() - this.lastReactTime >= this.minInterval
        ) {
            this.react();
        }
    }); }
    
    react() { process.nextTick(() => {
        var repeats = Math.ceil(this.temperature / this.messageCount);
        var reaction = Array.apply(null, { length: repeats }).map(() => this.emoji).join("");
        this.emit("react", reaction);
        
        this.temperature = 0;
        this.messageCount = 0;
        this.lastReactTime = Date.now();
        if (this.expireTimer) clearTimeout(this.expireTimer);
        this.expireTimer = null;
    }); }
}

module.exports = FollowSuit;