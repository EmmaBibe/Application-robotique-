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
plages = {'final_v2.csv': (600, 620), 'final_v3.csv': (900, 940)}
dev = ['dev_v1.csv', 'dev_v2.csv', 'dev_v3.csv', 'dev_v4.csv', 'dur_v1.csv', 'dur_v2.csv', 'reel_dev1.csv', 'reel_dev2.csv']
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

print(f'\n{len(OK)} vérifications réussies, {len(KO)} échecs')
if KO: print('ÉCHECS :', KO); sys.exit(1)
