# Gem Search PWA

A local Progressive Gem Search Web App.

## How to use 

Open https://plasmuh987.github.io/gem-pwa/ in a browser.

## iPhone Home Screen

Open the above link in Safari, then use **Share → Add to Home Screen**.

## Search behavior

- Primary search uses: Species, Chemical Comp., Color C, P, R, O, Y, G, B, V, B 2, W, G 2, B 3, Transp., Refractive Index Normal, Range, Birefri., Optic Character, Crystal System, Pleochroism 2, 3, S, M, W 2, Disp., Specific Gravity, Hardness. Numeric RI searches match gems whose Refractive Index Normal value/range contains the number searched.
- Notes search uses: Spectra (nm), UV Fluorescence, Phenomena, Characteristics, Fracture/Cleavage
- Sort options include Species, Hardness, Specific Gravity, and Refractive Index Range. Refractive Index Range sorts highest to lowest while showing the shorter label in the app.
- Gems added through the form are stored in the browser's localStorage. The add form supports primary and secondary transparency choices: O, STL, TL, STP, and TP.
- Header subtitles rotate from `subtitles.txt`; edit that file with one message per line to change the rotating messages.
- Use **Export JSON** to download the combined original + added gem data.

## Latest update

Release 6.18.26


## Filtering

Use the Filter / Exclude menu to include or exclude gems by transparency, color, and crystal system. Multiple choices within one group match any selected value; different groups are combined together.

- The filter/exclude menu is optimized for mobile as a bottom-sheet drawer with larger tap targets.

- Mobile-friendly filter drawer with one-button Transparency, Color, and Crystal System controls: tap once to filter, double-tap to exclude.

### Latest update
- Added a dedicated Specific Gravity search with one flexible input. Enter exact SG (`3.52`), SG plus variation (`3.52 0.02` or `3.52 +/- .02`), separate `+` / `-` variation values, or a direct range (`3.50-3.54`).
- Specific Gravity search matches against each gem's saved SG range, including `+/-`, separate `+` / `-` variation values, direct ranges, or exact one-number SG values.
- Add Gem still keeps its separate SG value, variation, and **No variation / None** controls for clearer data entry.
