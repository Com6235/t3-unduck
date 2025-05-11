set shell := ['nu', '-l', '-c']
set script-interpreter := ['nu', '-l']
set unstable

dev:
	bun run build
	bun run preview

[script]
get-bangs:
	mkdir ./src/bangs
	let sort_predicate = {|x| $x.t | split chars | first | if ($in =~ '[a-zA-Z0-9]') { 1 } else { 2 } }
	let bangs = http get https://duckduckgo.com/bang.js
	  | from json
	  | reject sc? c? r? 
	  | sort-by $sort_predicate
	  | chunk-by $sort_predicate

	let first_char_predicate = {|x| $x.t | split chars | first | str downcase }
	$bangs.0
	  | sort-by $first_char_predicate
	  | chunk-by $first_char_predicate
	  | each {|x| $x | to json | save $'./src/bangs/($x.0.t | split chars | first | str downcase).json' }
	
	$bangs.1
	  | sort-by $first_char_predicate
	  | to json
	  | save './src/bangs/other.json'
