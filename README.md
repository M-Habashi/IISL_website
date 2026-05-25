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
