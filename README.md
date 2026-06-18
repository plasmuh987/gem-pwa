# Gem Search PWA

A local Progressive Web App generated from `Gem Table(2).xlsx`.

## How to use locally

Open `index.html` in a browser. For full offline/PWA behavior, serve the folder from a local web server:

```bash
cd gem-pwa
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## iPhone Home Screen

Host the folder or serve it on your local network, open it in Safari, then use **Share → Add to Home Screen**.

## Search behavior

- Primary search uses: Species, Chemical Comp., Color C, P, R, O, Y, G, B, V, B 2, W, G 2, B 3, Transp., Refractive Index Normal, Range, Birefri., Optic Character, Crystal System, Pleochroism 2, 3, S, M, W 2, Disp., Specific Gravity, Hardness
- Notes search uses: Spectra (nm), UV Fluorescence, Phenomena, Characteristics, Fracture/Cleavage
- Sort options include Species, Hardness, Specific Gravity, and Refractive Index Range. Refractive Index Range sorts highest to lowest while showing the shorter label in the app.
- Gems added through the form are stored in the browser's localStorage.
- Use **Export JSON** to download the combined original + added gem data.

## Latest update

The in-app gem/logo icon now uses the same image file as the PWA app icon (`icons/icon-192.png`), so the header icon matches the Home Screen icon.
