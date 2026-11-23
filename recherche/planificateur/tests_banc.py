"""Tests de cohérence du banc d'essai. À lancer avant chaque campagne : python3 tests_banc.py
Chaque test vérifie un point où une erreur fausserait les résultats."""
import copy, csv, glob, os, sys
import numpy as np
import sim, planners as P, robot_reel as RR

OK, KO = [], []
def check(nom, cond, detail=''):
    (OK if cond else KO).append(nom); print(('  ok   ' if cond else '  ÉCHEC ') + nom + (f'  ({detail})' if detail else ''))

print('0. Catalogue des planificateurs')
noms = [c.__name__ for c in P.ALL]; libs = [c.name for c in P.ALL]
check('aucun nom de classe en double', len(set(noms)) == len(noms), str(sorted({n for n in noms if noms.count(n) > 1})))
check('aucun libellé en double', len(set(libs)) == len(libs), str(sorted({n for n in libs if libs.count(n) > 1})))

print('1. Reproductibilité')
for sc in ['foule', 'traversee']:
    a = sim.run_episode(sim.World(sc, 5), P.Memory(P.MPPI)); b = sim.run_episode(sim.World(sc, 5), P.Memory(P.MPPI))
    check(f'même monde, même planificateur, même résultat ({sc})', a['outcome'] == b['outcome'] and abs(a['temps'] - b['temps']) < 1e-9 and abs(a['longueur'] - b['longueur']) < 1e-9)
    os.environ['REEL'] = '1'
    a = sim.run_episode(sim.World(sc, 5), P.Memory(P.MPPI)); b = sim.run_episode(sim.World(sc, 5), P.Memory(P.MPPI))
    del os.environ['REEL']
    check(f'idem avec le robot réaliste ({sc})', a['outcome'] == b['outcome'] and abs(a['longueur'] - b['longueur']) < 1e-9)
w1, w2 = sim.World('carrefour', 3), sim.World('carrefour', 3)
check('deux mondes de même graine sont identiques', np.allclose(w1.static, w2.static) and all(np.allclose(a['p'], b['p']) for a, b in zip(w1.dyn, w2.dyn)))
w3 = sim.World('carrefour', 4)
check('deux graines différentes donnent des mondes différents', not (len(w1.dyn) == len(w3.dyn) and all(np.allclose(a['p'], b['p']) for a, b in zip(w1.dyn, w3.dyn))))

print('2. Le bruit de mesure ne change pas l\'évolution du monde')
wa, wb = sim.World('foule', 7), sim.World('foule', 7)
for k in range(50):
    wa.obstacles(noise=0.05); wa.step_obstacles(k * 0.1)            # on mesure dans un seul des deux mondes
    wb.step_obstacles(k * 0.1)
check('mondes identiques avec ou sans mesures', all(np.allclose(a['p'], b['p']) for a, b in zip(wa.dyn, wb.dyn)))

print('3. Détection de collision')
class Fixe:
    def __init__(self, u): self.u = u
    def reset(self, st, g): pass
    def act(self, t, s, o): return self.u
w = sim.World('foret', 1); w.static = np.array([[5.0, 10.0, 0.5]]); w.dyn = []
r = sim.run_episode(w, Fixe((1.0, 0.0)), perturb=False)
check('un robot qui fonce sur un obstacle le percute', r['outcome'] == 'collision', f"t = {r['temps']:.1f} s")
# contact quand le centre du robot est à 0,3 m (rayon du robot) du bord : 5 − 0,5 − 0,3 − 1,5 = 2,7 m ;
# 0,5 s pour atteindre 1 m/s (0,25 m parcourus), puis 2,45 m à 1 m/s : contact attendu vers 2,95 s
check('au bon moment (contact attendu vers 2,95 s)', abs(r['temps'] - 2.95) <= 0.15, f"{r['temps']:.2f} s")
w = sim.World('foret', 1); w.static = np.zeros((0, 3)); w.dyn = []
r = sim.run_episode(w, Fixe((1.0, 0.0)), perturb=False)
check('sans obstacle, il arrive au but en ligne droite', r['outcome'] == 'succes' and abs(r['longueur'] - 16.5) < 0.6, f"{r['longueur']:.2f} m")

print('4. Latence : la mesure livrée a exactement le retard annoncé')
class Espion:
    def __init__(self): self.vu = []
    def reset(self, st, g): pass
    def act(self, t, s, o): self.vu.append(s.copy()); return (1.0, 0.0)
for L in (1, 2):
    w = sim.World('foret', 1); w.static = np.zeros((0, 3)); w.dyn = []
    e = Espion(); r = sim.run_episode(w, e, perturb=False, cond=dict(lat=L), record=True)
    path = r['path']
    ok = all(np.allclose(e.vu[k][:2], path[max(0, k - L)]) for k in range(L + 2, 30))
    check(f'retard de {L} pas', ok)

print('5. Perception : portée et masquage')
w = sim.World('foret', 1); w.static = np.array([[5.0, 10.0, 0.5]])
w.dyn = [dict(p=np.array([8.0, 10.0]), v=np.zeros(2), r=0.35, kind='flux', mode='x', t_switch=1e9, done=True, reactif=False),
         dict(p=np.array([3.0, 13.0]), v=np.zeros(2), r=0.35, kind='flux', mode='x', t_switch=1e9, done=True, reactif=False),
         dict(p=np.array([15.0, 10.0]), v=np.zeros(2), r=0.35, kind='flux', mode='x', t_switch=1e9, done=True, reactif=False)]
o = w.obstacles(robot=np.array([2.0, 10.0, 0.0]), rng_range=5.0, occl=True)
ids = set(o[:, 6].astype(int))
check('l\'agent caché derrière l\'obstacle n\'est pas vu', 1000 not in ids)
check('l\'agent visible et proche est vu', 1001 in ids)
check('l\'agent hors de portée n\'est pas vu', 1002 not in ids)

print('6. Oracle : il voit bien le vrai futur (agents non réactifs)')
w = sim.World('carrefour_rapide', 11); orc = P.OracleMPPI(); orc.reset(w.static, w.goal); orc.bind(w); w.t = 0.0
Pf = orc.future(w.obstacles())
wt = copy.deepcopy(w); err = 0
for k in range(orc.T):
    wt.step_obstacles(k * 0.1); err = max(err, np.abs(wt.true_obstacles()[:, :2] - Pf[k]).max())
check('futur de l\'oracle = vrai futur', err < 1e-9, f'écart max {err:.2e}')

print('7. Robot réaliste')
rb = RR.RealRobot([0, 0, 0], np.random.default_rng(0))
for k in range(20): rb.step(1.5, 0.0)
check('vitesse après 2 s entre 1,3 et 1,5 m/s', 1.3 <= rb.v <= 1.5, f'{rb.v:.2f}')
rb = RR.RealRobot([0, 0, 0], np.random.default_rng(0)); ws = []
for k in range(15): rb.step(0.0, 1.0); ws.append(rb.w)
check('rotation : 90 % en moins de 0,4 s, dépassement < 10 %', np.argmax(np.array(ws) > 0.9) <= 4 and max(ws) < 1.1, f'max {max(ws):.2f}')
rb = RR.RealRobot([0, 0, 0], np.random.default_rng(0))
for k in range(30): rb.step(1.0, 2.0)
vl, vr = (rb.v - rb.w * RR.B / 2), (rb.v + rb.w * RR.B / 2)
check('vitesses de roue plafonnées à 1,5 m/s', max(abs(vl), abs(vr)) <= 1.5 + 0.03, f'{vl:.2f} / {vr:.2f}')
rb = RR.RealRobot([0, 0, 0], np.random.default_rng(1))
for k in range(200): rb.step(1.0, 0.5 * np.sin(k / 10))
check('erreur de localisation reste petite (< 0,15 m)', np.hypot(*(rb.est[:2] - rb.p[:2])) < 0.15, f'{np.hypot(*(rb.est[:2] - rb.p[:2])):.3f} m')
rb = RR.RealRobot([0, 0, 0], np.random.default_rng(0))
for k in range(20): rb.step(1.5, 0)
for k in range(20): rb.step(0.0, 0)
check('le robot s\'arrête sans reculer', -0.05 <= rb.v <= 0.05, f'{rb.v:.3f}')

print('8. Estimation des vitesses des personnes')
tr = RR.Tracker(); w = sim.World('carrefour_rapide', 2); errs = []
for k in range(40):
    o = tr(w.obstacles(noise=0.05)); w.step_obstacles(k * 0.1)
    if k > 15:
        true = np.array([d['v'] for d in w.dyn]); errs.append(np.abs(o[o[:, 5] > 0, 2:4] - true).mean())
check('erreur moyenne de vitesse < 0,3 m/s une fois le filtre établi', np.mean(errs) < 0.3, f'{np.mean(errs):.2f} m/s')

print('9. Mémoire de carte')
m = P.Memory(P.MPPI); m.reset(np.zeros((0, 3)), np.array([18.5, 10.0]))
o1 = np.array([[5, 5, 0, 0, 0.5, 0, 0]], float); m.act(0, np.array([1.5, 10, 0]), o1)
check('un obstacle fixe vu une fois reste connu', len(m.known) == 1)

print('10. Mondes faisables')
for sc in ['foret', 'carrefour', 'couloir', 'piege', 'foule', 'foule_dense', 'carrefour_rapide', 'traversee', 'goulot', 'coin_aveugle', 'poursuite']:
    bad = [sd for sd in range(1100, 1120) if not sim.World(sc, sd).feasible()]
    check(f'{sc} : chemin libre dans les 20 mondes testés', not bad, str(bad) if bad else '')

print('11. Fichiers de résultats')
for f in sorted(glob.glob('*.csv')):
    if f.startswith('js_') or '_avant_correctif' in f: continue   # archives d'essais interrompus
    R = list(csv.DictReader(open(f)))
    if not R or 'planner' not in R[0]: continue
    cnt = {}
    for r in R: cnt[r['planner']] = cnt.get(r['planner'], 0) + 1
    keys = {}
    for r in R: keys.setdefault(r['planner'], set()).add((r.get('scene'), r.get('seed'), r.get('cond', '')))
    same = len(set(map(frozenset, keys.values()))) == 1
    dup = any(len(k) != cnt[p] for p, k in keys.items())
    check(f'{f} : chaque méthode a joué exactement les mêmes mondes, sans doublon', same and not dup, f'{len(R)} lignes')

print('12. Séparation développement / évaluation')
plages = {'final_v2.csv': (600, 620), 'final_v3.csv': (900, 940), 'final_etape3.csv': (3000, 3060),
          'final_seance7.csv': (5000, 5100)}   # réservées avant tout essai (PLAN_SEANCE7.md)
# tout autre fichier de résultats compte comme développement (réglages, diagnostics, ablations)
dev = [f for f in glob.glob('*.csv') if f not in plages and not f.startswith('js_') and not f.startswith('ablation')]
dev_seeds = set()
for f in dev:
    if os.path.exists(f): dev_seeds |= {int(r['seed']) for r in csv.DictReader(open(f))}
for f, (a, b) in plages.items():
    check(f'graines d\'évaluation de {f} jamais utilisées en développement', not (dev_seeds & set(range(a, b))))


print('13. Prédicteur de Smith : avec un modèle exact, il retrouve l\'état présent')
class BaseEspion:
    def reset(self, st, g): pass
    def act(self, t, s, o): self.est.append(np.array(s)); return (1.2, 0.6 * np.sin(t))
class SmithTest(P.SmithMixin, BaseEspion): pass
st = SmithTest(); st.est = []
w = sim.World('foret', 1); w.static = np.zeros((0, 3)); w.dyn = []
r = sim.run_episode(w, st, perturb=False, cond=dict(lat=2), record=True)
path = r['path']
err = max(np.hypot(*(st.est[k][:2] - path[k])) for k in range(5, min(len(st.est), len(path) - 1)))
check('état présent estimé malgré 200 ms de retard (écart < 2 cm)', err < 0.02, f'{err * 100:.2f} cm')

print('14. Latence communiquée aux planificateurs')
class Lat:
    def reset(self, st, g): pass
    def set_latency(self, L): self.L = L
    def act(self, t, s, o): return (0.0, 0.0)
for cond, attendu in [('nominal', 0), ('latence', 2)]:
    l = Lat(); sim.T_MAX, old = 1.0, sim.T_MAX
    sim.run_episode(sim.World('foret', 1), l, cond=cond); sim.T_MAX = old
    check(f'{cond} : retard annoncé = {attendu} pas', l.L == attendu, str(l.L))
    os.environ['REEL'] = '1'; l = Lat(); sim.T_MAX = 1.0
    sim.run_episode(sim.World('foret', 1), l, cond=cond); sim.T_MAX = old; del os.environ['REEL']
    check(f'{cond} + robot réaliste : retard annoncé = {attendu + 1} pas', l.L == attendu + 1, str(l.L))

print('15. Commandes finies')
for C in [P.MPPI, P.MultiModalMPPI, P.MMSmith, P.VigieV2, P.Vigie3, P.Vigie3M]:
    m = P.Memory(C); w = sim.World('foule_dense', 3); m.reset(w.static, w.goal)
    try: m.set_latency(0)
    except AttributeError: pass
    u = m.act(0.0, w.start, w.obstacles())
    check(f'{C.name} renvoie une commande finie', np.all(np.isfinite(np.asarray(u, float))), str(np.round(np.asarray(u, float), 2)))

print('15 bis. Épisodes courts de chaque candidat, robot réaliste + perception limitée + latence')
os.environ['REEL'] = '1'; old = sim.T_MAX; sim.T_MAX = 4.0
for C in [P.MPPI, P.MultiModalMPPI, P.MMSmith, P.VigieV2, P.Vigie2C, P.Vigie3, P.Vigie3M, P.VigieQuatre, P.Vigie3W, P.VigieQuatreW]:
    try:
        r = sim.run_episode(sim.World('coin_aveugle', 1201), P.Memory(C), cond=dict(range=5.0, occl=True, drop=0.1, lat=2))
        check(f'{C.name} : épisode sans erreur', np.isfinite(r['longueur']), f"{r['outcome']}, {r['temps']:.1f} s")
    except Exception as e:
        check(f'{C.name} : épisode sans erreur', False, repr(e)[:120])
sim.T_MAX = old

print('15 ter. Chaque brique s\'exécute réellement pendant un épisode')
sim.T_MAX = 6.0
for C in [P.VigieV2, P.MMSmith, P.Vigie3, P.Vigie3M, P.VigieQuatre, P.Vigie2C, P.Vigie3W, P.VigieQuatreW]:
    m = P.Memory(C); sim.run_episode(sim.World('coin_aveugle', 1201), m, cond=dict(range=5.0, occl=True, drop=0.1, lat=2))
    p = m.p; vu = []
    if isinstance(p, P.SmithMixin): vu.append(('prédicteur de Smith (retard 3 pas)', p.lat == 3))
    if isinstance(p, P.PhantomMixin): vu.append(('vitesse prudente aux angles morts activée', p.occl))
    if isinstance(p, P.WheelModelMixin): vu.append(('modèle par roue identifié (identification exécutée)', hasattr(p, 'wm_d') and len(p.wm_cmd) > 30))
    if isinstance(p, P.InternalModelMixin): vu.append(('modèle interne identifié', hasattr(p, 'im_hist') and len(p.im_hist) > 25 and tuple(p.im_par) != (0.1, 0.1, 2.0, 4.0)))
    if isinstance(p, (P.TubeMixin, P.Vigie4Core)): vu.append(('mesure d\'imprévisibilité tenue à jour', hasattr(p, 'tr') and len(p.tr.h) > 0))
    if isinstance(p, P.Vigie4Core): vu.append(('routes horodatées créées', any(mm.get('st') for mm in p.modes)))
    for nom, ok in vu: check(f'{C.name} : {nom}', ok)
sim.T_MAX = old; del os.environ['REEL']

print('16. Calcul statistique apparié')
d = np.array([1] * 30 + [-1] * 10 + [0] * 60, float)
rng = np.random.default_rng(0); bs = [rng.choice(d, len(d)).mean() for _ in range(4000)]
lo, hi = np.percentile(bs, [2.5, 97.5])
check('écart moyen +20 points, intervalle cohérent', abs(d.mean() - 0.2) < 1e-12 and 0.08 < lo < 0.2 < hi < 0.33, f'[{lo:.3f} ; {hi:.3f}]')

print('17. Oracle face aux agents qui réagissent au robot')
w = sim.World('poursuite', 1101); orc = P.OracleMPPI(); orc.reset(w.static, w.goal); orc.bind(w); w.t = 0.0
orc.U = np.zeros((orc.T, 2))                       # plan : rester sur place
s0 = np.array([1.5, 10.0, 0.0])
Pf = orc.future(w.obstacles(), s0); wt = copy.deepcopy(w); err = 0
for k in range(orc.T):
    wt.step_obstacles(k * 0.1, robot=s0[:2]); err = max(err, np.abs(wt.true_obstacles()[:, :2] - Pf[k]).max())
check('oracle exact face aux poursuivants quand le robot suit son plan', err < 1e-9, f'écart {err:.2e} m')

print('18. Profil de vitesse espace-temps : respect des limites et des prédictions')
for sd in (1203, 1204, 1205):
    w = sim.World('traversee', sd); obs = w.obstacles()
    gt = P.speed_profile(np.array([[1.5, 10.0], [18.5, 10.0]]), obs, np.full(len(obs), 0.02), acc=1.2, dec=1.6)
    v = np.hypot(*np.diff(np.vstack([[1.5, 10], gt]), axis=0).T) / 0.1; a = np.diff(v) / 0.1
    A = obs[obs[:, 5] > 0]
    mind = min((np.hypot(A[:, 0] + A[:, 2] * (k + 1) * 0.1 - gt[k, 0], A[:, 1] + A[:, 3] * (k + 1) * 0.1 - gt[k, 1]) - A[:, 4] - 0.3).min() for k in range(len(gt)))
    check(f'monde {sd} : v ≤ 1,5 ; accélération ≤ 1,2 ; freinage ≤ 1,6 ; aucun conflit prédit',
          v.max() <= 1.5 + 1e-6 and a.max() <= 1.2 + 1e-6 and a.min() >= -1.6 - 1e-6 and mind > 0, f'v {v.max():.2f}, a {a.max():.2f}/{a.min():.2f}, marge {mind:.2f}')
arc = np.array([[5 + 2 * np.cos(t), 5 + 2 * np.sin(t)] for t in np.linspace(0, np.pi, 60)])
gt = P.speed_profile(arc, np.zeros((0, 7)), None, acc=1.2, dec=1.6, a_lat=1.0)
v = np.hypot(*np.diff(gt, axis=0).T) / 0.1
check('dans un virage de 2 m de rayon, vitesse ≤ √(a·R) ≈ 1,41 m/s', v.max() <= 1.45, f'{v.max():.2f} m/s')

print('19. Modèle interne par roue : vitesse présente estimée malgré le retard')
import robot_reel as RR2
os.environ['REEL'] = '1'
class _Base:
    def reset(self, st, g): pass
    def set_latency(self, L): self.lat = L
    def act(self, t, s, o):
        k = int(round(t * 10)); r = np.random.default_rng(k // 9); return (float(r.uniform(0.2, 1.5)), float(r.uniform(-1.8, 1.8)))
class _E(P.WheelModelMixin, _Base): pass
for lat in (0, 2):
    w = sim.World('foret', 1); w.static = np.zeros((0, 3)); w.dyn = []; w.goal = np.array([-50., -50.]); w.start = np.array([10., 10., 0.])
    e = _E(); old = sim.T_MAX; sim.T_MAX = 12; tv = []; orig = RR2.RealRobot.step
    def _st(self, v, w_, dt=0.1, tv=tv):
        p = orig(self, v, w_, dt); tv.append((self.v, self.w)); return p
    RR2.RealRobot.step = _st; est = []; oa = _E.act
    def _act(self, t, s, o, est=est):
        u = oa(self, t, s, o); vl, vr = self.wm_now; est.append(((vl + vr) / 2, (vr - vl) / P.WB)); return u
    _E.act = _act
    sim.run_episode(w, e, cond=dict(lat=lat)); RR2.RealRobot.step = orig; _E.act = oa; sim.T_MAX = old
    E_ = np.array(est[30:-1]); T_ = np.array(tv[29:29 + len(E_)])
    rms = np.sqrt(((E_ - T_) ** 2).mean(0))
    check(f'retard {lat + 1} pas : erreur vitesse < 0,09 m/s et rotation < 0,25 rad/s', rms[0] < 0.09 and rms[1] < 0.25, f'{rms.round(3)} ; paramètres {e.wm_par}')
del os.environ['REEL']

print('20. Routes horodatées : pas de décalage d\'horaire au cycle de création')
for C in (P.Vigie3, P.VigieQuatre):
    m = C(); w = sim.World('traversee', 1203); m.reset(w.static, w.goal)
    try: m.set_latency(0)
    except AttributeError: pass
    vu = {}
    orig_cost = C.sample_cost_t
    def spy(self, s, U, obs, gt, vu=vu):
        vu.setdefault('premier', gt[0].copy()); return orig_cost(self, s, U, obs, gt)
    C.sample_cost_t = spy
    m.act(0.0, w.start, w.obstacles())
    C.sample_cost_t = orig_cost
    st_modes = [mm for mm in m.modes if mm.get('st')]
    if st_modes and 'premier' in vu:
        # au cycle de création, le premier point utilisé doit être la position prévue à t + 0,1 s
        d = np.hypot(*(vu['premier'] - w.start[:2]))
        check(f'{C.name} : premier point de la route = position à +0,1 s (≤ 0,16 m du départ)', d <= 0.16, f'{d:.3f} m')
    else:
        check(f'{C.name} : route horodatée créée au premier cycle', False)

print('21. Scène de la porte : personne ne surgit à côté du robot')
w = sim.World('goulot', 1302); bad = 0; rob = np.array([18.0, w.door[1]])
for k in range(600):
    before = {id(o): o['p'].copy() for o in w.dyn}
    w.step_obstacles(k * 0.1, robot=rob)
    for o in w.dyn:
        jump = np.hypot(*(o['p'] - before[id(o)]))
        if jump > 1.0 and o['p'][0] > 0 and np.hypot(*(o['p'] - rob)) < 3.0: bad += 1
check('aucune réapparition à moins de 3 m du robot (robot posté près de l\'entrée, 60 s)', bad == 0, f'{bad} réapparitions')
w2 = sim.World('goulot', 1302); n_in = 0
for k in range(600):
    w2.step_obstacles(k * 0.1, robot=np.array([2.0, 2.0]))
n_active = sum(1 for o in w2.dyn if o['p'][0] > 0)
check('robot loin : le flux continue normalement', n_active >= len(w2.dyn) - 2, f'{n_active}/{len(w2.dyn)} actifs')

print('22. Aucune scène ne fait surgir d\'agent à côté du robot')
for sc in ['foret', 'carrefour', 'couloir', 'piege', 'foule', 'foule_dense', 'carrefour_rapide', 'traversee', 'goulot', 'coin_aveugle', 'poursuite']:
    bad = 0
    for rob in (np.array([1.5, 10.0]), np.array([10.0, 10.0]), np.array([18.5, 10.0])):
        w = sim.World(sc, 1311)
        for k in range(450):
            before = [o['p'].copy() for o in w.dyn]
            w.step_obstacles(k * 0.1, robot=rob)
            for o, b0 in zip(w.dyn, before):
                if np.hypot(*(o['p'] - b0)) > 1.0 and 0 < o['p'][0] < 20 and np.hypot(*(o['p'] - rob)) < 3.0: bad += 1
    check(f'{sc} : aucun saut de plus de 1 m à moins de 3 m du robot', bad == 0, f'{bad}')

print('23. Passage bouché : les routes horodatées ne s\'empilent pas')
import planners as _pl
_dg = _pl.diverse_guides
for C in [_pl.MMST, _pl.Vigie3, _pl.Vigie3W, _pl.VigieQuatre, _pl.VigieQuatreW]:
    w = sim.World('foule', 1302); p = C(); p.reset(w.static, w.goal)
    s0 = w.start.copy(); obs = w.obstacles()
    p.act(0.0, s0, obs); n0 = len(p.modes)
    _pl.diverse_guides = lambda *a, **k: []          # plus aucune route trouvée
    try:
        sizes = []
        for _ in range(8): p.refresh_modes(s0, obs); sizes.append(len(p.modes))
    finally:
        _pl.diverse_guides = _dg
    check(f'{C.name} : nombre de routes borné ({n0} au départ)', n0 >= 2 and max(sizes) <= n0, str(sizes))

print('24. Suivi des personnes (Kalman + gestion des pistes)')
import robot_reel as _rr
def _o(x, y, i=1000): return np.array([[x, y, 0, 0, 0.35, 1, i]], float)
g = np.random.default_rng(3)
def _err(T, seed=3):
    g = np.random.default_rng(seed); tr = T(); e = []
    for k in range(200):
        out = tr(_o(2 + 2.0 * 0.1 * k + g.normal(0, 0.05), 5 + g.normal(0, 0.05)))
        if k >= 10: e.append(np.hypot(out[0, 2] - 2.0, out[0, 3]))
    return np.mean(e)
ek, ea = _err(_rr.TrackerKF), _err(_rr.Tracker)
check('vitesse constante (2 m/s, bruit 5 cm) : moins d\'erreur que l\'ancien filtre et < 0,2 m/s', ek < ea and ek < 0.2, f'{ek:.3f} contre {ea:.3f} m/s')
tr = _rr.TrackerKF(); vmax = 0
for k in range(40):
    obs = _o(2 + 0.2 * k, 5) if k % 5 else np.zeros((0, 7))      # une détection sur cinq manquée
    out = tr(obs, 0.1)
    if k > 10 and len(out): vmax = max(vmax, abs(out[0, 2] - 2.0))
check('détections manquées : pas de pic de vitesse (écart < 0,3 m/s)', vmax < 0.3, f'{vmax:.2f} m/s')
tr = _rr.TrackerKF()
for k in range(20): tr(_o(2 + 0.2 * k, 5))
for k in range(20): tr(np.zeros((0, 7)))                          # masquée 2 s
out = tr(_o(2 + 0.2 * 40, 5))
check('réapparition après 2 s de masquage : vitesse plausible (< 2,5 m/s)', np.hypot(*out[0, 2:4]) < 2.5, f'{np.hypot(*out[0, 2:4]):.2f} m/s')
tr = _rr.TrackerKF()
for k in range(20): tr(_o(10, 19.0 + 0.1 * k))
out = tr(_o(10, -0.4))                                            # sort par le haut, revient par le bas
check('saut impossible (sortie d\'arène) : piste relancée, pas de vitesse aberrante', np.hypot(*out[0, 2:4]) < 2.5, f'{np.hypot(*out[0, 2:4]):.2f} m/s')
tr = _rr.TrackerKF(); tr(_o(5, 5))
for k in range(12): tr(np.zeros((0, 7)))
check('piste non revue depuis plus de 1 s : effacée', 1000 not in tr.s)

print('25. Le filtre de suivi de l\'application (JavaScript) est identique à celui du banc')
import json as _json, subprocess as _sp, shutil as _sh
if _sh.which('node'):
    g = np.random.default_rng(5); seq = []
    for k in range(120):
        rows = []
        if k % 7: rows.append([2 + 0.2 * k + g.normal(0, 0.05), 5 + g.normal(0, 0.05), 0, 0, 0.35, 1, 1000])
        if 30 < k < 60 or k > 80: rows.append([15 - 0.15 * k + g.normal(0, 0.05), 3 + 0.05 * k, 0, 0, 0.35, 1, 1001])
        if k == 100: rows.append([10, 10, 0, 0, 0.35, 1, 1000])
        seq.append(rows)
    tr = _rr.TrackerKF(); py = [tr(np.array(r, float).reshape(-1, 7)).tolist() for r in seq]
    js = _json.loads(_sp.check_output(['node', '-e', "import('../../js/sims/vigie-core.js').then(m=>{let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const tr=m.makeTracker();console.log(JSON.stringify(JSON.parse(s).map(r=>tr(r))))})})"], input=_json.dumps(seq).encode()))
    d = max(abs(a - b) for P, J in zip(py, js) for ra, rb in zip(P, J) for a, b in zip(ra, rb))
    check('mêmes sorties à 1e-9 près (détections manquées et sauts compris)', d < 1e-9 and sum(map(len, py)) == sum(map(len, js)), f'écart {d:.1e}')
else:
    check('node disponible pour comparer avec l\'application', False)

print('26. Références de l\'état de l\'art (T-MPC++, DRA-MPPI)')
import references as _R
_b = np.linspace(0.05, 6, 120)
check('probabilité de collision : formule exacte pour un obstacle centré (1 - exp(-b²/2))',
      np.abs(_R.collision_prob(np.zeros_like(_b), _b, 1.0) - (1 - np.exp(-_b ** 2 / 2))).max() < 1e-4)
_g = np.random.default_rng(11); _X = _g.normal(size=(1_000_000, 2)); _e = []
for _a, _bb in [(0.5, 0.6), (2, 1), (3, 2.5), (1, 3), (8, 7), (0.3, 0.15)]:
    _e.append(abs(_R.collision_prob(np.array(_a), np.array(_bb), 1.0) - np.mean(np.hypot(_X[:, 0] - _a, _X[:, 1]) <= _bb)))
check('probabilité de collision : accord avec un tirage de Monte-Carlo (10⁶ points)', max(_e) < 0.002, f'écart max {max(_e):.4f}')
check('probabilité de collision : invariante par changement d\'échelle',
      abs(_R.collision_prob(np.array(0.6), np.array(0.65), 0.1) - _R.collision_prob(np.array(6.0), np.array(6.5), 1.0)) < 1e-6)
_tt = np.linspace(0, 1, 41)
def _path(pts):
    pts = np.array(pts, float); u = np.linspace(0, 1, len(pts))
    return np.stack([np.interp(_tt, u, pts[:, 0]), np.interp(_tt, u, pts[:, 1])], -1)
_ob = np.array([[5, 5, 0, 0, 0.4, 0]])
check('homotopie : gauche et droite d\'un obstacle sont deux classes', not _R.same_class(_path([(3, 5), (5, 6.5), (7, 5)]), _path([(3, 5), (5, 3.5), (7, 5)]), _ob, _tt))
check('homotopie : deux passages du même côté sont une seule classe', _R.same_class(_path([(3, 5), (5, 6.5), (7, 5)]), _path([(3, 5), (5, 7.5), (7, 6)]), _ob, _tt))
_mob = np.array([[5, 2, 0, 4, 0.3, 1]])
_late = np.stack([np.where(_tt < 0.8, 3 + 0 * _tt, 3 + (_tt - 0.8) / 0.2 * 4), 5 + 0 * _tt], -1)
check('homotopie : passer devant ou après une personne qui traverse sont deux classes', not _R.same_class(_path([(3, 5), (7, 5)]), _late, _mob, _tt))
_D = P.dijkstra(P.occupancy([], 0.4), np.array([18., 10.]))
_gp = _R.GuidancePlanner(2.5, np.random.default_rng(1))
_out = _gp.plan(np.array([4.5, 10., 0.]), np.array([[8.0, 10.0, -1.0, 0, 0.35, 1]]), _D)
_side = sorted(np.sign(o[-1, 1] - 10) for o in _out)
check('guidage : une personne de face donne deux routes, une de chaque côté', len(_out) == 2 and _side == [-1, 1], str([np.round(o[-1], 1) for o in _out]))
_ok = True
for o in _out:
    _sp = np.hypot(*np.diff(np.vstack([[4.5, 10.], o]), axis=0).T) / sim.DT
    _ok &= bool(_sp.max() <= sim.VMAX + 1e-6)
check('guidage : routes faisables en vitesse', _ok)
_t = _R.TMPC(); _t.reset(np.zeros((0, 3)), np.array([18., 10.]))
_g2 = np.stack([np.linspace(5, 8, _t.T), np.full(_t.T, 11.0)], -1)      # guide au-dessus de la personne
_U_up = np.tile([1.2, 0.0], (_t.T, 1)); _s0 = np.array([5., 11., 0.])
_U_dn = _U_up.copy(); _U_dn[:6, 1] = -1.5
_pen = _t.h_penalty(_s0, np.stack([_U_up, _U_dn]), _g2, np.array([[8.0, 10.0, -1.0, 0, 0.35, 1]]))
check('contrainte d\'homotopie : nulle si l\'on reste du côté du guide, forte sinon', _pen[0] == 0 and _pen[1] > 500, str(np.round(_pen)))
_d = _R.DRAMPPI(); _d.reset(np.zeros((0, 3)), np.array([18., 10.]))
_ob2 = np.array([[7.0, 10.0, 0, 0, 0.35, 1]])
_c, _pj = _d.risk(_R.rollout(np.array([5., 10., 0.]), np.stack([np.tile([1.0, 0.], (_d.T, 1)), np.tile([1.0, 1.2], (_d.T, 1))])), _ob2)
check('DRA-MPPI : foncer sur une personne est plus risqué que l\'éviter', _c[0] > _c[1] and _pj[0].max() > 0.9 and _pj[1].max() < 0.5, f'{np.round(_c)}')

print('27. VIGIE 3 + risque calibré')
import vigie_risque as _VR
_v = _VR.Vigie3R(); _v.reset(np.zeros((0, 3)), np.array([18., 10.]))
_dr = _R.DRAMPPI(); _dr.reset(np.zeros((0, 3)), np.array([18., 10.])); _dr.W_SOFT = _dr.W_HARD = 3000.0
_ob3 = np.array([[7.0, 10.0, -0.5, 0.2, 0.35, 1, 7], [9.0, 12.0, 0.0, -1.0, 0.3, 1, 8], [6.0, 7.0, 0, 0, 0.5, 0, -1]])
_Us = np.stack([np.tile([1.0, w], (_v.T, 1)) for w in (-0.8, 0.0, 0.8)])
_tr3 = _R.rollout(np.array([5., 10., 0.]), _Us)
check('risque : identique à DRA-MPPI (mêmes poids) sans adaptation', np.allclose(_v.risk(_tr3, _ob3), _dr.risk(_tr3, _ob3)[0]))
_full = _v.eval_cost(np.array([5., 10., 0.]), _Us, _ob3)
_st = _ob3[_ob3[:, 5] == 0]
_ref = P.MPPI.eval_cost(_v, np.array([5., 10., 0.]), _Us, _st) + _v.risk(_tr3, _ob3)
check('coût : obstacles fixes et navigation inchangés, personnes par le risque', np.allclose(_full, _ref))
_g = np.stack([np.linspace(5, 12, 20), np.full(20, 10.0)], -1)
_dg = _v.eval_cost(np.array([5., 10., 0.]), _Us, _ob3, guide=_g) - _full
check('coût : le suivi de route est conservé', _dg[1] < _dg[0] and _dg[1] < _dg[2] and _dg.min() >= 0)
_va = _VR.Vigie3RA(); _va.reset(np.zeros((0, 3)), np.array([18., 10.])); _va.tr = P.SurpriseTracker()
_va.tr.e = {7: 0.02, 8: 0.9}
_vr = _va.var_rates(_ob3[_ob3[:, 5] > 0])
check('adaptatif : plancher publié respecté, personne imprévisible plus incertaine',
      abs(_vr[0] - _va.VAR_RATE) < 1e-12 and abs(_vr[1] - (0.9 / np.sqrt(np.pi / 2)) ** 2) < 1e-12, str(_vr))
_rng = np.random.default_rng(5); _sg = 0.4
_e = np.hypot(*(_rng.normal(0, _sg, (2, 200000))))
check('adaptatif : écart moyen gaussien 2D = s·sqrt(pi/2) (Rayleigh)', abs(_e.mean() / np.sqrt(np.pi / 2) - _sg) < 0.005, f'{_e.mean() / np.sqrt(np.pi / 2):.4f}')
_va.tr.e = {}
check('adaptatif : sans historique, identique à la version fixe', np.allclose(_va.risk(_tr3, _ob3), _v.risk(_tr3, _ob3)))

_F = _VR.DIAG_FANTOMES[1]; _f = _F(); _f.reset(np.zeros((0, 3)), np.array([18., 10.]))
_wall = np.array([[9.8, 11.0 + 0.8 * k, 0, 0, 0.45, 0, -1] for k in range(8)])   # coin masqué en haut à droite
_s5 = np.array([8.6, 10.0, 0.0])
check('fantômes : ignorés en vision complète', len(_f.phantom_rows(_s5, _wall)) == 0)
_f.set_perception(True, 5.0)
_ph = _f.phantom_rows(_s5, _wall)
_trf = _R.rollout(_s5, np.tile([1.0, 0.0], (_f.T, 1))[None])
check('fantômes : présents derrière des bords masquants en perception limitée', len(_ph) > 0, str(len(_ph)))
check('fantômes : un risque non nul en passant près d\'un bord masquant', _f.risk(_trf, _wall, _s5)[0] > 0)
_hard = _F(); _hard.reset(np.zeros((0, 3)), np.array([18., 10.])); _hard.set_perception(True, 5.0); _hard.W_SOFT = 0.0
_gx, _gy = np.meshgrid(np.linspace(8.0, 13.0, 41), np.linspace(8.0, 13.0, 41))
_pts = np.stack([_gx.ravel(), _gy.ravel(), np.zeros(_gx.size)], -1)
_trg = np.repeat(_pts[:, None, :], _hard.T, 1)           # robot immobile en chaque point, à chaque instant de l'horizon
_hard._ph_key = None; _hard.phantom_rows(_s5, _wall)
check('fantômes : une zone seule ne déclenche jamais le seuil dur (grille dense, tous instants)',
      _F.P_EXIST < _VR.P_MAX_FANTOME and _hard.risk(_trg, _wall, _s5).max() == 0, f'p={_F.P_EXIST}, max={_hard.risk(_trg, _wall, _s5).max()}')
_bad = _VR.DIAG_FANTOMES[1]; _hb = type('X', (_bad,), dict(P_EXIST=0.04))(); _hb.reset(np.zeros((0, 3)), np.array([18., 10.])); _hb.set_perception(True, 5.0); _hb.W_SOFT = 0.0
check('fantômes : la borne est atteinte (p = 0,04 la dépasse, la vérification n\'est pas vide)', _hb.risk(_trg, _wall, _s5).max() > 0)
_trs = _R.rollout(_s5, np.zeros((_f.T, 2))[None])
_rk = _f.risk(np.concatenate([_trf, _trs]), _wall, _s5)
check('fantômes : traverser la sortie du coin coûte plus que rester en retrait', _rk[0] > _rk[1], str(np.round(_rk)))
_f0 = _VR.Vigie3R(); _f0.reset(np.zeros((0, 3)), np.array([18., 10.])); _f0.set_perception(True, 5.0)
check('fantômes : sans probabilité d\'existence, risque identique à la version de base', np.allclose(_f0.risk(_tr3, _ob3, np.array([5., 10., 0.])), _v.risk(_tr3, _ob3)))
check('sans plafond : le plafond de vitesse est bien retiré de la chaîne', _VR.SansPlafondMixin.act.__qualname__.startswith('SansPlafondMixin') and P.PhantomMixin in _VR.DIAG_FANTOMES[3].__mro__)

print('28. Cohérence de route (T-MPC, éq. 12) pour VIGIE')
_c = _VR.Vigie3C(); _c.reset(np.zeros((0, 3)), np.array([18., 10.]))
_obc = np.array([[10.0, 10.0, 0, 0, 0.8, 0, -1]])
_s6 = np.array([6.0, 10.0, 0.0])
_gl = np.array([[6, 10], [8, 10], [10, 11.6], [12, 10], [18, 10]], float)     # route guide par la gauche
_gr = np.array([[6, 10], [8, 10], [10, 8.4], [12, 10], [18, 10]], float)      # par la droite
_gl2 = np.array([[6, 10], [8, 10.5], [10, 12.5], [13, 11], [18, 10]], float)  # autre tracé, même côté que _gl
_z = np.zeros(60)
check('classe de route : gauche et droite différentes, deux tracés à gauche identiques',
      not _R.same_class(_VR._route_ahead(_gl, _s6), _VR._route_ahead(_gr, _s6), _obc, _z) and _R.same_class(_VR._route_ahead(_gl, _s6), _VR._route_ahead(_gl2, _s6), _obc, _z))
_rk = _VR._route_ahead(np.array([[0, 0], [3, 0], [3, 4]], float), np.array([0., 0.]), 8)
check('route restante : rééchantillonnage à pas constant', np.allclose(np.hypot(*np.diff(_rk, axis=0).T), 1.0))
_U2 = np.stack([np.tile([1.0, 0.0], (_c.T, 1))] * 2)
_c.modes = [dict(g=_gl, U=_U2[0]), dict(g=_gr, U=_U2[1])]
_cst = lambda s, U, o: np.array([100.0, 95.0]) + _c.ideal_cost(s)        # coûts imposés, la droite un peu meilleure
_c.eval_cost = _cst
_c.prev_g = _gl.copy()
check('cohérence : à coûts proches (100 contre 95), on garde la classe suivie', _c.select(_s6, _U2, _obc) == 0)
_c.eval_cost = lambda s, U, o: np.array([100.0, 70.0]) + _c.ideal_cost(s)
_sw0 = _c.switches; _c.prev_g = _gl.copy()
check('cohérence : on change si l\'autre est nettement meilleure (100 contre 70 < 75), et on le compte', _c.select(_s6, _U2, _obc) == 1 and _c.switches == _sw0 + 1)
_c.prev_g = None; _c.eval_cost = _cst
check('cohérence : sans historique, coût minimal pur', _c.select(_s6, _U2, _obc) == 1)

_wf = sim.World('foret', 1412); _obf = np.array([[x, y, 0, 0, r, 0, -1] for x, y, r in _wf.static])
_sf = np.array([9.8, 13.4, 0.3]); _Df = P.dijkstra(P.occupancy([tuple(c) for c in _wf.static], sim.R_ROB + 0.1), _wf.goal)
_g3 = P.spacetime_plan2(_sf, _wf.goal, _obf, _Df); _g1 = P.spacetime_plan2(_sf, _wf.goal, _obf, _Df, margin_static=_VR.CarteCommuneMixin.MARGE_FIXE)
check('carte commune : le passage de 0,98 m (forêt 1412) est fermé pour la route espace-temps avec 0,3 m, ouvert avec la marge des routes topologiques',
      _g3[9, 0] - _sf[0] < 0.3 and _g1[9, 0] - _sf[0] > 1.0, f'avance en 3 s : {_g3[9, 0] - _sf[0]:.2f} m contre {_g1[9, 0] - _sf[0]:.2f} m')
check('carte commune : marge des personnes inchangée (0,3 m) et VIGIE 3 inchangé', _VR.CarteCommuneMixin.MARGE_FIXE == 0.1 and P.spacetime_plan2.__defaults__[1] == 0.3 and 'refresh_modes' not in P.Vigie3.__dict__)

print('29. VIGIE 6 : planificateur libre parmi les options')
_v6 = _VR.Vigie6(); _v6.reset(np.zeros((0, 3)), np.array([18., 10.]))
_obp = np.array([[8.0, 10.0, -1.0, 0.0, 0.35, 1, 5]])                    # une personne vient de face
_s7 = np.array([5.0, 10.0, 0.0])
_Ug = np.tile([1.2, 0.0], (_v6.T, 1))                                     # route guidée : tout droit sur elle
_v6.modes = [dict(g=np.array([[5, 10], [18, 10]], float), U=_Ug.copy())]
for _ in range(15): _ex = _v6.extra_candidates(_s7, _obp)                   # 1,5 s d'optimisation, reprise d'un cycle à l'autre comme en marche
_v6._cands = _v6.modes + _ex
_Jg, _Jf = _v6.eval_cost(_s7, np.stack([_Ug, _ex[0]['U']]), _obp)
check('libre : propose une option nettement moins risquée que la route guidée qui fonce', _Jf < 0.5 * _Jg, f'{_Jg:.0f} contre {_Jf:.0f}')
_v6.prev_g = None
check('libre : choisi quand il est meilleur', _v6.select(_s7, np.stack([_Ug, _ex[0]['U']]), _obp) == 1)
check('libre : sa « route » mène au but (cohérence possible)', np.allclose(_ex[0]['g'][-1], [18, 10]) and len(_ex[0]['g']) == _v6.T + 1)
check('libre : 400 tirages pour lui, 128 pour les options guidées', _v6.N == 128 and _VR.FreeModeMixin.N_FREE == 400)

print('30. Suivi : une personne non détectée reste prédite (correction issue de l\'audit indépendant)')
_tk = _rr.TrackerKF()
for _k in range(10): _o7 = _tk(np.array([[2.0 + 0.1 * _k, 5.0, 0, 0, 0.35, 1, 1001]]))   # marche à 1 m/s vers +x
_vit = _o7[0, 2]
_out = [_tk(np.zeros((0, 7))) for _ in range(3)]                                           # 0,3 s sans détection
check('suivi : la personne masquée reste visible du planificateur, prédite à sa vitesse',
      all(len(o) == 1 for o in _out) and abs(_out[-1][0, 0] - (_o7[0, 0] + 0.3 * _vit)) < 1e-9 and _out[-1][0, 6] == 1001 and _out[-1][0, 4] == 0.35,
      f'x = {_out[-1][0, 0]:.3f}, vitesse estimée {_vit:.2f} m/s')
for _ in range(8): _o8 = _tk(np.zeros((0, 7)))
check('suivi : piste effacée après 1 s sans détection', len(_o8) == 0)
_tk0 = _rr.TrackerKF(prolonger=False)
for _k in range(10): _tk0(np.array([[2.0 + 0.1 * _k, 5.0, 0, 0, 0.35, 1, 1001]]))
check('suivi : l\'ancien comportement reste reproductible (TRACKER=sans_prolongation)', len(_tk0(np.zeros((0, 7)))) == 0)
_tk2 = _rr.TrackerKF()
for _k in range(10): _tk2(np.array([[2.0 + 0.1 * _k, 5.0, 0, 0, 0.35, 1, 1001], [8.0, 8.0, 0, 0, 0.5, 0, 3]]))
_o9 = _tk2(np.array([[8.0, 8.0, 0, 0, 0.5, 0, 3]]))
check('suivi : obstacles fixes inchangés, une seule ligne par personne', len(_o9) == 2 and (_o9[:, 6] == 1001).sum() == 1)

print('31. Incertitude du suivi dans le risque')
_tk3 = _rr.TrackerKF(); _tk3(np.array([[5.0, 5.0, 0, 0, 0.35, 1, 1002]]))
_c0 = _tk3.last_cov[1002]
check('covariance : une piste neuve a la variance du capteur en position et une vitesse très incertaine',
      abs(_c0[0] - 0.05 ** 2) < 1e-12 and abs(_c0[2] - 2.0 ** 2) < 1e-12 and _c0[1] == 0)
for _k in range(1, 15): _tk3(np.array([[5.0 + 0.1 * _k, 5.0, 0, 0, 0.35, 1, 1002]]))
check('covariance : la vitesse devient sûre après quelques mesures', _tk3.last_cov[1002][2] < 0.3, f'{_tk3.last_cov[1002][2]:.3f}')
_pv = _tk3.last_cov[1002][0]; _tk3(np.zeros((0, 7))); _tk3(np.zeros((0, 7)))
check('covariance : elle grandit pendant le masquage', _tk3.last_cov[1002][0] > 2 * _pv, f'{_pv:.4f} -> {_tk3.last_cov[1002][0]:.4f}')
_k6 = _VR.Vigie6K(); _k6.reset(np.zeros((0, 3)), np.array([18., 10.])); _k6.lat = 2
_k5 = _VR.Vigie6(); _k5.reset(np.zeros((0, 3)), np.array([18., 10.]))
_obk = np.array([[7.0, 10.0, -0.5, 0.0, 0.35, 1, 1003]])
_cv = {1003: (0.04, 0.05, 0.9)}
_trk = _R.rollout(np.array([5., 10., 0.]), np.stack([np.tile([1.0, w], (_k6.T, 1)) for w in (0.0, 0.6)]))
_k5.set_track_cov(_cv)
check('incertitude du suivi : sans l\'option, le canal ne change rien', np.allclose(_k5.risk(_trk, _obk), _k5.risk(_trk, _obk) * 0 + _VR.Vigie3R.risk(_k5, _trk, _obk)))
_k6.set_track_cov(_cv); _k6.W_HARD = 0.0; _k6.W_SOFT = 1.0; _k6.DISC = 1.0
_tt = np.arange(1, _k6.T + 1) * sim.DT; _tau = _tt + 2 * sim.DT
_s2 = _k6.VAR_RATE * _tt + 0.04 + 2 * _tau * 0.05 + _tau ** 2 * 0.9
_mu = _obk[0, :2] + _obk[0, 2:4] * _tt[:, None]
_pref = np.array([(1 - (1 - _R.collision_prob(np.hypot(*(_trk[i, :, :2] - _mu).T), 0.35 + sim.R_ROB, np.sqrt(_s2)))).sum() for i in range(2)])
check('incertitude du suivi : variance propagée exactement (p + 2τ cov + τ² v, décalage de Smith inclus)', np.allclose(_k6.risk(_trk, _obk), _pref), f'{np.round(_k6.risk(_trk, _obk), 3)} contre {np.round(_pref, 3)}')

print('32. Simulateur 3D : le portage JavaScript de VIGIE 6 et de DRA-MPPI est fidèle au banc (parite_js.py)')
if _sh.which('node'):
    import parite_js as _PJ
    for _n, _ok, _d in _PJ.run(): check(_n, _ok, _d)
else:
    check('node disponible pour vérifier le portage JavaScript', False)

print('33. Imprévisibilité : une personne masquée ne devient pas prévisible faute de mesures (relecture du 23 novembre)')
def _imprev(mesures_seules):
    # marche rectiligne à 1 m/s, masquée à partir de 1,6 s : on suit l'erreur lissée qui fait l'indice
    _tk = RR.TrackerKF(); _st = P.SurpriseTracker(mesures_seules=mesures_seules); _hist = []
    _g = np.random.default_rng(5)
    for _k in range(1, 24):
        _t = 0.1 * _k
        _z = np.array([[3.0 + 1.0 * _t + _g.normal(0, 0.05), 5.0 + _g.normal(0, 0.05), 0, 0, 0.35, 1, 7]]) if _t < 1.55 else np.zeros((0, 7))
        _st.update(_tk(_z), _t); _hist.append(_st.e.get(7))
    return _hist
_h0, _h1 = _imprev(False), _imprev(True)
check('avant la correction : l\'erreur lissée fond pendant le masquage (défaut reproduit)', _h0[22] < 0.5 * _h0[14], f'{_h0[14]:.3f} -> {_h0[22]:.3f}')
check('avec la correction : elle reste figée tant que la personne est masquée', all(_x == _h1[14] for _x in _h1[15:23]), f'{_h1[14]:.3f} -> {_h1[22]:.3f}')
_tk4 = RR.TrackerKF(); _tk4(np.array([[5., 5., 0, 0, .35, 1, 9]])); _o4 = _tk4(np.zeros((0, 7)))
check('la piste prolongée porte le marqueur 2', len(_o4) == 1 and _o4[0, 5] == 2)

print('34. Temps de calcul compté dans la boucle (séance 8)')
_seq = [(0.4 + 0.05 * _k, 0.3 * np.sin(_k)) for _k in range(30)]
_ra = RR.RealRobot(np.array([2., 3., 0.2]), np.random.default_rng(3)); _rb = RR.RealRobot(np.array([2., 3., 0.2]), np.random.default_rng(3), file_commandes=True)
for _u in _seq: _pa = _ra.step(*_u).copy(); _pb = _rb.step(*_u, retard_calcul=0.0).copy()
check('file de commandes sans retard de calcul : même trajectoire qu\'à l\'origine, au bit près', np.array_equal(_pa, _pb) and np.array_equal(_ra.est, _rb.est))
# une commande calculée en 120 ms prend effet 50 + 120 = 170 ms après son envoi : 17 pas internes de 10 ms
_rc = RR.RealRobot(np.array([2., 3., 0.]), np.random.default_rng(3), file_commandes=True)
_rc.step(1.0, 0.0, retard_calcul=0.12); _v1 = _rc.v; _rc.step(None, None); _cur1 = _rc.cur
check('commande calculée en 120 ms : rien ne bouge pendant les 100 premières ms', _v1 == 0.0)
check('elle est appliquée au 17e pas interne (170 ms)', _cur1 == (1.0, 0.0) and len(_rc.file) == 0)


_rd2 = RR.RealRobot(np.array([2., 3., 0.]), np.random.default_rng(3), file_commandes=True)
_rd2.step(1.0, 0.0, retard_calcul=0.0); _rd2.step(None, None)
check('sans retard de calcul, la même commande agit plus tôt (vitesse plus haute après 200 ms)', _rd2.v > (_rc.v - 1e-12))
os.environ['REEL'] = '1'
_e = sim.run_episode(sim.World('carrefour', 6000), P.Memory(P.ALL[54]), cond='tout_calcul')
check('condition « tout_calcul » : épisode complet, cycles sautés comptés', 'cycles_sautes' in _e and _e['cycles_sautes'] >= 0, f"{_e['outcome']}, {_e['cycles_sautes']} cycles sautés")
check('« tout » réunit les sept perturbations', sim.COND['tout'] == sim.COND['enfer'] and sim.COND['tout_calcul'] == dict(sim.COND['enfer'], calc=True))

print('35. Portage C++ : mêmes commandes que le JavaScript sur des épisodes enregistrés (parite_cpp.mjs, cpp/rejeu)')
if _sh.which('node') and _sh.which('g++'):
    import subprocess as _sp, tempfile as _tf, re as _re
    with _tf.TemporaryDirectory() as _td:
        _exe, _rec = os.path.join(_td, 'rejeu'), os.path.join(_td, 'rejeu.txt')
        _c = _sp.run(['g++', '-O2', '-std=c++17', '-Wall', '-Wextra', '-Werror', '-o', _exe, 'cpp/vigie.cpp', 'cpp/rejeu.cpp'], capture_output=True, text=True)
        check('le C++ compile sans avertissement', _c.returncode == 0, _c.stderr[-300:])
        _sp.run(['node', 'parite_cpp.mjs', _rec, '120'], capture_output=True, text=True, check=True)
        _o = _sp.run([_exe, _rec], capture_output=True, text=True).stdout
        _m = _re.search(r'SYNTHESE episodes=(\d+) decisions=(\d+) ecart_max=(\S+)', _o)
        check('10 épisodes rejoués (8 VIGIE 6, 2 DRA-MPPI)', _m is not None and int(_m.group(1)) == 10, _o[-200:])
        check('écart maximal sur la commande sous 1e-9', _m is not None and float(_m.group(3)) < 1e-9, _m.group(3) if _m else '')
else:
    check('node et g++ disponibles pour vérifier le portage C++', False)

print(f'\n{len(OK)} vérifications réussies, {len(KO)} échecs')
if KO: print('ÉCHECS :', KO); sys.exit(1)
