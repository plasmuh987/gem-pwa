# Gem Search PWA

A local Progressive Gem Search Web App.

## How to use 

Open https://plasmuh987.github.io/gem-pwa/ in a browser.

## iPhone Home Screen

Open the above link in Safari, then use **Share → Add to Home Screen**.

## Search behavior

- Primary search uses: Species, Chemical Comp., Color C, P, R, O, Y, G, B, V, B 2, W, G 2, B 3, Transp., Refractive Index Normal, Range, Birefri., Optic Character, Crystal System, Pleochroism 2, 3, S, M, W 2, Disp., Specific Gravity, Hardness. Numeric RI searches match gems whose Refractive Index Normal value or normal range contains the number searched.
- Notes search uses: Spectra (nm), UV Fluorescence, Phenomena, Characteristics, Fracture/Cleavage
- Sort options include Species, Hardness, Specific Gravity, and Refractive Index Range. Refractive Index Range sorts highest to lowest while showing the shorter label in the app.
- Gems added through the form are stored in the browser's localStorage.
- Gems added through the form are stored in the browser's localStorage. The add form supports primary and secondary transparency choices: O, STL, TL, STP, and TP.
- Header subtitles rotate from `subtitles.txt`; edit that file with one message per line to change the rotating messages.
- Use **Export JSON** to download the combined original + added gem data.
- Use the Filter / Exclude menu to include or exclude gems by transparency, color, and crystal system. Multiple choices within one group match any selected value; different groups are combined together.
## Latest update

Release 6.22.26

Specific gravity Search bar
