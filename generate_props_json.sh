#!/usr/bin/env bash

audio_url="http://localhost:8000/001001.mp3"
timings_url="http://localhost:8000/001001.json"
words_path="qpc-hafs-word-by-word.json"
translation_path="en-sahih-international-simple.json"

while getopts "a:t:w:r:" opt; do
  case "$opt" in
    a) audio_url="$OPTARG" ;;
    t) timings_url="$OPTARG" ;;
    w) words_path="$OPTARG" ;;
    r) translation_path="$OPTARG" ;;
    *) echo "Invalid option"; exit 1 ;;
  esac
done

jq -cM -n \
  --arg audio_url "$audio_url" \
  --arg timings_url "$timings_url" \
  --arg words_path "$words_path" \
  --arg translation_path "$translation_path" \
  '{ 
      audio_url: $audio_url,
      timings_url: $timings_url,
      words_path: $words_path,
      translation_path: $translation_path
    }'
