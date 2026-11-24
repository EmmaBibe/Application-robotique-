#!/usr/bin/env node
/*
 * Construit les livrables à partir des sources de src/ :
 *   - livrables/simulation_mobilier.html (fichier unique, autonome)
 *   - livrables/0x_*.html (documents imprimables, autonomes)
 *   - livrables/0x_*.pdf  (si Chromium/Playwright est disponible)
 *
 * Usage : node outils/construire.js [--sans-pdf]
 */
'use strict';
const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..');
const SRC = path.join(RACINE, 'src');
const OUT = path.join(RACINE, 'livrables');
fs.mkdirSync(OUT, { recursive: true });

function integrer(fichierHtml, remplacements) {
  let html = fs.readFileSync(path.join(SRC, fichierHtml), 'utf8');
  html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
    const js = fs.readFileSync(path.join(SRC, src), 'utf8').replace(/<\/script/gi, '<\\/script');
    return '<script>\n' + js + '\n</script>';
  });
  if (remplacements) Object.keys(remplacements).forEach(k => { html = html.split(k).join(remplacements[k]); });
  return html;
}

const DOCUMENTS = [
  { type: 'dossier', fichier: '01_dossier_conception_plans', titre: 'Dossier de conception et plans' },
  { type: 'debit', fichier: '02_nomenclature_fiches_debit', titre: 'Nomenclature et fiches de débit' },
  { type: 'notice', fichier: '03_notice_montage_pose_demontage', titre: 'Notice de montage, pose et démontage' }
];

async function main() {
  const sansPdf = process.argv.includes('--sans-pdf');
  fs.writeFileSync(path.join(OUT, 'simulation_mobilier.html'), integrer('simulation.html'));
  console.log('simulation_mobilier.html');
  DOCUMENTS.forEach(d => {
    const html = integrer('document.html', { '__TYPE_DOC__': d.type, '__TITRE_DOC__': d.titre });
    fs.writeFileSync(path.join(OUT, d.fichier + '.html'), html);
    console.log(d.fichier + '.html');
  });
  if (sansPdf) return;
  let chromium;
  try { chromium = require('playwright').chromium; } catch (e) {
    console.log('Playwright absent : PDF non générés (ouvrir les .html et imprimer en PDF).');
    return;
  }
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage();
  for (const d of DOCUMENTS) {
    await page.goto('file://' + path.join(OUT, d.fichier + '.html'));
    await page.waitForFunction(() => window.DOCUMENT_PRET === true, null, { timeout: 120000 });
    await page.pdf({
      path: path.join(OUT, d.fichier + '.pdf'), preferCSSPageSize: true, printBackground: true,
      displayHeaderFooter: true, headerTemplate: '<span></span>',
      footerTemplate: '<div style="font-family:Arial,sans-serif;font-size:7pt;color:#6b7178;width:100%;padding:0 12mm;display:flex;justify-content:space-between">' +
        '<span>Mobilier étudiant · ' + d.titre + ' · Indice A</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'
    });
    console.log(d.fichier + '.pdf');
  }
  await navigateur.close();
}

main().catch(e => { console.error(e); process.exit(1); });
