"""Audit de réalisme des mondes : on fait vivre chaque scène 30 s, avec un robot immobile posé sur la ligne
départ-arrivée, et on compte tout ce qu'un observateur trouverait incohérent.
Usage : python3 audit_realisme.py [version] [pietons] [graines]   (ex. 2 sfm 20)"""
import sys
import numpy as np
import sim
from sim import DT, SIZE

SCENES = ['foret', 'carrefour', 'couloir', 'piege', 'foule', 'foule_dense', 'carrefour_rapide', 'traversee', 'goulot', 'coin_aveugle', 'poursuite']


def audit(scene, seed, version, pietons, react=False, pas=300):
    w = sim.World(scene, seed, version=version, pietons=pietons)
    robot = np.array([6.0, 10.0])
    while len(w.static) and np.min(np.hypot(*(w.static[:, :2] - robot).T) - w.static[:, 2]) < 0.6: robot[0] += 0.5
    n = len(w.dyn); R = np.array([o['r'] for o in w.dyn])
    if n == 0: return dict(pp=0, pw=0, tele=0, tele_vu=0, rebond=0, vite=0, robot=0, total=0)
    c = dict(pp=0, pw=0, tele=0, tele_vu=0, rebond=0, vite=0, robot=0, total=0)
    P0 = np.array([o['p'] for o in w.dyn]); V0 = np.array([o.get('vs', o['v']) for o in w.dyn])
    for k in range(pas):
        w.step_obstacles(k * DT, robot=robot, react=react)
        P = np.array([o['p'] for o in w.dyn]); V = np.array([o.get('vs', o['v']) for o in w.dyn])
        dehors = (P[:, 0] < -1) | (P[:, 1] < -1)                     # personnes rangées hors de l'arène
        c['total'] += int((~dehors).sum())
        if n > 1:
            D = np.hypot(*(P[:, None] - P[None]).transpose(2, 0, 1)); np.fill_diagonal(D, 9)
            ov = (D < R[:, None] + R[None] - 0.05) & ~dehors[:, None] & ~dehors[None]
            c['pp'] += int(ov.any(1).sum())
        if len(w.static):
            pen = (w.static[None, :, 2] + R[:, None] - np.hypot(*(P[:, None] - w.static[None, :, :2]).transpose(2, 0, 1))).max(1)
            c['pw'] += int(((pen > 0.05) & ~dehors).sum())
        saut = np.hypot(*(P - P0).T) > 0.6
        c['tele'] += int(saut.sum())
        c['tele_vu'] += int((saut & (np.hypot(*(P - robot).T) < 6.0) & ~dehors).sum())
        bord = (np.minimum(P, SIZE - P).min(1) < R + 0.05) & ~dehors
        demi = (V * V0).sum(1) < -0.5 * np.hypot(*V.T) * np.hypot(*V0.T)
        c['rebond'] += int((bord & demi & ~saut).sum())
        c['vite'] += int(((np.hypot(*V.T) > 2.5) & ~dehors).sum())
        c['robot'] += int(((np.hypot(*(P - robot).T) < R + 0.3 - 0.02) & ~dehors).sum())
        P0, V0 = P, V
    return c


if __name__ == '__main__':
    version = int(sys.argv[1]) if len(sys.argv) > 1 else 2
    pietons = sys.argv[2] if len(sys.argv) > 2 else 'simple'
    N = int(sys.argv[3]) if len(sys.argv) > 3 else 10
    react = len(sys.argv) > 4 and sys.argv[4] == 'react'
    print(f'Mondes version {version}, piétons {pietons}{", réactifs" if react else ""}, {N} graines par scène, 30 s.')
    print('Pourcentage du temps-personne : chevauche une personne | dans un obstacle (>5 cm) | sur le robot immobile ;')
    print('nombre d\'événements : sauts (>0,6 m en 0,1 s), dont à moins de 6 m du robot | demi-tours sur un mur invisible | vitesse > 2,5 m/s')
    tot = None
    for sc in SCENES:
        S = None
        for sd in range(9500, 9500 + N):
            c = audit(sc, sd, version, pietons, react)
            S = c if S is None else {k: S[k] + c[k] for k in S}
        tot = S if tot is None else {k: tot[k] + S[k] for k in tot}
        T = max(S['total'], 1)
        print(f"  {sc:17s} {100 * S['pp'] / T:5.1f} % | {100 * S['pw'] / T:5.2f} % | {100 * S['robot'] / T:5.2f} %   sauts {S['tele']:4d} (vus {S['tele_vu']:3d})  rebonds {S['rebond']:4d}  trop vite {S['vite']:4d}")
    T = tot['total']
    print(f"  {'TOUT':17s} {100 * tot['pp'] / T:5.1f} % | {100 * tot['pw'] / T:5.2f} % | {100 * tot['robot'] / T:5.2f} %   sauts {tot['tele']:4d} (vus {tot['tele_vu']:3d})  rebonds {tot['rebond']:4d}  trop vite {tot['vite']:4d}")
