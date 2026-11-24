/* Bibliothèque de matières physiques (PBR) et de textures */
const EN_ATTENTE = [];

export function MATIERES(THREE, rafraichir, sources) {
  const cache = new Map();
  const textures = new Map();

  function texture(nom, couleur) {
    const cle = nom + (couleur ? ':c' : '');
    if (textures.has(cle)) return textures.get(cle);
    const t = new THREE.Texture();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    if (couleur) t.colorSpace = THREE.SRGBColorSpace;
    const src = sources[nom];
    if (src) {
      const img = new Image();
      EN_ATTENTE.push(new Promise(res => {
        img.onload = () => { t.image = img; t.needsUpdate = true; rafraichir(); res(); };
        img.onerror = () => res();
      }));
      img.src = src;
    }
    textures.set(cle, t);
    return src ? t : null;
  }

  /* Chant de contreplaqué : plis alternés clairs et foncés */
  function textureChant() {
    if (textures.has('chant')) return textures.get('chant');
    const c = document.createElement('canvas');
    c.width = 16; c.height = 128;
    const x = c.getContext('2d');
    const plis = 7;
    for (let i = 0; i < plis; i++) {
      const clair = i % 2 === 0;
      x.fillStyle = clair ? '#e2c497' : '#c9a372';
      x.fillRect(0, i * 128 / plis, 16, 128 / plis);
      x.fillStyle = 'rgba(90,60,30,0.35)';
      x.fillRect(0, i * 128 / plis, 16, 1);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    textures.set('chant', t);
    return t;
  }

  /* Bruit fin pour l'inox brossé */
  function textureBrossee() {
    if (textures.has('brosse')) return textures.get('brosse');
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const x = c.getContext('2d');
    const d = x.createImageData(256, 256);
    for (let j = 0; j < 256; j++) {
      let v = 0.5;
      for (let i = 0; i < 256; i++) {
        v = 0.92 * v + 0.08 * Math.random();
        const g = 120 + (v - 0.5) * 160 + (Math.random() - 0.5) * 20;
        const k = (j * 256 + i) * 4;
        d.data[k] = d.data[k + 1] = d.data[k + 2] = g; d.data[k + 3] = 255;
      }
    }
    x.putImageData(d, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    textures.set('brosse', t);
    return t;
  }

  function creer(nom, couleur) {
    const C = (h) => new THREE.Color(h);
    switch (nom) {
      case 'peinture': return new THREE.MeshPhysicalMaterial({ color: C(couleur || '#3c434b'), roughness: 0.38, metalness: 0.2, clearcoat: 0.35, clearcoatRoughness: 0.35 });
      case 'inox': return new THREE.MeshStandardMaterial({ color: C('#d9dde1'), metalness: 1, roughness: 0.3, roughnessMap: textureBrossee() });
      case 'chrome': return new THREE.MeshStandardMaterial({ color: C('#f4f5f7'), metalness: 1, roughness: 0.07 });
      case 'galva': return new THREE.MeshStandardMaterial({ color: C('#c4cbd1'), metalness: 0.95, roughness: 0.45, roughnessMap: textureBrossee() });
      case 'alu': return new THREE.MeshStandardMaterial({ color: C('#d8dce0'), metalness: 1, roughness: 0.32, roughnessMap: textureBrossee() });
      case 'zinc': return new THREE.MeshStandardMaterial({ color: C('#b9bec4'), metalness: 0.9, roughness: 0.35 });
      case 'noirOxyde': return new THREE.MeshStandardMaterial({ color: C('#2a2c2f'), metalness: 0.7, roughness: 0.38 });
      case 'laiton': return new THREE.MeshStandardMaterial({ color: C('#c9a24a'), metalness: 1, roughness: 0.3 });
      case 'bois': return new THREE.MeshStandardMaterial({ color: C('#ffffff'), map: texture('bois_diff', true), normalMap: texture('bois_nor'), normalScale: new THREE.Vector2(0.35, 0.35), roughness: 0.52 });
      case 'boisFonce': return new THREE.MeshStandardMaterial({ color: C('#b58b5c'), map: texture('bois_diff', true), roughness: 0.55 });
      case 'chant': return new THREE.MeshStandardMaterial({ map: textureChant(), roughness: 0.7 });
      case 'carrelage': return new THREE.MeshStandardMaterial({ map: texture('carrelage_diff', true), normalMap: texture('carrelage_nor'), roughness: 0.32, color: C('#ffffff') });
      case 'enduit': return new THREE.MeshStandardMaterial({ map: texture('enduit_diff', true), normalMap: texture('enduit_nor'), normalScale: new THREE.Vector2(0.35, 0.35), roughness: 0.92, color: C('#fdfbf7') });
      case 'plinthe': return new THREE.MeshStandardMaterial({ color: C('#f4f2ee'), roughness: 0.5 });
      case 'verre': return new THREE.MeshPhysicalMaterial({ color: C('#ffffff'), metalness: 0, roughness: 0.03, transmission: 1, thickness: 2.5, ior: 1.5, specularIntensity: 1, envMapIntensity: 1.2 });
      case 'verreTeinte': return new THREE.MeshPhysicalMaterial({ color: C(couleur), metalness: 0, roughness: 0.05, transmission: 0.92, thickness: 4, ior: 1.5, attenuationColor: C(couleur), attenuationDistance: 60 });
      case 'pet': return new THREE.MeshPhysicalMaterial({ color: C('#e9f6fb'), metalness: 0, roughness: 0.08, transmission: 0.96, thickness: 1, ior: 1.45, attenuationColor: C('#bfe3f0'), attenuationDistance: 200 });
      case 'liquide': return new THREE.MeshPhysicalMaterial({ color: C(couleur), roughness: 0.1, transmission: 0.6, thickness: 30, ior: 1.33, attenuationColor: C(couleur), attenuationDistance: 50 });
      case 'ceramique': return new THREE.MeshPhysicalMaterial({ color: C(couleur || '#f2efe8'), roughness: 0.25, clearcoat: 0.9, clearcoatRoughness: 0.1 });
      case 'email': return new THREE.MeshPhysicalMaterial({ color: C(couleur || '#f1efe9'), roughness: 0.22, clearcoat: 0.7 });
      case 'plastique': return new THREE.MeshStandardMaterial({ color: C(couleur || '#f1f1ee'), roughness: 0.45 });
      case 'plastiqueBrillant': return new THREE.MeshPhysicalMaterial({ color: C(couleur), roughness: 0.25, clearcoat: 0.6 });
      case 'caoutchouc': return new THREE.MeshStandardMaterial({ color: C(couleur || '#1b1c1e'), roughness: 0.9 });
      case 'fonte': return new THREE.MeshStandardMaterial({ color: C('#2c2d2f'), roughness: 0.75, metalness: 0.45 });
      case 'verreNoir': return new THREE.MeshPhysicalMaterial({ color: C('#060607'), roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, metalness: 0.1 });
      case 'antiadhesif': return new THREE.MeshStandardMaterial({ color: C('#232427'), roughness: 0.55, metalness: 0.2 });
      case 'peintureBouteille': return new THREE.MeshPhysicalMaterial({ color: C(couleur || '#1f5aa6'), roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2, metalness: 0.2 });
      case 'tissuLin': return new THREE.MeshPhysicalMaterial({ color: C(couleur), map: texture('lin_diff', true), normalMap: texture('lin_nor'), normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.95, sheen: 0.25, sheenRoughness: 0.9, sheenColor: C('#ffffff'), side: THREE.DoubleSide });
      case 'tissuJersey': return new THREE.MeshPhysicalMaterial({ color: C(couleur), map: texture('jersey_diff', true), normalMap: texture('jersey_nor'), roughness: 0.95, sheen: 0.5, sheenRoughness: 0.7, sheenColor: C('#ffffff') });
      case 'denim': return new THREE.MeshPhysicalMaterial({ color: C(couleur || '#ffffff'), map: texture('denim_diff', true), normalMap: texture('denim_nor'), roughness: 0.95, sheen: 0.3, sheenColor: C('#ffffff') });
      case 'cuir': return new THREE.MeshPhysicalMaterial({ color: C(couleur), roughness: 0.45, clearcoat: 0.3 });
      case 'mat': return new THREE.MeshStandardMaterial({ color: C(couleur || '#888'), roughness: 0.6 });
      case 'emissif': return new THREE.MeshStandardMaterial({ color: C('#000'), emissive: C(couleur || '#ff3b1f'), emissiveIntensity: 2 });
      default: return new THREE.MeshStandardMaterial({ color: C(couleur || '#999999'), roughness: 0.5 });
    }
  }

  return {
    get(nom, couleur) {
      const cle = nom + '|' + (couleur || '');
      if (!cache.has(cle)) cache.set(cle, creer(nom, couleur));
      return cache.get(cle);
    }
  };
}

MATIERES.pret = () => Promise.all(EN_ATTENTE);
MATIERES.attendre = (p) => { EN_ATTENTE.push(p); return p; };
