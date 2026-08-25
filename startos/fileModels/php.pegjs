Config = "<?php" __ "$CONFIG" _ "=" _ config:Value _ ";" _ { return config }

NextArrayEntry = _ "," _ entry:ArrayEntry { return entry }

Array = "array" _ "(" _ first:ArrayEntry rest:NextArrayEntry* _ ","? _ ")" {
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
  / "array" _ "(" _ ")" { return [] }

ArrayEntry = key:Key _ "=>" _ value:Value { return { key, value } }
  / value:Value { return { key: null, value } }

Key = String / Number

Value = String / Number / Array / Bool / Null

// PHP matches these keywords case-insensitively, and `var_export` writes `NULL`.
Bool = "true"i { return true } / "false"i { return false }

Null = "null"i { return null }

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

// Inside a single-quoted PHP string only \\ and \' are escapes. Every other
// character stands for itself, including a raw newline, and a backslash before
// anything else is a literal backslash.
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

__ "required-whitespace" = [ \t\n\r]+

_ "whitespace"
  = [ \t\n\r]*

DIGIT  = [0-9]