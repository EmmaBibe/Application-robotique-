// VIGIE 6 et DRA-MPPI en C++, portés ligne à ligne depuis js/sims/vigie6 (lui-même vérifié contre le banc Python
// par parite_js.py). Seul le calcul de la commande est porté : pas d'explication des décisions, pas de monde simulé.
// Fidélité vérifiée par parite_cpp.mjs et cpp/rejeu (test 35 de tests_banc.py) : mêmes entrées, mêmes commandes que le JavaScript.
#pragma once
#include <array>
#include <cmath>
#include <cstdint>
#include <vector>

namespace vigie {

constexpr double DT = 0.1, R_ROB = 0.3, VMAX = 1.5, WMAX = 2.0, AMAX = 2.0, SIZE = 20.0;
constexpr int T = 25;
constexpr double SIGV = 0.5, SIGW = 1.0, ALPHA_SMITH = 4.0;

using Obs = std::array<double, 7>;          // x, y, vx, vy, r, mobile (0 fixe, 1 vu, 2 prolongé), identifiant
using Pt = std::array<double, 2>;
using Path = std::vector<Pt>;
using Ctrl = std::vector<double>;           // 2 T valeurs : v0, w0, v1, w1, ...

// ------------------------------------------------------------------ générateur (le même que makeRand en JavaScript)
struct Rand {
  uint32_t a;
  explicit Rand(uint32_t seed = 1) : a(seed ? seed : 1) {}
  double operator()();
  double n();
};

// ------------------------------------------------------------------ grille
constexpr double RES = 0.25;
constexpr int NG = 80;
std::vector<uint8_t> occupancy(const std::vector<std::array<double, 3>>& circles, double margin);
std::vector<double> dijkstra(const std::vector<uint8_t>& occ, Pt goal);
bool astar(const std::vector<uint8_t>& occ0, Pt start, Pt goal, const std::vector<double>* extra, Path& out);
double lookup(const std::vector<double>& D, double x, double y);

// ------------------------------------------------------------------ probabilité de collision
void ensureTable();
double collisionProb(double d, double r, double sig);

// ------------------------------------------------------------------ coûts et MPPI
struct Risk { double wSoft, wHard, sigma; std::array<double, T> tw; double varRate; };
struct Context {
  std::vector<Obs> st, mob; int M = 0;
  std::vector<double> mux, muy, sig, rr;
  const std::vector<double>* D = nullptr;
};
Context makeContext(const std::vector<Obs>& obs, const std::vector<double>& D, const Risk& risk);
double costOne(const std::array<double, 3>& s, const double* U, const Context& ctx, const Risk& risk, const Path* guide, const Path* gt);

// ------------------------------------------------------------------ imprévisibilité mesurée
struct SurpriseTracker {
  struct Rec { double t; double o[4]; };
  std::vector<std::pair<int, std::vector<Rec>>> h;     // dans l'ordre d'apparition, comme une Map JavaScript
  std::vector<std::pair<int, double>> e;
  double H = 1.0, dflt = 0.3;
  void update(const std::vector<Obs>& obs, double t);
  std::vector<double> u(const std::vector<Obs>& obs) const;
};

// ------------------------------------------------------------------ planificateurs
class Base {
 public:
  explicit Base(int seed) : seedNoise(seed) {}
  virtual ~Base() = default;
  virtual void reset(const std::vector<std::array<double, 3>>& stat, Pt goal);
  void setLatency(int L) { lat = L; cmds.clear(); vwMeas = {0, 0}; }
  void setPerception(bool o, double range) { occl = o; sense = range > 0 ? range : 5.0; }
  std::array<double, 2> act(double t, const std::array<double, 3>& s, const std::vector<Obs>& obs);
 protected:
  virtual std::array<double, 2> outer(double t, const std::array<double, 3>& s, const std::vector<Obs>& obs) { return smith(t, s, obs); }
  std::array<double, 2> smith(double t, const std::array<double, 3>& s, const std::vector<Obs>& obs);
  virtual std::array<double, 2> core(double t, const std::array<double, 3>& s, const std::vector<Obs>& obs) = 0;
  Ctrl mppiStep(const std::array<double, 3>& s, const Ctrl& Unom, int N, const Context& ctx, const Path* guide, const Path* gt);
  int seedNoise; Rand rand{1};
  std::vector<Obs> known; std::vector<std::pair<long long, long long>> knownKeys;
  Pt goal{}; std::vector<double> D; Ctrl U;
  int lat = 0; std::vector<std::array<double, 2>> cmds; std::array<double, 2> vwMeas{0, 0};
  bool occl = false; double sense = 5.0;
  Risk risk{};
  std::vector<double> eps, Ubuf, J, wgt;       // tampons réutilisés d'un cycle à l'autre
};

class DRAMPPI : public Base {
 public:
  explicit DRAMPPI(int seed, int N = 400) : Base(seed), N(N) {}
  void reset(const std::vector<std::array<double, 3>>& stat, Pt goal) override;
 protected:
  std::array<double, 2> core(double t, const std::array<double, 3>& s, const std::vector<Obs>& obs) override;
  int N;
};

class Vigie6 : public Base {
 public:
  explicit Vigie6(int seed, int N = 128, int NFREE = 400) : Base(seed), N(N), NFREE(NFREE) {}
  void reset(const std::vector<std::array<double, 3>>& stat, Pt goal) override;
  int lastChosen = -1; bool lastRefreshed = false;
 protected:
  std::array<double, 2> outer(double t, const std::array<double, 3>& s, const std::vector<Obs>& obs) override;
  std::array<double, 2> core(double t, const std::array<double, 3>& s, const std::vector<Obs>& obs) override;
 private:
  struct Mode { Path g; Ctrl U; bool st = false, neuf = false, libre = false; };
  void refresh(const std::array<double, 3>& s, const std::vector<Obs>& obs);
  double idealCost(const std::array<double, 3>& s) const;
  int select(const std::array<double, 3>& s, std::vector<Mode*>& cands, const Context& ctx, const std::vector<Obs>& obs);
  int N, NFREE, K = 3; double C_CONS = 0.75, MARGE_FIXE = 0.1;
  std::vector<Mode> modes; Mode freeMode; int k = 0; bool hasPrevG = false; Path prevG; SurpriseTracker tr;
};

}  // namespace vigie
