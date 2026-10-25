# p2clgames.github.io

P2CLGames site on GitHub Pages.

- `privacy.html`: Privacy Policy, `terms.html`: Terms of Service. English by default; the menu at the top right switches to 한국어 / 日本語. Link straight to a language with `?lang=ko` or `?lang=ja`.
- The text lives in `src/privacy/` and `src/terms/` (`en.md`, `ko.md`, `ja.md`). Korean is the source; after editing, run `node tools/build.js` and commit both the `.md` and the `.html` files.
- `app-ads.txt`: AdMob seller list.
