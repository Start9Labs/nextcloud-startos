Config = "<?php" __ "$CONFIG" _ "=" _ config:Value _ ";" _ { return config }

NextArrayEntry = _ "," _ entry:ArrayEntry { return entry }

Array = "array"i _ "(" _ first:ArrayEntry rest:NextArrayEntry* _ ","? _ ")" {
    const entries = [first, ...rest]
    let res = []
    let autoIdx = 0
    for (let i = 0; i < entries.length; i++) {
        const { key, value } = entries[i]
        const k = key === null ? autoIdx : key
        if (typeof k === 'number') autoIdx = k + 1
        if (k !== res.length && Array.isArray(res))
            res = res.reduce((acc, x, idx) => ({...acc, [idx]: x }), {})
        res[k] = value
    }
    return res
}
  / "array"i _ "(" _ ")" { return [] }

ArrayEntry = key:Key _ "=>" _ value:Value { return { key, value } }
  / value:WellFormed { return { key: null, value } }

Key = String / Number

// The lookahead is what yields to `Raw`: `Number` alone matches the leading
// `-9223372036854775807` of PHP_INT_MIN and strands the rest.
Value
  = WellFormed
  / raw:Raw { return { __raw: raw } }

WellFormed = v:(String / LossyNumber / Number / NonFinite / Array / Bool / Null) &ValueEnd { return v }

// A double that does not print back to its own source silently rewrites the
// value on the next write, so carry the source through instead.
LossyNumber
  = n:$(minus? int frac? exp?) &{ return String(parseFloat(n)) !== n } {
      return { __raw: n }
    }

ValueEnd = _ ("," / ")" / ";")

// PHP matches these keywords case-insensitively, and `var_export` writes `NULL`.
Bool = "true"i { return true } / "false"i { return false }

Null = "null"i { return null }

// `INF` and `NAN` are constants, so PHP matches them case-sensitively, unlike
// the keywords above.
NonFinite
  = "-INF" { return -Infinity }
  / "INF" { return Infinity }
  / "NAN" { return NaN }

Number
  = minus? int frac? exp? { return parseFloat(text()); }

decimal_point
  = "."

digit1_9
  = [1-9]

e
  = [eE]

exp
  = e (minus / plus)? DIGIT+

frac
  = decimal_point DIGIT+

int
  = zero / (digit1_9 DIGIT*)

minus
  = "-"

plus
  = "+"

zero
  = "0"


String
  = quotation_mark chars:char* quotation_mark { return chars.join(""); }

// Inside a single-quoted PHP string only \\ and \' are escapes, and every other
// character, a raw newline included, stands for itself.
char
  = unescaped
  / escape
    sequence:(
        "'"
      / "\\"
      / c:. { return "\\" + c; }
    )
    { return sequence; }

escape
  = "\\"

quotation_mark
  = "'"

unescaped
  = [^\x27\x5C]

__ "required-whitespace" = ([ \t\n\r] / Comment)+

_ "whitespace"
  = ([ \t\n\r] / Comment)*

// Nextcloud 34 writes a banner comment between `<?php` and `$CONFIG` on every
// config write, so a comment is something this file normally contains.
Comment
  = "//" [^\n]*
  / "#" [^\n]*
  / "/*" (!"*/" .)* "*/"

// Carried through as source text: `occ` runs inside the service container, so
// a value that stops the read cannot be reached to be removed.
Raw = $RawToken+

// One line only — a run that reaches a newline is malformed, not unmodelled.
RawToken
  = String
  / DoubleQuoted
  / RawGroup
  / [^,;()\[\]'\"\n]

RawGroup
  = "(" RawInner* ")"
  / "[" RawInner* "]"

RawInner
  = String
  / DoubleQuoted
  / RawGroup
  / [^;()\[\]'\"\n]

DoubleQuoted = '"' ("\\" . / [^"\\])* '"'

DIGIT  = [0-9]