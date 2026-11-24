"""Parité Python / JavaScript des mondes version 2 : mêmes obstacles, mêmes personnes, mêmes pas de temps.
Écrit les états de départ et les trajectoires Python dans un JSON relu par parite_monde2.mjs.
Les comportements qui tirent au hasard (errants, retour par la porte) sont exclus : les deux générateurs diffèrent."""
import json, sys
import numpy as np
from sim import World

cas = []
for scene in ['carrefour', 'carrefour_rapide', 'couloir', 'piege', 'foret', 'poursuite', 'traversee', 'coin_aveugle']:
    for seed in range(9000, 9006):
        w = World(scene, seed, version=2)
        w.dyn = [o for o in w.dyn if o['kind'] in ('intent', 'flux', 'chasseur')]
        depart = dict(static=w.static.tolist(), dyn=[dict(p=o['p'].tolist(), v=o['v'].tolist(), r=o['r'], kind=o['kind'],
                      mode=o.get('mode', 'tout_droit'), tSwitch=float(o.get('t_switch', 1e9)), done=bool(o.get('done', True)),
                      sp=float(o.get('sp', 0.0))) for o in w.dyn])
        robot = np.array([6.0, 10.0]); traj = []
        for i in range(250):
            t = i * 0.1
            w.step_obstacles(t, robot=robot, react=False)
            traj.append([[*o['p'].tolist(), *o['v'].tolist()] for o in w.dyn])
        cas.append(dict(scene=scene, seed=seed, depart=depart, traj=traj))
json.dump(cas, open(sys.argv[1], 'w'))
print(len(cas), 'cas')
