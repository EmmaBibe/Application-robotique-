"""Trajectoires de quelques planificateurs sur un même monde, pour voir les comportements."""
import sys
import numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
import sim, planners

scene, seed = (sys.argv[1], int(sys.argv[2])) if len(sys.argv) > 2 else ('carrefour', 4)
chosen = [planners.AStarPursuit, planners.MPPI, planners.OptionV2, planners.OracleMPPI]
fig, axs = plt.subplots(1, len(chosen), figsize=(4.2 * len(chosen), 4.9))
for ax, P in zip(axs, chosen):
    w = sim.World(scene, seed); w0 = sim.World(scene, seed)
    r = sim.run_episode(w, P(), record=True)
    for x, y, rr in w0.static: ax.add_patch(plt.Circle((x, y), rr, color='#8a8a8a'))
    for o in w0.dyn: ax.add_patch(plt.Circle(o['p'], o['r'], color='#f0a020', alpha=.5))
    for o in w.dyn: ax.add_patch(plt.Circle(o['p'], o['r'], color='#d04010', alpha=.9))
    ax.plot(*r['path'].T, color='#1060c0', lw=2)
    ax.plot(*w0.start[:2], 'go'); ax.plot(*w0.goal, 'r*', ms=12)
    ax.set_xlim(0, 20); ax.set_ylim(0, 20); ax.set_aspect('equal'); ax.set_xticks([]); ax.set_yticks([])
    ax.set_title(f"{P.name}\n{r['outcome']} · {r['temps']:.1f} s", fontsize=9)
plt.tight_layout(); plt.subplots_adjust(top=0.84); plt.savefig(f'trajectoires_{scene}_{seed}.png', dpi=120)
