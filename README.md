# IISL Website

Static website repository for the Intelligent Infrastructure Systems Laboratory.

Live website: https://engineering.purdue.edu/IISL/

## Top-Level Structure

- `index.html`: main IISL homepage. Keep this file at the repository root.
- `pages/`: legacy IISL content pages such as news, people, facilities, projects, and publications.
- `assets/`: shared legacy-site assets used by the root IISL pages:
  - `assets/css/style.css`
  - `assets/images/`
  - `assets/js/`
  - `assets/SpryAssets/`
  - `assets/videos/`
- `CPS_website/`: standalone CPS/MechWorks site. Keep this folder in place and avoid unrelated edits.
- `MECHS/`: MECH website files.
- `RTHS_Curriculum/`: curriculum content kept at the original IISL path because the live MECH Learning Materials page links to it directly.
- `Publications/`: publication PDFs and related documents.
- `bat/`: Windows helper scripts for server sync and GitHub pull/push workflows.
- `unused/`: quarantined files that are not part of the live website.

## Local Preview

From the repository root:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/index.html`.

For the CPS site, use `http://localhost:8000/CPS_website/index.html`.

## Prof Dyke Manuscript Link Request Instructions

Use the redirect page when a manuscript needs one stable IISL link that can first point to a local PDF and later point to the published location.

Public redirect URL after deployment. This is the stable link to share and reuse later for the published page:

```text
https://engineering.purdue.edu/IISL/redirect/AIAA-LSED-TF-Opion-Paper/
```

Do not share the direct PDF URL. Share only the stable redirect URL above so the same link can later point to the publication page.

Redirect file:

```text
redirect/AIAA-LSED-TF-Opion-Paper/index.html
```

To update the destination, change only the `TARGET_URL` line. The current temporary PDF target is:

```js
const TARGET_URL = "../AIAA%20LSED%20TF%20Opion%20Paper.pdf";
```

The PDF is hosted next to the redirect page:

```text
redirect/AIAA LSED TF Opion Paper.pdf
```

After the manuscript is published, replace that same line with the final public link, for example:

```js
const TARGET_URL = "https://doi.org/10.xxxx/xxxxx";
```
