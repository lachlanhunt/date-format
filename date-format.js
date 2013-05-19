(function() {
    function sign(n) {
        // -0 and +0 both treated as positive.
        return +n < 0 ? -1 : 1;
    }

    function signZero(n) {
        // -0 is negative, +0 is positive
        n = +n;
        return (n === 0 ? 1/n : n) < 0 ? -1 : 1;
    }

    // zero-pad integer values. Doesn't support non-integer values.
    function pad(n, len) {
        var str = String(Math.abs(n));
        if (str.length < len) {
            str = new Array(len - str.length + 1).join("0") + str;
        }
        return (sign(n) < 0) ? '-' + str : str;
    }

    // Determine the ordinal suffix for the supplied integer. Does not support non-integer values.
    function suffix(n) {
        var digits = ('0' + String(Math.floor(n))).substr(-2);
        if (digits[0] !== '1') {
            switch (digits[1]) {
            case '1':
                return 'st';
            case '2':
                return 'nd';
            case '3':
                return 'rd';
            }
        }
        return 'th';
    }

    function timezoneString(offset, options) {
        /*
         * offset - Difference in milliseconds between UTC and the desired timezone.
         *          Negative values result in positive timezone offsets. e.g. -3600000 results in "+01:00"
         *          This mirrors the way Date.prototype.getTimezoneOffset() works.
         * options {
         *   extended: (Boolean) - Used extended format +hh:mm (true) or basic +hhmm (false)
         *   zulu: (Boolean)     - Output 'Z' for Zero-meridian (true) or '+00:00'/'+0000' (false)
         * }
         */

        if (offset === 0 && options.zulu) {
            return 'Z';
        }

        var symbol = sign(offset) < 0 || offset === 0 ? "+" : "-";
        offset = Math.abs(offset);

        var ms = '.' + pad(offset % 1000, 3);
        var ss = pad(Math.floor(offset / 1000 % 60), 2) + (ms !== ".000" ? ms : '');
        var mm = pad(Math.floor(offset / 60000 % 60), 2);
        var hh = pad(Math.floor(offset / 3600000 % 60), 2);

        var sep = (options.extended ? ':' : '');

        /*
         * ISO 8601 technically does not allow for a seconds component in the timezone offset. However, due to the
         * existence of historical timezones with non-zero seconds components, this method includes them when
         * necessary.  As such, this API cannot be used to generate ISO 8601 compliant formatted dates for
         * timezone offsets that are not equal to an integral number of minutes.
         */

        return symbol + hh + sep + mm +
               (ss !== "00" ? sep + ss : '');
    }

    function isLeap(year) {
        return (year % 400 === 0) || (year % 4 === 0 && year % 100 !== 0);
    }

    function ISOOrdinalDay(y, m, d) {
        /*
         * These calculations use UTC to avoid local timezone offset (DST) variations between 1 Jan and the
         * specified date.
         *
         * Note: The Date.UTC() function breaks for years between 0000 and 0099 due to implementations that
         * treat those years as being from 1900 to 1999.  As a result, this instead uses the date time string
         * format with extended year: +YYYYYY-MM-DDTHH:mm:ss.sssZ and -YYYYYY-MM-DDTHH:mm:ss.sssZ.
         * This format supports all valid ECMAScript dates in the range of 100,000,000 days before and after the
         * epoch.
         */
        var YYYYYY = (sign(y) > 0 ? '+' : '-') + pad(Math.abs(y), 6),
            MM   = pad(m + 1, 2),
            DD   = pad(d, 2),

            day = new Date(YYYYYY + '-' + MM + '-' + DD),
            jan1 = new Date(YYYYYY + "-01-01");

        return (day - jan1) / 86400000 + 1;
    }


    function tokenise(str) {
        var STATE_BEGIN = 1,
            STATE_SYMBOL = 2,
            STATE_LITERAL = 3,
            STATE_LITERAL_SINGLE = 4;

        var chars = Array.prototype.slice.call(str),
            ref = '', ch,
            tokens = [], token = null,
            state = STATE_BEGIN;

        while ( (ch = chars.shift()) ) {

            switch (state) {
            case STATE_BEGIN:
                ref = ch;
                if (ch === "'" || ch === '"') {
                    token = {
                        type: "literal",
                        data: ''
                    };
                    state = STATE_LITERAL;
                } else if (ch === "\\") {
                    token = {
                        type: "literal",
                        data: ''
                    };
                    state = STATE_LITERAL_SINGLE;
                } else {
                    token = {
                        type: "symbol",
                        data: ch,
                        suffix: false
                    };
                    state = STATE_SYMBOL;
                }
                tokens.push(token);
                break;
            case STATE_SYMBOL:
                if (ch === ref) {
                    token.data += ch;
                } else {
                    if (ch === '#') {
                        token.suffix = true;
                    } else {
                        chars.unshift(ch);
                    }
                    state = STATE_BEGIN;
                }
                break;
            case STATE_LITERAL:
                if (ch !== ref) {
                    token.data += ch;
                } else {
                    state = STATE_BEGIN;
                }
                break;
            case STATE_LITERAL_SINGLE:
                token.data += ch;
                state = STATE_BEGIN;
            }
        }
        return tokens;
    }
    /*
    // XXX This function is not finished. DO NOT USE.
    function formatNumber(n, len, options) {
        var value;
        if (window.Intl && window.Intl.NumberFormat) {
            var nf = new Intl.NumberFormat(options.locale, {useGrouping: false, minimumIntegerDigits: len});
            nf.format(n);
        } else {
            value = pad(n, len);
        }
    }
    */

    function dateComponent(date, token, options) {
        var value, temp;

        if (token.type === "symbol") {
            switch (token.data) {
            case "YY":
                // year, 2 digit
                value = date.getUTCFullYear() % 100;
                return pad(value, 2) + (token.suffix ? suffix(value) : '');
            case "YYYY":
                // year, 4 digit
                value = date.getUTCFullYear();
                return pad(value, 4) + (token.suffix ? suffix(value) : '');

            case "WW":
            case "yy":
                // week-numbering year, 2 digit
                value = date.getUTCWeekYear() % 100;
                return pad(value, 2) + (token.suffix ? suffix(value) : '');
            case "WWWW":
            case "yyyy":
                // week-numbering year, 4 digit
                value = date.getUTCWeekYear();
                return pad(value, 4) + (token.suffix ? suffix(value) : '');

            case "C":
                // Century component of the year, no leading zero
                temp = date.getUTCFullYear();
                value = sign(y) * Math.floor(Math.abs(y) / 100);
                return value + (token.suffix ? suffix(value) : '');
            case "CC":
                // Century component of the year, leading zero
                temp = date.getUTCFullYear();
                value = sign(y) * Math.floor(Math.abs(y) / 100);
                return pad(value, 2) + (token.suffix ? suffix(value) : '');

            case "c":
                // Ordinal century number, no leading zero
                temp = date.getUTCFullYear();
                value = y > 0 ?
                        Math.floor(Math.abs((y - 1) / 100)) + 1 :
                        Math.floor(Math.abs(y / 100)) + 1;
                return value + (token.suffix ? suffix(value) : '');
            case "cc":
                // Ordinal century number, leading zero
                var y = date.getUTCFullYear();
                value = y > 0 ?
                        Math.floor(Math.abs((y - 1) / 100)) + 1 :
                        Math.floor(Math.abs(y / 100)) + 1;
                return pad(value, 2) + (token.suffix ? suffix(value) : '');

            case "E":
                // Era, abbreviation
                return (date.getUTCFullYear() > 0) ? "CE" : "BCE";

            case "EE":
                // Era, full English name
                return (date.getUTCFullYear() > 0) ? "Common Era" : "Before Common Era";

            case "M":
                // month, number, no leading zero
                // (Intl.DateTimeFormat {month: "numeric"})
                value = date.getUTCMonth() + 1;
                return value + (token.suffix ? suffix(value) : '');
            case "MM":
                // month, number, leading zero
                // (Intl.DateTimeFormat {month: "2-digit"})
                value = date.getUTCMonth() + 1;
                return pad(value, 2) + (token.suffix ? suffix(value) : '');
            case "MMM":
                // month, name, 3 letter
                // (Intl.DateTimeFormat {month: "short"})
                if (window.Intl && window.Intl.DateTimeFormat) {
                    return (new Intl.DateTimeFormat(options.locale, {month: "short"})).format(date);
                }
                return (['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])[date.getUTCMonth()];
            case "MMMM":
                // month, name, full
                // (Intl.DateTimeFormat {month: "long"})
                if (window.Intl && window.Intl.DateTimeFormat) {
                    return (new Intl.DateTimeFormat(options.locale, {month: "long"})).format(date);
                }
                return (['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'])[date.getUTCMonth()];

            case "D":
                // day of month, number, no leading zero
                // (Intl.DateTimeFormat {day: "numeric"})
                value = date.getUTCDate();
                return value + (token.suffix ? suffix(value) : '');
            case "DD":
                // day of month, number, leading zero
                // (Intl.DateTimeFormat {day: "2-digit"})
                value = date.getUTCDate();
                return pad(value, 2) + (token.suffix ? suffix(value) : '');
            case "DDD":
                // day of year, number, 3 digits
                value = ISOOrdinalDay(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
                return pad(value, 3) + (token.suffix ? suffix(value) : '');
            case "DDDD":
                // count of days in month, number
                switch (date.getUTCMonth()) {
                case 0: // January
                case 2: // March
                case 4: // May
                case 6: // July
                case 7: // August
                case 9: // October
                case 11: // December
                    value = 31;
                    break;
                case 3: // April
                case 5: // June
                case 8: // September
                case 10: // November
                    value = 30;
                    break;
                case 1: // February
                    value = isLeap(date.getUTCFullYear()) ? 29 : 28;
                }
                return value + (token.suffix ? suffix(value) : '');

            case "d":
                // day of week, number, 1 (Monday) to 7 (Sunday)
                value = date.getUTCDay() || 7;
                return value + (token.suffix ? suffix(value) : '');
            case "dd":
                // day of week, name, 1 letter, M to S
                // (Intl.DateTimeFormat {weekday: "narrow"})
                if (window.Intl && window.Intl.DateTimeFormat) {
                    return (new Intl.DateTimeFormat(options.locale, {weekday: "narrow"})).format(date);
                }
                return (['S', 'M', 'T', 'W', 'T', 'F', 'S'])[date.getUTCDay()];
            case "ddd":
                // day of week, name, 3 letter, Mon to Sun
                // (Intl.DateTimeFormat {weekday: "short"})
                if (window.Intl && window.Intl.DateTimeFormat) {
                    return (new Intl.DateTimeFormat(options.locale, {weekday: "short"})).format(date);
                }
                return (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])[date.getUTCDay()];
            case "dddd":
                // day of week, name, full, Monday to Sunday
                // (Intl.DateTimeFormat {weekday: "long"})
                if (window.Intl && window.Intl.DateTimeFormat) {
                    return (new Intl.DateTimeFormat(options.locale, {weekday: "long"})).format(date);
                }
                return (['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])[date.getUTCDay()];

            case "w":
                // week, number, no leading zero
                value = date.getUTCWeek();
                return value + (token.suffix ? suffix(value) : '');
            case "ww":
                // week, number, leading zero
                value = date.getUTCWeek();
                return pad(value, 2) + (token.suffix ? suffix(value) : '');

            case "h":
                // hour, number, 12 hour, no leading zero
                // (Intl.DateTimeFormat {hour12: true, hour: "numeric"})
                value = date.getUTCHours() % 12 || 12;
                return value + (token.suffix ? suffix(value) : '');
            case "hh":
                // hour, number, 12 hour, leading zero
                // (Intl.DateTimeFormat {hour12: true, hour: "2-digit"})
                value = date.getUTCHours() % 12 || 12;
                return pad(value, 2) + (token.suffix ? suffix(value) : '');
            case "H":
                // hour, number, 24 hour, no leading zero
                // (Intl.DateTimeFormat {hour12: false, hour: "numeric"})
                value = date.getUTCHours();
                return value + (token.suffix ? suffix(value) : '');
            case "HH":
                // hour, number, 24 hour, leading zero
                // (Intl.DateTimeFormat {hour12: false, hour: "2-digit"})
                value = date.getUTCHours();
                return pad(value, 2) + (token.suffix ? suffix(value) : '');

            case "m":
                // minute, number, no leading zero
                // (Intl.DateTimeFormat {minute: "numeric"})
                value = date.getUTCMinutes();
                return value + (token.suffix ? suffix(value) : '');
            case "mm":
                // minute, number, leading zero
                // (Intl.DateTimeFormat {minute: "2-digit"})
                value = date.getUTCMinutes();
                return pad(value, 2) + (token.suffix ? suffix(value) : '');

            case "s":
                // second, number, no leading zero
                // (Intl.DateTimeFormat {second: "numeric"})
                value = date.getUTCSeconds();
                return value + (token.suffix ? suffix(value) : '');
            case "ss":
                // second, number, leading zero
                // (Intl.DateTimeFormat {second: "2-digit"})
                value = date.getUTCSeconds();
                return pad(value, 2) + (token.suffix ? suffix(value) : '');

            case "f":
                // fraction of second, number, 1 digit
                return pad(Math.floor(date.getUTCMilliseconds() / 100), 1);
            case "ff":
                // fraction of second, number, 2 digits
                return pad(Math.floor(date.getUTCMilliseconds() / 10), 2);
            case "fff":
                // fraction of second, number, 3 digits
                return pad(date.getUTCMilliseconds(), 3);

            case "a":
            case "p":
                // meridiem, 1 letter, lowercase (a or p)
                return ((date.getUTCHours() || 24) < 12) ? "a" : "p";
            case "aa":
            case "pp":
                // meridiem, 2 letter, lowercase (am or pm)
                return ((date.getUTCHours() || 24) < 12) ? "am" : "pm";
            case "A":
            case "P":
                // meridiem, 1 letter, uppercase (A or P)
                return ((date.getUTCHours() || 24) < 12) ? "A" : "P";
            case "AA":
            case "PP":
                // meridiem, 2 letter, uppercase (AM or PM)
                return ((date.getUTCHours() || 24) < 12) ? "AM" : "PM";

            case "z":
                // timezone, basic format, +HHmm or -HHmm or literal 'Z'
                return timezoneString(options.offset, {extended: false, zulu: true});
            case "zz":
                // timezone, basic format, +HHmm or -HHmm
                return timezoneString(options.offset, {extended: false, zulu: false});
            case "Z":
                // timezone, extended format, +HH:mm or -HH:mm or literal 'Z'
                return timezoneString(options.offset, {extended: true, zulu: true});
            case "ZZ":
                // timezone, extended format, +HH:mm or -HH:mm
                return timezoneString(options.offset, {extended: true, zulu: false});

            default: // Unknown symbol, treat as literal
                return token.data;
            }
        } else {
            return token.data;
        }
    }

    Date.prototype.format = function format(pattern, options) {
        var opt = {};
        opt.offset = (options && (options.offset || options.offset === 0)) ? +options.offset : this.getTimezoneOffset() * 60000;
        opt.locale = (options && options.locale) ? options.locale : "en";

        var tokens = tokenise(pattern),
            date = new Date(this - (opt.offset)),
            dateStr = "";

        for (var i = 0; i < tokens.length; i++) {
            dateStr += dateComponent(date, tokens[i], opt);
        }
        return dateStr;
    };

    if (window.Intl && window.Intl.DateTimeFormat) {
        Date.prototype.lookupTimezoneOffset = function lookupTimezoneOffset(timeZone) {
            // This supports any region defined by the timezone database that is supported by the implementation
            // of Intl.DateTimeFormat.
            // http://www.iana.org/time-zones

            /*
             * The Gregorian calendar was adopted on 1582-10-15, which immediately followed the Julian date
             * 1582-10-04.  Known implementations of the Intl.DateTimeFormat API return the Julian date prior
             * to this. Therefore, to account for this, this function assumes that any such dates have the same
             * offset as this cutoff date, which should be Local Mean Time for all known regions. This ignores
             * reality about the non-existence any specified region in the past and any effects of continental
             * drift upon local mean time.
             *
             * The 16th is chosen as the cutoff date to avoid timezones behind UTC (i.e. UTC-hh:mm) crossing
             * the boundary between the 4th and 15th.
             *
             * *** WARNING ***
             * This will break badly for many regions if the Intl.DateTimeFormat implementation recognises the
             * adoption of the Gregorian calendar in different regions at different times. This is not presently
             * the case in known implementations, but there is no guarantee of this.
             *
             * It is therefore not recommended that this function be used with dates prior to the introduction
             * of the Gregorian calendar in the given timeZone. Use at your own risk.
             */
            var cutoff = new Date("1582-10-16T00:00:00.000Z");
            var date = (this < cutoff) ? cutoff : this;

            // Date and Time formattters
            var fmtYear = new Intl.DateTimeFormat("en", {timeZone: timeZone, year: "numeric"}),
                // en-US gives MM/DD, which fits the necessary ISO8601 order of those components.
                fmtDate = new Intl.DateTimeFormat("en-US", {timeZone: timeZone, month: "2-digit", day: "2-digit"}),
                fmtTime = new Intl.DateTimeFormat("en", {timeZone: timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false});

            // Using ECMAScipt Date and Time format with extended year.
            var YYYYYY = '+' + pad(fmtYear.format(date), 6),
                MMDD   = fmtDate.format(date).replace('/', '-'),
                T    = fmtTime.format(date) + '.' + pad(date.getUTCMilliseconds(), 3);

            var strDateTime = YYYYYY +'-'+ MMDD +'T'+ T +'Z';
            var local = new Date(strDateTime);

            /*
             * Both ISO 8601:2004 and the ECMAScript DateTime format only support the indication of timezone
             * offsets with hours and minutes. i.e. +hh:mm or -hh:mm.
             *
             * The Date.prototype.getTimezoneOffset() method only returns values in whole minutes.
             *
             * However, due to the existence of historical timezones with non-zero seconds components,
             * only returning a whole number of minutes from this method has been deemed inappropriate.
             * e.g. Prior to 1895, the Australia/Sydney offset was +10:04:52.
             *
             * Therefore, unlike getTimezoneOffset(), this method returns the offset in milliseconds as the
             * difference between UTC and local time.
             */
            return (date.valueOf() - local);
        };
    }

    Date.prototype.getOrdinalDay = function() {
        return ISOOrdinalDay(this.getFullYear(), this.getMonth(), this.getDate());
    };

    Date.prototype.getUTCOrdinalDay = function() {
        return ISOOrdinalDay(this.getUTCFullYear(), this.getUTCMonth(), this.getUTCDate());
    };

    Date.prototype.getWeek = function getWeek() {
        // ISO Week Date: yyyy-Www-d

        // Day of week (Sunday is day 7 instead of 0)
        var d = this.getDay() || 7;

        // Get the ordinal day for the nearest Thursday
        var thurs = new Date(this.valueOf());
        thurs.setDate(this.getDate() + 4 - d);
        var ddd = thurs.getOrdinalDay();

        // Calculate the week number
        return Math.floor(1 + (ddd-1) / 7);
    };

    Date.prototype.getUTCWeek = function getUTCWeek() {
        // ISO Week Date: yyyy-Www-d

        // Day of week (Sunday is day 7 instead of 0)
        var d = this.getUTCDay() || 7;

        // Get the ordinal day for the nearest Thursday
        var thurs = new Date(this.valueOf());
        thurs.setUTCDate(this.getUTCDate() + 4 - d);
        var DDD = thurs.getUTCOrdinalDay();

        // Calculate the week number
        return Math.floor(1 + (DDD-1) / 7);
    };

    Date.prototype.getWeekYear = function getWeekYear() {
        // Day of week (Sunday is day 7 instead of 0)
        var d = this.getDay() || 7;

        // Get the ordinal day for the nearest Thursday
        var thurs = new Date(this.valueOf());
        thurs.setDate(this.getDate() + 4 - d);

        // Obtain the year in which the given Thursday resides
        return thurs.getFullYear();
    };

    Date.prototype.getUTCWeekYear = function getWeekYear() {
        // Day of week (Sunday is day 7 instead of 0)
        var d = this.getUTCDay() || 7;

        // Get the ordinal day for the nearest Thursday
        var thurs = new Date(this.valueOf());
        thurs.setUTCDate(this.getUTCDate() + 4 - d);

        // Obtain the year in which the given Thursday resides
        return thurs.getUTCFullYear();
    };
})();
