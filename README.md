# Unanswered Emails

A pit of unread emails. Hover over the pile to dig through it (the papers are shoved aside and the pile spreads, with a paper-rustle sound). Click any paper or envelope, in the heap or fluttering down, to read it as a normal email. Set in Space Grotesk.

Built with three.js 0.149 and Vite.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
```

| Path | What it holds |
| --- | --- |
| `src/main.js` | The white room, camera, lights, pointer handling and render loop |
| `src/emails.js` | The heap (a solid surface with papers lying on it), fluttering envelopes, digging, picking |
| `src/emailData.js` | 160+ made-up emails (`emailDataBase.js` holds the first 24) |
| `src/mailView.js` | The email reader that opens on a click |
| `src/emailSound.js`, `src/audio.js` | The rustle sound; `audios/` holds the sound files (any file whose name contains `ruffle`, `rustle` or `paper`) |
# email-pit
