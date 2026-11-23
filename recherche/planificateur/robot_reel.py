"""Modèle réaliste d'un petit robot à deux roues motrices (environ 25 kg), de la commande à la roue.

Ce que le planificateur ne voit pas, mais que le robot subit :
  - la commande (v, ω) arrive avec 50 ms de retard (calcul + bus) et reste constante jusqu'à la suivante ;
  - elle est convertie en vitesses de roues, saturées : vitesse et virage se partagent la même réserve ;
  - chaque roue a son régulateur PI à 100 Hz, qui lit un codeur incrémental (1 024 points par tour) ;
  - chaque moteur a un couple limité, qui baisse avec la vitesse (force contre-électromotrice)
    et avec la tension de la batterie, plus des frottements secs et visqueux ;
  - le robot a une masse et une inertie : il met du temps à accélérer et à tourner ;
  - la position est estimée par odométrie (qui dérive) recalée par le lidar à 10 Hz ;
  - la vitesse des personnes n'est pas donnée : elle est estimée à partir des positions mesurées.
"""
import numpy as np

R_W, B, M, I_Z = 0.08, 0.45, 25.0, 1.4           # rayon de roue, entraxe, masse, inertie en lacet
TAU_MAX, W_NOLOAD = 2.3, 1.9 / 0.08              # couple max à la roue (N·m), vitesse à vide (rad/s)
C_COUL, C_VISC = 0.12, 0.02                      # frottements secs et visqueux à la roue
VMAX, WMAX = 1.5, 2.0
DT_IN = 0.01                                     # pas interne : 100 Hz
TICKS = 1024


class RealRobot:
    def __init__(self, pose, rng, delay=0.05):
        self.p = np.array(pose, float)            # x, y, θ vrais
        self.v = 0.0; self.w = 0.0
        self.rng = rng; self.delay = delay
        self.cmd = (0.0, 0.0); self.prev = (0.0, 0.0)
        self.integ = np.zeros(2); self.enc_prev = np.zeros(2); self.enc_acc = np.zeros(2)
        self.est = self.p.copy(); self.t = 0.0
        self.KP, self.KI = 1.0, 1.0          # régulateur de roue bien réglé : 90 % en 0,2 s, dépassement < 2 %
        # imperfections propres à ce robot, tirées une fois : rayons de roues légèrement différents, gains moteurs
        self.r_err = 1 + rng.normal(0, 0.01, 2); self.k_mot = 1 + rng.normal(0, 0.05, 2)

    def wheel_targets(self, v, w):
        wl, wr = (v - w * B / 2) / R_W, (v + w * B / 2) / R_W
        lim = VMAX / R_W
        k = max(1.0, abs(wl) / lim, abs(wr) / lim)  # on garde la courbure, on réduit la vitesse
        return np.array([wl, wr]) / k

    def step(self, v_cmd, w_cmd, dt=0.1):
        """Avance de dt secondes. La nouvelle commande ne prend effet qu'après le retard de la chaîne."""
        self.prev, self.cmd = self.cmd, (float(np.clip(v_cmd, 0, VMAX)), float(np.clip(w_cmd, -WMAX, WMAX)))
        n = int(round(dt / DT_IN))
        for k in range(n):
            vc, wc = self.prev if k * DT_IN < self.delay else self.cmd
            ref = self.wheel_targets(vc, wc)
            om = np.array([(self.v - self.w * B / 2) / R_W, (self.v + self.w * B / 2) / R_W])
            # codeur : on ne mesure que des points entiers
            self.enc_acc += om * DT_IN * TICKS / (2 * np.pi)
            ticks = np.floor(self.enc_acc); om_meas = (ticks - self.enc_prev) * 2 * np.pi / TICKS / DT_IN; self.enc_prev = ticks
            # régulateur PI de chaque roue
            e = ref - om_meas
            batt = 1.0 - 0.12 * min(1.0, self.t / 45.0)                       # la batterie faiblit
            tau_av = TAU_MAX * batt * np.clip(1 - np.abs(om) / W_NOLOAD, 0, 1) * self.k_mot
            tau_cmd = self.KP * e + self.KI * self.integ
            tau = np.clip(tau_cmd, -tau_av - 0.3, tau_av)                     # freinage un peu plus fort que la traction
            sat = tau != tau_cmd
            self.integ = np.where(sat & (np.sign(e) == np.sign(tau_cmd)), self.integ, self.integ + e * DT_IN)   # anti-emballement
            tau = tau - C_VISC * om - C_COUL * np.tanh(om / 0.5)
            F = tau / R_W
            a = (F.sum()) / M; alpha = (F[1] - F[0]) * B / 2 / I_Z
            self.v += a * DT_IN; self.w += alpha * DT_IN
            if self.v < 0 and vc >= 0: self.v *= 0.5                           # le robot ne recule pas de lui-même
            # cinématique vraie (petites différences de rayon de roue)
            vr = self.v * (self.r_err.mean()); wr_ = self.w + (self.r_err[1] - self.r_err[0]) * self.v / B
            self.p += DT_IN * np.array([vr * np.cos(self.p[2]), vr * np.sin(self.p[2]), wr_])
            # odométrie du robot (avec ses rayons nominaux, donc elle dérive)
            dl, dr = om_meas * DT_IN * R_W
            vo, wo = (dl + dr) / 2 / DT_IN, (dr - dl) / B / DT_IN
            self.est += DT_IN * np.array([vo * np.cos(self.est[2]), vo * np.sin(self.est[2]), wo])
            self.t += DT_IN
        self.p[2] = np.arctan2(np.sin(self.p[2]), np.cos(self.p[2]))
        # recalage lidar à 10 Hz : on tire l'estimation vers la vraie pose, avec un bruit de mesure
        z = self.p + self.rng.normal(0, [0.03, 0.03, 0.012])
        d = z - self.est; d[2] = np.arctan2(np.sin(d[2]), np.cos(d[2]))
        self.est += 0.35 * d
        self.est[2] = np.arctan2(np.sin(self.est[2]), np.cos(self.est[2]))
        return self.p

    def speeds(self): return self.v, self.w


class Tracker:
    """Estimation de la vitesse des personnes à partir des positions mesurées (filtre alpha-bêta)."""
    def __init__(self): self.s = {}

    def __call__(self, obs, dt=0.1):
        out = obs.copy()
        for k, o in enumerate(obs):
            if o[5] <= 0: continue
            i = int(o[6]); z = o[:2]
            if i not in self.s: self.s[i] = [z.copy(), np.zeros(2)]; out[k, 2:4] = 0; continue
            p, v = self.s[i]; pp = p + v * dt; r = z - pp
            p = pp + 0.6 * r; v = v + 0.3 * r / dt
            self.s[i] = [p, v]; out[k, :2] = p; out[k, 2:4] = v
        return out


class TrackerKF:
    """Suivi des personnes par filtre de Kalman à vitesse constante, avec gestion des pistes :
    prédiction sur le temps réellement écoulé depuis la dernière détection (une détection manquée ne crée pas
    de pic de vitesse), porte de validation (un saut impossible, comme une réapparition après masquage,
    relance la piste au lieu de fausser la vitesse), effacement des pistes non revues depuis 1 s.
    Bruit de mesure : celui du capteur (5 cm). Bruit de modèle : accélérations de piéton (1,5 m/s²)."""
    R_MES, SIG_A, V0_SIG, OUBLI, PORTE = 0.05, 1.5, 2.0, 1.0, 3.5

    def __init__(self, prolonger=True): self.s = {}; self.t = 0.0; self.prolonger = prolonger; self.last_cov = {}

    def __call__(self, obs, dt=0.1):
        self.t += dt; out = obs.copy(); vus = set()
        for k, o in enumerate(obs):
            if o[5] <= 0: continue
            i = int(o[6]); z = o[:2].astype(float); vus.add(i)
            if i in self.s:
                x, P, t0, _ = self.s[i]; d = self.t - t0
                F = np.eye(4); F[0, 2] = F[1, 3] = d
                q = self.SIG_A ** 2; G = np.array([[d * d / 2, 0], [0, d * d / 2], [d, 0], [0, d]])
                x = F @ x; P = F @ P @ F.T + q * G @ G.T
                S = P[:2, :2] + self.R_MES ** 2 * np.eye(2); r = z - x[:2]
                if r @ np.linalg.solve(S, r) > self.PORTE ** 2 and np.hypot(*r) > 0.5:
                    i_new = True
                else:
                    Kg = P[:, :2] @ np.linalg.inv(S); x = x + Kg @ r; P = (np.eye(4) - Kg[:, :2] @ np.eye(2, 4)) @ P
                    i_new = False
            else: i_new = True
            if i_new:
                x = np.array([z[0], z[1], 0.0, 0.0]); P = np.diag([self.R_MES ** 2] * 2 + [self.V0_SIG ** 2] * 2)
            self.s[i] = (x, P, self.t, float(o[4]))
            out[k, :2] = x[:2]; out[k, 2:4] = x[2:]
        for i in [i for i, v in self.s.items() if self.t - v[2] > self.OUBLI]: del self.s[i]
        # covariance de chaque piste à l'instant courant (moyenne des axes x et y) : variance de position,
        # covariance position-vitesse, variance de vitesse. Propagée sur le temps écoulé pour les pistes non revues.
        self.last_cov = {}
        for i, (x, P, t0, r) in self.s.items():
            d = self.t - t0
            if d > 0:
                F = np.eye(4); F[0, 2] = F[1, 3] = d
                G = np.array([[d * d / 2, 0], [0, d * d / 2], [d, 0], [0, d]])
                P = F @ P @ F.T + self.SIG_A ** 2 * G @ G.T
            self.last_cov[i] = ((P[0, 0] + P[1, 1]) / 2, (P[0, 2] + P[1, 3]) / 2, (P[2, 2] + P[3, 3]) / 2)
        if self.prolonger:
            # pistes non revues à ce cycle (détection manquée, masquage) : on continue de les prédire, comme tout
            # système de suivi, jusqu'à leur effacement. Avant cette correction, une personne non détectée disparaissait
            # aussitôt pour le planificateur, même 0,1 s (audit indépendant du 17 novembre 2026).
            extra = []
            for i, (x, P, t0, r) in self.s.items():
                if i in vus: continue
                d = self.t - t0
                extra.append((x[0] + d * x[2], x[1] + d * x[3], x[2], x[3], r, 2, i))   # 2 : piste prolongée, sans mesure à ce cycle
            if extra: out = np.vstack([out, np.array(extra, float)])
        return out
