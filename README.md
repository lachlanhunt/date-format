Date Formatting Utility
=======================

This utility provides a simplified date formatting function.

    date.format(pattern, options)

The function is available on date instances and accepts a pattern string and an options object.

The pattern string is made up of symbols (see table) representing components of the date and time and may be combined as needed.

| Symbol  | Description
| ------- | -----------
| `YY`    | year, 2 digit
| `YYYY`  | year, 4 digit
| `M`     | month, number, no leading zero
| `MM`    | month, number, leading zero
| `MMM`   | month, name, 3 letter
| `MMMM`  | month, name, full
| `D`     | day of month, number, no leading zero
| `DD`    | day of month, number, leading zero
| `DDD`   | day of year, number, 3 digits
| `DDDD`  | count of days in month, number
| `yy`    | week-numbering year, 2 digit (Alternative symbol: WW)
| `yyyy`  | week-numbering year, 4 digit (Alternative symbol: WWWW)
| `w`     | week, number, no leading zero
| `ww`    | week, number, leading zero
| `d`     | day of week, number, 1 (Monday) to 7 (Sunday)
| `dd`    | day of week, name, initial, M, T, W, T, F, S, S
| `ddd`   | day of week, name, 3 letter, Mon to Sun
| `dddd`  | day of week, name, full, Monday to Sunday
| `C`     | Century component, number, no leading zero
| `CC`    | Century component, number, leading zero
| `c`     | Ordinal century, number, no leading zero
| `cc`    | Ordinal century, number, leading zero
| `E`     | Era, "BCE" or "CE"
| `EE`    | Era, "Before Common Era" or "Common Era"
| `h`     | hour, number, 12 hour, no leading zero
| `hh`    | hour, number, 12 hour, leading zero
| `H`     | hour, number, 24 hour, no leading zero
| `HH`    | hour, number, 24 hour, leading zero
| `m`     | minute, number, no leading zero
| `mm`    | minute, number, leading zero
| `s`     | second, number, no leading zero
| `ss`    | second, number, leading zero
| `f`     | fraction of second, number, 1 digit
| `ff`    | fraction of second, number, 2 digits
| `fff`   | fraction of second, number, 3 digits
| `a`     | meridiem, 1 letter, lowercase (a or p) (Alternative symbol: p)
| `aa`    | meridiem, 2 letter, lowercase (am or pm) (Alternative symbol: pp)
| `A`     | meridiem, 1 letter, uppercase (A or P) (Alternative symbol: P)
| `AA`    | meridiem, 2 letter, uppercase (AM or PM) (Alternative symbol: PP)
| `z`     | timezone, basic format, +HHmm or -HHmm or literal 'Z'
| `zz`    | timezone, basic format, +HHmm or -HHmm
| `Z`     | timezone, extended format, +HH:mm or -HH:mm or literal 'Z'
| `ZZ`    | timezone, extended format, +HH:mm or -HH:mm
| `#`     | Ordinal suffix. Append to symbol representing a numeric value for the English ordinal suffix. (1st, 2nd, 3rd, 4th, ...) e.g. `(new Date("2013-05-23")).format("D#' of 'MMMM, YYYY")` returns "23rd of May, 2013". Not supported for fractions of a second or timezone offsets
| `'...'` | Literal character sequences
| `"..."` | Literal character sequences
| `\`     | Single-character escape. Useful for outputting apostrophes. Remeber you need to double escape the backslash for JavaScript strings too. e.g. `(new Date(1999-07-03)).format("DD MMM \\'YY");` outputs "03 Jul '99"

Any sequence of characters that does not match any of the above symbols is output as a literal string.

Examples
========

For all examples, assume:

    var date = new Date("2013-04-19T09:23:07Z");

| Pattern | Output | Description |
| ------- | ------ | ----------- |
| `"YYYY-MM-DD"` | 2013-04-19 | ISO 8601 conforming date
| `"D MMM YYYY"` | 19 Apr 2013 |
| `"YYYY-MM-DDTHH:mm:ss.fffZZ"` | 2013-04-19T09:23:07+00:00

