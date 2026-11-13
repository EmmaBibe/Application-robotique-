"""Grappes de cuivre du net de masse (plans, pastilles, vias, pistes), calculées
géométriquement : sert à repérer les pastilles reliées seulement à un fragment
de plan isolé. Usage : python3 grappes.py carte.kicad_pcb
"""
import math
import sys

import pcbnew

b=pcbnew.LoadBoard(sys.argv[1]); mm=pcbnew.ToMM; F=pcbnew.FromMM
par={}
def r(a):
    par.setdefault(a,a)
    while par[a]!=a: par[a]=par[par[a]]; a=par[a]
    return a
def u(a,c): par[r(a)]=r(c)
polys={}
for z in b.Zones():
  if z.GetNetname()!='GND': continue
  for L in (pcbnew.F_Cu,pcbnew.B_Cu):
    if z.IsOnLayer(L): polys[L]=z.GetFilledPolysList(L)
def inside(L,x,y):
    ps=polys[L]; p=pcbnew.VECTOR2I(int(x),int(y))
    for k in range(ps.OutlineCount()):
        if ps.Outline(k).PointInside(p) and not any(ps.Hole(k,h).PointInside(p) for h in range(ps.HoleCount(k))): return k
    return None
pads=[(fp.GetReference()+'.'+p.GetNumber(),p) for fp in b.GetFootprints() for p in fp.Pads() if p.GetNetname()=='GND']
for nom,p in pads:
    r(('pad',nom))
    c=p.GetPosition(); s=max(p.GetSize().x,p.GetSize().y)/2+F(0.55)
    for L in (pcbnew.F_Cu,pcbnew.B_Cu):
        if not p.IsOnLayer(L): continue
        for a in range(16):
            k=inside(L,c.x+s*math.cos(a*math.pi/8),c.y+s*math.sin(a*math.pi/8))
            if k is not None: u(('pad',nom),(L,k))
tr=[t for t in b.GetTracks() if t.GetNetname()=='GND']
for t in tr:
    if t.GetClass()=='PCB_VIA':
        c=t.GetPosition(); r(('v',c.x,c.y))
        for L in polys:
            k=inside(L,c.x,c.y)
            if k is not None: u(('v',c.x,c.y),(L,k))
        for nom,p in pads:
            if p.HitTest(c): u(('v',c.x,c.y),('pad',nom))
for t in tr:
    if t.GetClass()=='PCB_VIA': continue
    id_=('t',id(t),t.GetStart().x,t.GetStart().y); r(id_); L=t.GetLayer()
    for pt in (t.GetStart(),t.GetEnd()):
        k=inside(L,pt.x,pt.y)
        if k is not None: u(id_,(L,k))
        for nom,p in pads:
            if p.IsOnLayer(L) and p.HitTest(pt): u(id_,('pad',nom))
        for v in tr:
            if v.GetClass()=='PCB_VIA' and (v.GetPosition()-pt).EuclideanNorm()<F(0.3): u(id_,('v',v.GetPosition().x,v.GetPosition().y))
    for t2 in tr:
        if t2 is t or t2.GetClass()=='PCB_VIA' or t2.GetLayer()!=L: continue
        for pt in (t2.GetStart(),t2.GetEnd()):
            if t.HitTest(pt, 0): u(id_,('t',id(t2),t2.GetStart().x,t2.GetStart().y))
g={}
for a in list(par): g.setdefault(r(a),[]).append(a)
gs=sorted(g.values(),key=len,reverse=True)
print(len(gs), [len(x) for x in gs[:8]])
for x in gs[1:]:
    for e in x:
        if e[0] == 'pad':
            p = dict(pads)[e[1]]
            ref, num = e[1].split('.')
            print(f"ISOLE {ref}:{num}:{mm(p.GetPosition().x):.4f}:{mm(p.GetPosition().y):.4f}")
for x in gs[1:]:
    for e in x:
        if e[0] == 'v':
            print(f"VIA {mm(e[1]):.4f} {mm(e[2]):.4f}")
