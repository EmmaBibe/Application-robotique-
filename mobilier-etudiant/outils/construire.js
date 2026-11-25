#!/usr/bin/env node
/*
 * Construit les livrables à partir des sources de src/ :
 *   - livrables/simulation_mobilier.html (fichier unique, autonome)
 *   - livrables/0x_*.html (documents imprimables, autonomes)
 *   - livrables/0x_*.pdf  (si Chromium/Playwright est disponible)
 *
 * Usage : node outils/construire.js [--sans-pdf] [--passes=40]
 *   --passes : nombre de passes du rendu photo des perspectives (0 = rendu temps réel, plus rapide)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..');
const SRC = path.join(RACINE, 'src');
const OUT = path.join(RACINE, 'livrables');
const BUILD = path.join(RACINE, 'build');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(BUILD, { recursive: true });

/* Rendu réaliste : three.js + nos modules regroupés en un seul script, textures intégrées en base64 */
function construireRendu3D() {
  const esbuild = require('esbuild');
  esbuild.buildSync({
    entryPoints: [path.join(SRC, 'rendu3d', 'index.js')], bundle: true, minify: true, format: 'iife',
    target: ['es2020'], outfile: path.join(BUILD, 'rendu3d.bundle.js'), legalComments: 'inline', logLevel: 'warning'
  });
  const dir = path.join(SRC, 'textures');
  const tex = {};
  fs.readdirSync(dir).filter(f => /\.(jpg|png)$/.test(f)).forEach(f => {
    const mime = f.endsWith('.png') ? 'image/png' : 'image/jpeg';
    tex[f.replace(/\.(jpg|png)$/, '')] = 'data:' + mime + ';base64,' + fs.readFileSync(path.join(dir, f)).toString('base64');
  });
  const js = 'window.TEXTURES_3D = ' + JSON.stringify(tex) + ';\n' + fs.readFileSync(path.join(BUILD, 'rendu3d.bundle.js'), 'utf8');
  fs.writeFileSync(path.join(BUILD, 'rendu3d.js'), js);
}

function integrer(fichierHtml, remplacements) {
  let html = fs.readFileSync(path.join(SRC, fichierHtml), 'utf8');
  html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
    const fichier = src === 'rendu3d.js' ? path.join(BUILD, 'rendu3d.js') : path.join(SRC, src);
    const js = fs.readFileSync(fichier, 'utf8').replace(/<\/script/gi, '<\\/script');
    return '<script>\n' + js + '\n</script>';
  });
  if (remplacements) Object.keys(remplacements).forEach(k => { html = html.split(k).join(remplacements[k]); });
  return html;
}

const DOCUMENTS = [
  { type: 'dossier', fichier: '01_dossier_conception_plans', titre: 'Dossier de conception et plans' },
  { type: 'debit', fichier: '02_nomenclature_fiches_debit', titre: 'Nomenclature et fiches de débit' },
  { type: 'notice', fichier: '03_notice_montage_pose_demontage', titre: 'Notice de montage, pose et démontage' },
  { type: 'devis', fichier: '04_devis_achats', titre: 'Devis d\'achat' }
];

/* Devis Excel : liste d'achat consolidée, prix à saisir, totaux automatiques */
function construireDevisExcel() {
  const MODELE = require(path.join(SRC, 'modele.js'));
  const CALC = require(path.join(SRC, 'calculs.js'));
  const achats = CALC.listeAchats(MODELE);
  const pieces = [];
  Object.values(MODELE.MEUBLES).forEach(m => CALC.nomenclature(m, MODELE.SECTIONS).liste.filter(g => g.cat === 'panneau').forEach(g => {
    pieces.push({ mat: g.mat, rep: g.rep, nom: g.noms.join(' / '), L: g.debit.L, l: g.debit.l, qte: g.qte, usin: g.debit.usin });
  }));
  const json = path.join(BUILD, 'achats.json');
  fs.writeFileSync(json, JSON.stringify({ version: MODELE.version, date: MODELE.date, sections: achats.sections, debitTubes: achats.debitTubes, pieces }));
  const r = require('child_process').spawnSync('python3', [path.join(__dirname, 'devis_xlsx.py'), json, path.join(OUT, '04_devis_achats.xlsx')], { stdio: 'inherit' });
  console.log(r.status === 0 ? '04_devis_achats.xlsx' : 'Devis Excel non généré (python3 + openpyxl requis)');
}

async function main() {
  const sansPdf = process.argv.includes('--sans-pdf');
  const arg = process.argv.find(a => a.startsWith('--passes='));
  global.PASSES = arg ? +arg.split('=')[1] : 40;
  construireRendu3D();
  fs.writeFileSync(path.join(OUT, 'simulation_mobilier.html'), integrer('simulation.html'));
  console.log('simulation_mobilier.html');
  DOCUMENTS.forEach(d => {
    const html = integrer('document.html', { '__TYPE_DOC__': d.type, '__TITRE_DOC__': d.titre });
    fs.writeFileSync(path.join(OUT, d.fichier + '.html'), html);
    console.log(d.fichier + '.html');
  });
  construireDevisExcel();
  if (sansPdf) return;
  let chromium;
  try { chromium = require('playwright').chromium; } catch (e) {
    console.log('Playwright absent : PDF non générés (ouvrir les .html et imprimer en PDF).');
    return;
  }
  // SwiftShader : WebGL logiciel pour produire les vues réalistes sans carte graphique
  const navigateur = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  const page = await navigateur.newPage();
  for (const d of DOCUMENTS) {
    // les perspectives principales sont calculées par lancer de rayons (passes réglables, 0 = rendu temps réel)
    await page.goto('file://' + path.join(OUT, d.fichier + '.html') + '?passes=' + PASSES, { waitUntil: 'commit', timeout: 900000 });
    await page.waitForFunction(() => window.DOCUMENT_PRET === true, null, { timeout: 900000 });
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
