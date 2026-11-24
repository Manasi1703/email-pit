# Unanswered Emails

A pile of unread emails on a plain white screen. The pile is made entirely of papers and envelopes, all the way down. Hover over it to dig through it (the papers on top are shoved aside, the ones underneath come into view, and the pile slumps back, with a paper-rustle sound). Click any paper or envelope, in the heap or fluttering down, to read it in a Gmail-style message view. The page is set in Aspekta (SIL OFL 1.1, `src/fonts/`); the email reader uses Gmail's fonts (Google Sans and Roboto from Google Fonts, Arial for the message).

Built with three.js 0.149 and Vite.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
```

| Path | What it holds |
| --- | --- |
| `src/main.js` | The white screen (a shadow-catching floor), camera, lights, pointer handling and render loop |
| `src/emails.js` | The heap (thousands of instanced papers filling an invisible height field), fluttering envelopes, digging, picking |
| `src/emailData.js` | 160+ made-up emails (`emailDataBase.js` holds the first 24) |
| `src/mailView.js` | The Gmail-style email reader that opens on a click |
| `src/emailSound.js`, `src/audio.js` | The rustle sound; `audios/` holds the sound files (any file whose name contains `ruffle`, `rustle` or `paper`) |
# email-pit
