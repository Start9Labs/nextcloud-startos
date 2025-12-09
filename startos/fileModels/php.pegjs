Config = "<?php" __ "$CONFIG" _ "=" _ config:Value _ ";" _ { return config }

NextArrayEntry = _ "," _ entry:ArrayEntry { return entry }

Array = "array" _ "(" _ first:ArrayEntry rest:NextArrayEntry* _ ","? _ ")" {
    const entries = [first, ...rest]
    let res = []
    for (let i = 0; i < entries.length; i++) {
        const { key, value } = entries[i]
        if (key !== res.length && Array.isArray(res))
            res = res.reduce((acc, x, idx) => ({...acc, [idx]: x }), {})
        res[key] = value
    }
    return res
}

ArrayEntry = key:Key _ "=>" _ value:Value { return { key, value } }

Key = String / Number

Value = String / Number / Array / Bool / Null

Bool = "true" / "false" { 
    switch (text()) {
        case "true":
            return true
        case "false":
            return false
    }
}

Null = "null" { return null }

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

char
  = unescaped
  / escape
    sequence:(
        "'"
      / "\\"
      / "/"
      / "b" { return "\b"; }
      / "f" { return "\f"; }
      / "n" { return "\n"; }
      / "r" { return "\r"; }
      / "t" { return "\t"; }
      / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
          return String.fromCharCode(parseInt(digits, 16));
        }
    )
    { return sequence; }

escape
  = "\\"

quotation_mark
  = "'"

unescaped
  = [^\0-\x1F\x27\x5C]

__ "required-whitespace" = [ \t\n\r]+

_ "whitespace"
  = [ \t\n\r]*

DIGIT  = [0-9]
HEXDIG = [0-9a-f]i