"use strict";

var ranges = "(?:" + [
    '\uD83C[\uDF00-\uDFFA]', // U+1F300 to U+1F3FA
    '\uD83D[\uDC00-\uDE4F]', // U+1F400 to U+1F64F
    '\uD83D[\uDE80-\uDEFF]'  // U+1F680 to U+1F6FF
].join("|") + ")";

var modifier = "\uD83C[\uDFFB-\uDFFF]"; // U+1F3FB to U+1F3FF

var flags = "(?:\uD83C[\uDDE6-\uDDFF]){2}" // U+1F1E6 to U+1F1FF

var joiner = "\u200D";

module.exports = new RegExp([
    `${ranges}(?:${modifier})?`,
    flags,
    `(?:${ranges}${joiner})+${ranges}` // ZWJ Sequences
].join("|"), "g");

/**
 * References:
 * http://crocodillon.com/blog/parsing-emoji-unicode-in-javascript
 * http://www.unicode.org/Public/emoji/3.0//emoji-data.txt
 * http://unicode.org/Public/emoji/3.0/emoji-sequences.txt
 * http://www.unicode.org/Public/emoji/3.0//emoji-zwj-sequences.txt
 */