// VIGIE 6 et DRA-MPPI en C++ (voir vigie.hpp). Chaque fonction suit son équivalent JavaScript, dans le même ordre
// de calcul, pour retrouver les mêmes commandes.
#include "vigie.hpp"

#include <algorithm>
#include <limits>
#include <queue>
#include <tuple>

namespace vigie {

static const double INF = std::numeric_limits<double>::infinity();
static inline double clampd(double x, double a, double b) { return std::min(b, std::max(a, x)); }

// ------------------------------------------------------------------ générateur
static inline uint32_t imul(uint32_t a, uint32_t b) { return a * b; }
double Rand::operator()() {
  a = a + 0x6D2B79F5u;
  uint32_t t = a;
  t = imul(t ^ (t >> 15), t | 1u);
  t ^= t + imul(t ^ (t >> 7), t | 61u);
  return static_cast<double>(t ^ (t >> 14)) / 4294967296.0;
}
double Rand::n() {
  double u = 0;
  while (u == 0) u = (*this)();
  return std::sqrt(-2 * std::log(u)) * std::cos(2 * M_PI * (*this)());
}

// ------------------------------------------------------------------ grille
static double XS[NG];
static bool xsReady = false;
static void ensureXS() { if (!xsReady) { for (int k = 0; k < NG; k++) XS[k] = (k + 0.5) * RES; xsReady = true; } }

std::vector<uint8_t> occupancy(const std::vector<std::array<double, 3>>& circles, double margin) {
  ensureXS();
  std::vector<uint8_t> occ(NG * NG, 0);
  for (const auto& c : circles) {
    const double R = c[2] + margin, R2 = R * R;
    for (int i = 0; i < NG; i++) {
      const double dx = XS[i] - c[0], dx2 = dx * dx;
      if (dx2 >= R2) continue;
      for (int j = 0; j < NG; j++) { const double dy = XS[j] - c[1]; if (dx2 + dy * dy < R2) occ[i * NG + j] = 1; }
    }
  }
  const int m = std::max(1, static_cast<int>(std::ceil(margin / RES)));
  for (int k = 0; k < m; k++) for (int q = 0; q < NG; q++) {
    occ[k * NG + q] = occ[(NG - 1 - k) * NG + q] = occ[q * NG + k] = occ[q * NG + NG - 1 - k] = 1;
  }
  return occ;
}

static inline std::array<int, 2> cell(Pt p) {
  return {static_cast<int>(std::trunc(std::min<double>(NG - 1, std::max(0.0, p[0] / RES)))),
          static_cast<int>(std::trunc(std::min<double>(NG - 1, std::max(0.0, p[1] / RES))))};
}
static const int NBd[8][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}, {1, 1}, {1, -1}, {-1, 1}, {-1, -1}};
static const double NBc[8] = {1, 1, 1, 1, 1.414, 1.414, 1.414, 1.414};

using E3 = std::tuple<double, int, int>;
using MinHeap3 = std::priority_queue<E3, std::vector<E3>, std::greater<E3>>;

std::vector<double> dijkstra(const std::vector<uint8_t>& occ, Pt goal) {
  std::vector<double> D(NG * NG, INF);
  auto g = cell(goal);
  MinHeap3 h;
  D[g[0] * NG + g[1]] = 0; h.emplace(0.0, g[0], g[1]);
  while (!h.empty()) {
    auto [d, i, j] = h.top(); h.pop();
    if (d > D[i * NG + j]) continue;
    for (int n = 0; n < 8; n++) {
      const int a = i + NBd[n][0], b = j + NBd[n][1];
      if (a >= 0 && a < NG && b >= 0 && b < NG && !occ[a * NG + b] && d + NBc[n] < D[a * NG + b]) { D[a * NG + b] = d + NBc[n]; h.emplace(d + NBc[n], a, b); }
    }
  }
  std::vector<double> E = D;
  MinHeap3 h2;
  for (int i = 0; i < NG; i++) for (int j = 0; j < NG; j++) if (std::isfinite(D[i * NG + j])) h2.emplace(D[i * NG + j], i, j);
  while (!h2.empty()) {
    auto [d, i, j] = h2.top(); h2.pop();
    if (d > E[i * NG + j]) continue;
    for (int n = 0; n < 8; n++) {
      const int a = i + NBd[n][0], b = j + NBd[n][1];
      if (a >= 0 && a < NG && b >= 0 && b < NG && !std::isfinite(D[a * NG + b]) && d + 2 * NBc[n] < E[a * NG + b]) { E[a * NG + b] = d + 2 * NBc[n]; h2.emplace(d + 2 * NBc[n], a, b); }
    }
  }
  double mx = -INF;
  for (double v : E) if (std::isfinite(v) && v > mx) mx = v;
  for (double& v : E) v = (std::isfinite(v) ? v : mx + 10) * RES;
  return E;
}

bool astar(const std::vector<uint8_t>& occ0, Pt start, Pt goal, const std::vector<double>* extra, Path& out) {
  auto s = cell(start), g = cell(goal);
  const int si = s[0], sj = s[1], gi = g[0], gj = g[1];
  std::vector<uint8_t> occ = occ0;
  for (int a = std::max(0, si - 1); a < std::min(NG, si + 2); a++) for (int b = std::max(0, sj - 1); b < std::min(NG, sj + 2); b++) occ[a * NG + b] = 0;
  std::vector<double> G(NG * NG, INF); std::vector<int> prev(NG * NG, -1); std::vector<uint8_t> closed(NG * NG, 0);
  MinHeap3 h;
  G[si * NG + sj] = 0; h.emplace(0.0, si, sj);
  bool found = false;
  while (!h.empty()) {
    auto [f, i, j] = h.top(); h.pop(); (void)f;
    const int u = i * NG + j;
    if (closed[u]) continue;
    closed[u] = 1;
    if (i == gi && j == gj) { found = true; break; }
    for (int n = 0; n < 8; n++) {
      const int a = i + NBd[n][0], b = j + NBd[n][1];
      if (!(a >= 0 && a < NG && b >= 0 && b < NG) || occ[a * NG + b]) continue;
      const int v = a * NG + b;
      const double nd = G[u] + NBc[n] + (extra ? (*extra)[v] : 0);
      if (nd < G[v]) { G[v] = nd; prev[v] = u; h.emplace(nd + std::hypot(static_cast<double>(a - gi), static_cast<double>(b - gj)), a, b); }
    }
  }
  if (!found) return false;
  std::vector<int> path;
  int u = gi * NG + gj;
  while (u != si * NG + sj) { path.push_back(u); u = prev[u]; }
  path.push_back(si * NG + sj);
  std::reverse(path.begin(), path.end());
  out.clear();
  for (int q : path) out.push_back({(q / NG + 0.5) * RES, (q % NG + 0.5) * RES});
  out.back() = goal;
  return true;
}

double lookup(const std::vector<double>& D, double x, double y) {
  const int i = std::min(NG - 1, std::max(0, static_cast<int>(std::trunc(x / RES))));
  const int j = std::min(NG - 1, std::max(0, static_cast<int>(std::trunc(y / RES))));
  return D[i * NG + j];
}

static double roundHalfEven(double x) {
  const double f = std::floor(x), d = x - f;
  if (d < 0.5) return f;
  if (d > 0.5) return f + 1;
  return std::fmod(f, 2.0) == 0 ? f : f + 1;
}
static inline double pmod(double a, double n) { return std::fmod(std::fmod(a, n) + n, n); }
static inline double wrap(double a) { return pmod(a + M_PI, 2 * M_PI) - M_PI; }
static double interp(double x, const std::vector<double>& xp, const std::vector<double>& fp) {
  const int n = static_cast<int>(xp.size());
  if (x <= xp[0]) return fp[0];
  if (x >= xp[n - 1]) return fp[n - 1];
  int lo = 0, hi = n - 1;
  while (hi - lo > 1) { const int m = (lo + hi) >> 1; if (xp[m] <= x) lo = m; else hi = m; }
  const double slope = (fp[lo + 1] - fp[lo]) / (xp[lo + 1] - xp[lo]);
  return slope * (x - xp[lo]) + fp[lo];
}

// ------------------------------------------------------------------ probabilité de collision (table du banc)
static const double I0A[] = {-4.4153416464793395e-18, 3.3307945188222384e-17, -2.431279846547955e-16, 1.715391285555133e-15, -1.1685332877993451e-14, 7.676185498604936e-14, -4.856446783111929e-13, 2.95505266312964e-12, -1.726826291441556e-11, 9.675809035373237e-11, -5.189795601635263e-10, 2.6598237246823866e-09, -1.300025009986248e-08, 6.046995022541919e-08, -2.670793853940612e-07, 1.1173875391201037e-06, -4.4167383584587505e-06, 1.6448448070728896e-05, -5.754195010082104e-05, 0.00018850288509584165, -0.0005763755745385824, 0.0016394756169413357, -0.004324309995050576, 0.010546460394594998, -0.02373741480589947, 0.04930528423967071, -0.09490109704804764, 0.17162090152220877, -0.3046826723431984, 0.6767952744094761};
static const double I0B[] = {-7.233180487874754e-18, -4.830504485944182e-18, 4.46562142029676e-17, 3.461222867697461e-17, -2.8276239805165836e-16, -3.425485619677219e-16, 1.7725601330565263e-15, 3.8116806693526224e-15, -9.554846698828307e-15, -4.150569347287222e-14, 1.54008621752141e-14, 3.8527783827421426e-13, 7.180124451383666e-13, -1.7941785315068062e-12, -1.3215811840447713e-11, -3.1499165279632416e-11, 1.1889147107846439e-11, 4.94060238822497e-10, 3.3962320257083865e-09, 2.266668990498178e-08, 2.0489185894690638e-07, 2.8913705208347567e-06, 6.889758346916825e-05, 0.0033691164782556943, 0.8044904110141088};
static double chbevl(double x, const double* vals, int n) {
  double b0 = vals[0], b1 = 0, b2 = 0;
  for (int i = 1; i < n; i++) { b2 = b1; b1 = b0; b0 = x * b1 - b2 + vals[i]; }
  return 0.5 * (b0 - b2);
}
static double i0(double x) {
  x = std::fabs(x);
  return x <= 8 ? std::exp(x) * chbevl(x / 2 - 2, I0A, 30) : std::exp(x) * chbevl(32 / x - 2, I0B, 25) / std::sqrt(x);
}
constexpr double CP_STEP = 0.05, CP_AMAX = 60, CP_BMAX = 40, RHO_STEP = 0.005;
constexpr int CP_NA = 1201, CP_NB = 801;
static std::vector<double> TAB;
void ensureTable() {
  if (!TAB.empty()) return;
  TAB.assign(CP_NA * CP_NB, 0);
  const int nrho = 8001;
  std::vector<double> rho(nrho), f(nrho), c(nrho);
  for (int k = 0; k < nrho; k++) rho[k] = k * RHO_STEP;
  for (int i = 0; i < CP_NA; i++) {
    const double a = i * CP_STEP;
    for (int m = 0; m < nrho; m++) {
      const double x = a * rho[m];
      const double xm = std::max(x, 1e-9);
      const double logi0 = x < 50 ? std::log(i0(std::min(x, 50.0))) : x - 0.5 * std::log(2 * M_PI * xm) + std::log1p(1 / (8 * xm) + 9 / (128 * (xm * xm)));
      f[m] = rho[m] * std::exp(-(rho[m] * rho[m] + a * a) / 2 + logi0);
    }
    c[0] = 0;
    for (int m = 1; m < nrho; m++) c[m] = c[m - 1] + (f[m] + f[m - 1]) / 2 * RHO_STEP;
    for (int k = 0; k < CP_NB; k++) {
      const double b = k * CP_STEP; double v;
      if (b <= rho[0]) v = c[0];
      else if (b >= rho[nrho - 1]) v = c[nrho - 1];
      else {
        int lo = std::min(nrho - 2, static_cast<int>(std::floor(b / RHO_STEP)));
        while (lo > 0 && rho[lo] > b) lo--;
        while (lo < nrho - 2 && rho[lo + 1] <= b) lo++;
        v = (c[lo + 1] - c[lo]) / (rho[lo + 1] - rho[lo]) * (b - rho[lo]) + c[lo];
      }
      TAB[i * CP_NB + k] = std::min(1.0, std::max(0.0, v));
    }
  }
}
double collisionProb(double d, double r, double sig) {
  const double a = d / sig, b = r / sig;
  if (a - b > 9) return 0;
  if (b - a > 9) return 1;
  const double am = clampd(a, 0, CP_AMAX), bm = clampd(b, 0, CP_BMAX);
  const int ia = std::min(static_cast<int>(std::trunc(am / CP_STEP)), CP_NA - 2), ib = std::min(static_cast<int>(std::trunc(bm / CP_STEP)), CP_NB - 2);
  const double fa = am / CP_STEP - ia, fb = bm / CP_STEP - ib;
  return (1 - fa) * (1 - fb) * TAB[ia * CP_NB + ib] + fa * (1 - fb) * TAB[(ia + 1) * CP_NB + ib]
       + (1 - fa) * fb * TAB[ia * CP_NB + ib + 1] + fa * fb * TAB[(ia + 1) * CP_NB + ib + 1];
}

// ------------------------------------------------------------------ outils
static double TIMES[T], TW_OBST[T];
static bool timesReady = false;
static void ensureTimes() { if (!timesReady) { for (int t = 0; t < T; t++) { TIMES[t] = (t + 1) * DT; TW_OBST[t] = std::pow(0.97, t); } timesReady = true; } }

static void rolloutXY(const std::array<double, 3>& s, const double* U, Path& out) {
  double x = s[0], y = s[1], th = s[2];
  out.clear();
  for (int t = 0; t < T; t++) {
    const double v = U[2 * t], w = U[2 * t + 1];
    x = x + DT * v * std::cos(th); y = y + DT * v * std::sin(th); th = th + DT * w;
    out.push_back({x, y});
  }
}

static double percentile10(std::vector<double> a) {
  std::sort(a.begin(), a.end());
  const int n = static_cast<int>(a.size());
  const double vi = 0.1 * (n - 1);
  const int lo = static_cast<int>(std::floor(vi)), hi = std::min(n - 1, lo + 1);
  const double g = vi - lo, A = a[lo], B = a[hi], diff = B - A;
  return g >= 0.5 ? B - diff * (1 - g) : A + diff * g;
}

Context makeContext(const std::vector<Obs>& obs, const std::vector<double>& D, const Risk& risk) {
  ensureTimes();
  Context c;
  for (const auto& o : obs) { if (o[5] == 0) c.st.push_back(o); else if (o[5] > 0) c.mob.push_back(o); }
  const int M = c.M = static_cast<int>(c.mob.size());
  c.mux.assign(T * M, 0); c.muy.assign(T * M, 0); c.sig.assign(T * M, 0); c.rr.assign(M, 0);
  for (int m = 0; m < M; m++) {
    c.rr[m] = c.mob[m][4] + R_ROB;
    for (int t = 0; t < T; t++) {
      c.mux[t * M + m] = c.mob[m][0] + c.mob[m][2] * TIMES[t]; c.muy[t * M + m] = c.mob[m][1] + c.mob[m][3] * TIMES[t];
      c.sig[t * M + m] = std::sqrt(risk.varRate * TIMES[t]);
    }
  }
  c.D = &D;
  return c;
}

double costOne(const std::array<double, 3>& s, const double* U, const Context& ctx, const Risk& risk, const Path* guide, const Path* gt) {
  double x = s[0], y = s[1], th = s[2];
  double obst = 0, navSum = 0, navLast = 0, wSum = 0, gSum = 0, rSum = 0, track = 0;
  const int M = ctx.M, ns = static_cast<int>(ctx.st.size());
  const int ngt = gt ? std::min(T, static_cast<int>(gt->size())) : 0;
  for (int t = 0; t < T; t++) {
    const double v = U[2 * t], w = U[2 * t + 1];
    x = x + DT * v * std::cos(th); y = y + DT * v * std::sin(th); th = th + DT * w;
    double d = ns ? INF : 10.0;
    for (int k = 0; k < ns; k++) { const double dx = x - ctx.st[k][0], dy = y - ctx.st[k][1], q = std::sqrt(dx * dx + dy * dy) - ctx.st[k][4] - R_ROB; if (q < d) d = q; }
    const double dw = std::min(std::min(x, y), std::min(SIZE - x, SIZE - y)) - R_ROB; if (dw < d) d = dw;
    const double cl = std::max(0.6 - d, 0.0);
    obst += (3000.0 * (d < 0 ? 1 : 0) + 60.0 * cl * cl) * TW_OBST[t];
    navLast = lookup(*ctx.D, x, y); navSum += navLast;
    wSum += w * w;
    if (guide) {
      double best = INF;
      for (const auto& q : *guide) { const double ex = x - q[0], ey = y - q[1], e = std::sqrt(ex * ex + ey * ey); if (e < best) best = e; }
      gSum += best * best;
    }
    if (M) {
      double keep = 1;
      for (int m = 0; m < M; m++) {
        const double dx = x - ctx.mux[t * M + m], dy = y - ctx.muy[t * M + m];
        keep *= 1 - collisionProb(std::sqrt(dx * dx + dy * dy), ctx.rr[m], ctx.sig[t * M + m]);
      }
      const double pj = 1 - keep;
      rSum += (risk.wSoft * pj + risk.wHard * (pj > risk.sigma ? 1 : 0)) * risk.tw[t];
    }
    if (t < ngt) { const double ex = x - (*gt)[t][0], ey = y - (*gt)[t][1]; track += ex * ex + ey * ey; }
  }
  double c = obst;
  c = c + 8.0 * navLast + 0.4 * navSum + 0.05 * wSum;
  if (guide) c = c + 1.5 * gSum;
  c = c + rSum;
  if (gt) c = c + 2.0 * track;
  return c;
}

static Ctrl initU() { Ctrl U(2 * T, 0.0); for (int t = 0; t < T; t++) U[2 * t] = 0.5; return U; }
static Ctrl shiftU(const Ctrl& U) {
  Ctrl o(2 * T, 0.0);
  for (int k = 2; k < 2 * T; k++) o[k - 2] = U[k];
  o[2 * T - 2] = o[2 * T - 4]; o[2 * T - 1] = o[2 * T - 3];
  return o;
}

Ctrl Base::mppiStep(const std::array<double, 3>& s, const Ctrl& Unom, int N, const Context& ctx, const Path* guide, const Path* gt) {
  eps.resize(static_cast<size_t>(N) * T * 2);
  for (auto& e : eps) e = rand.n();
  Ubuf.resize(static_cast<size_t>(N) * T * 2);
  for (int n = 0; n < N; n++) for (int t = 0; t < T; t++) {
    const size_t k = (static_cast<size_t>(n) * T + t) * 2;
    double v = Unom[2 * t] + eps[k] * SIGV, w = Unom[2 * t + 1] + eps[k + 1] * SIGW;
    if (n == 0) { v = Unom[2 * t]; w = Unom[2 * t + 1]; } else if (n == 1) { v = 0; w = 0; }
    Ubuf[k] = std::min(VMAX, std::max(0.0, v)); Ubuf[k + 1] = std::min(WMAX, std::max(-WMAX, w));
  }
  J.resize(N);
  for (int n = 0; n < N; n++) J[n] = costOne(s, &Ubuf[static_cast<size_t>(n) * T * 2], ctx, risk, guide, gt);
  double mn = INF; for (double j : J) if (j < mn) mn = j;
  const double lam = std::max(1e-6, (percentile10(J) - mn) / 2.0);
  wgt.resize(N); double ws = 0;
  for (int n = 0; n < N; n++) { wgt[n] = std::exp(-(J[n] - mn) / lam); ws += wgt[n]; }
  Ctrl out(2 * T, 0.0);
  for (int n = 0; n < N; n++) { const double a = wgt[n] / ws; for (int k = 0; k < 2 * T; k++) out[k] += a * Ubuf[static_cast<size_t>(n) * T * 2 + k]; }
  return out;
}

// ------------------------------------------------------------------ routes topologiques
static std::vector<Path> diverseGuides(const std::array<double, 3>& s, Pt goal, const std::vector<Obs>& obs, int K) {
  ensureXS();
  std::vector<std::array<double, 3>> circ;
  for (const auto& o : obs) circ.push_back({o[0], o[1], o[4] + (o[5] != 0 ? 0.2 : 0)});
  const auto occ = occupancy(circ, R_ROB + 0.1);
  std::vector<Path> guides; std::vector<double> extra(NG * NG, 0.0);
  const Pt sp{s[0], s[1]};
  for (int it = 0; it < K + 2; it++) {
    Path p;
    if (!astar(occ, sp, goal, &extra, p)) break;
    bool far = true;
    for (const auto& g : guides) {
      double tot = 0;
      for (const auto& a : p) { double b = INF; for (const auto& q : g) { const double dx = a[0] - q[0], dy = a[1] - q[1], d = std::sqrt(dx * dx + dy * dy); if (d < b) b = d; } tot += b; }
      if (!(tot / p.size() > 0.8)) { far = false; break; }
    }
    if (far) guides.push_back(p);
    if (static_cast<int>(guides.size()) == K) break;
    for (size_t k = 0; k < p.size(); k += 2) {
      const auto& q = p[k];
      const bool ok = std::hypot(q[0] - s[0], q[1] - s[1]) > 1.2 && std::hypot(q[0] - goal[0], q[1] - goal[1]) > 1.2;
      if (!ok) continue;
      for (int i = 0; i < NG; i++) { const double dx = XS[i] - q[0]; for (int j = 0; j < NG; j++) { const double dy = XS[j] - q[1]; extra[i * NG + j] += 6.0 * std::exp(-(dx * dx + dy * dy) / (2 * (0.6 * 0.6))); } }
    }
  }
  return guides;
}

static Ctrl guideToControls(const std::array<double, 3>& s, const Path& g) {
  Ctrl U(2 * T, 0.0); double x = s[0], y = s[1], th = s[2];
  for (int t = 0; t < T; t++) {
    int i = 0; double bd = INF;
    for (size_t k = 0; k < g.size(); k++) { const double d = std::hypot(g[k][0] - x, g[k][1] - y); if (d < bd) { bd = d; i = static_cast<int>(k); } }
    const int j = std::min(static_cast<int>(g.size()) - 1, i + 4);
    double a = std::atan2(g[j][1] - y, g[j][0] - x) - th; a = std::atan2(std::sin(a), std::cos(a));
    U[2 * t] = VMAX * 0.8 * std::max(0.1, std::cos(a)); U[2 * t + 1] = std::min(WMAX, std::max(-WMAX, 2.5 * a));
    x = x + DT * U[2 * t] * std::cos(th); y = y + DT * U[2 * t] * std::sin(th); th = th + DT * U[2 * t + 1];
  }
  return U;
}

static Ctrl timedControls(const std::array<double, 3>& s, const Path& gt) {
  Ctrl U(2 * T, 0.0); double x = s[0], y = s[1], th = s[2];
  for (int t = 0; t < T; t++) {
    const auto& q = gt[std::min(static_cast<int>(gt.size()) - 1, t + 3)];
    const double d = std::hypot(q[0] - x, q[1] - y);
    double a = std::atan2(q[1] - y, q[0] - x) - th; a = std::atan2(std::sin(a), std::cos(a));
    U[2 * t] = std::min(VMAX, std::max(0.0, d / 0.4)) * std::max(0.0, std::cos(a)); U[2 * t + 1] = std::min(WMAX, std::max(-WMAX, 2.5 * a));
    x = x + DT * U[2 * t] * std::cos(th); y = y + DT * U[2 * t] * std::sin(th); th = th + DT * U[2 * t + 1];
  }
  return U;
}

// ------------------------------------------------------------------ route espace-temps
constexpr double ST_RES = 0.35, ST_DT = 1.0 / 3.0;
constexpr int ST_K = 24, ST_SUB = 4;
static const int ST_N = static_cast<int>(std::lround(SIZE / ST_RES));   // Math.round(57,14) = 57

static bool spacetimePlan(const std::array<double, 3>& s, Pt goal, const std::vector<Obs>& obs, const std::vector<double>& D,
                          const std::vector<double>& uncAgent, double marginStatic, double margin, Path& out) {
  const int N = ST_N;
  std::vector<double> xs(N); for (int k = 0; k < N; k++) xs[k] = (k + 0.5) * ST_RES;
  std::vector<uint8_t> stat(N * N, 0);
  const double ms = marginStatic;
  for (const auto& o : obs) {
    if (o[5] != 0) continue;
    const double R = o[4] + R_ROB + ms, R2 = R * R;
    for (int i = 0; i < N; i++) { const double dx = xs[i] - o[0]; for (int j = 0; j < N; j++) { const double dy = xs[j] - o[1]; if (dx * dx + dy * dy < R2) stat[i * N + j] = 1; } }
  }
  for (int q = 0; q < N; q++) stat[q] = stat[(N - 1) * N + q] = stat[q * N] = stat[q * N + N - 1] = 1;
  std::vector<const Obs*> mob; std::vector<double> ua;
  for (size_t k = 0; k < obs.size(); k++) if (obs[k][5] > 0) { mob.push_back(&obs[k]); ua.push_back(uncAgent[k]); }
  const int nf = ST_K * ST_SUB + 1; const double dtf = ST_DT / ST_SUB;
  std::vector<uint8_t> occ(static_cast<size_t>(nf) * N * N);
  for (int q = 0; q < nf; q++) {
    const double t = q * dtf; const size_t base = static_cast<size_t>(q) * N * N;
    std::copy(stat.begin(), stat.end(), occ.begin() + base);
    for (size_t m = 0; m < mob.size(); m++) {
      const Obs& a = *mob[m];
      const double px = a[0] + a[2] * t, py = a[1] + a[3] * t, rr = a[4] + R_ROB + margin + ua[m] * t;
      const int i0 = std::max(0, static_cast<int>(std::trunc((px - rr) / ST_RES))), i1 = std::min(N - 1, static_cast<int>(std::trunc((px + rr) / ST_RES)) + 1);
      const int j0 = std::max(0, static_cast<int>(std::trunc((py - rr) / ST_RES))), j1 = std::min(N - 1, static_cast<int>(std::trunc((py + rr) / ST_RES)) + 1);
      if (i0 > i1 || j0 > j1) continue;
      for (int i = i0; i <= i1; i++) for (int j = j0; j <= j1; j++) { const double dx = xs[i] - px, dy = xs[j] - py; if (dx * dx + dy * dy < rr * rr) occ[base + i * N + j] = 1; }
    }
  }
  auto cellST = [&](double x, double y) { return std::array<int, 2>{std::min(N - 1, std::max(0, static_cast<int>(std::trunc(x / ST_RES)))), std::min(N - 1, std::max(0, static_cast<int>(std::trunc(y / ST_RES))))}; };
  const auto sc = cellST(s[0], s[1]), gc = cellST(goal[0], goal[1]);
  const int si = sc[0], sj = sc[1], gi = gc[0], gj = gc[1];
  auto Dst = [&](int i, int j) { return lookup(D, xs[i], xs[j]) / ST_RES; };
  struct Mv { int di, dj; double c; };
  std::vector<Mv> moves{{0, 0, 0.25}};
  for (int di = -1; di <= 1; di++) for (int dj = -1; dj <= 1; dj++) if (di || dj) moves.push_back({di, dj, std::hypot(static_cast<double>(di), static_cast<double>(dj))});
  const size_t NK = static_cast<size_t>(ST_K + 1) * N * N;
  auto key = [&](int i, int j, int k) { return (static_cast<size_t>(k) * N + i) * N + j; };
  std::vector<double> G(NK, INF); std::vector<int> prev(NK, -1); std::vector<uint8_t> closed(NK, 0);
  using E4 = std::tuple<double, int, int, int>;
  std::priority_queue<E4, std::vector<E4>, std::greater<E4>> h;
  G[key(si, sj, 0)] = 0.0; h.emplace(Dst(si, sj), si, sj, 0);
  bool haveBest = false; std::array<int, 3> best{}; double bestc = INF; int n = 0;
  while (!h.empty() && n < 80000) {
    auto [f, i, j, k] = h.top(); h.pop(); (void)f;
    const size_t u = key(i, j, k);
    if (closed[u]) continue;
    closed[u] = 1; n++;
    if ((i == gi && j == gj) || k == ST_K) {
      const double c = G[u] + (i == gi && j == gj ? 0 : Dst(i, j));
      if (c < bestc) { bestc = c; best = {i, j, k}; haveBest = true; }
      if (i == gi && j == gj) break;
      continue;
    }
    for (const auto& mv : moves) {
      const int a = i + mv.di, b = j + mv.dj;
      if (!(a >= 0 && a < N && b >= 0 && b < N)) continue;
      bool ok = true;
      for (int q = 1; q <= ST_SUB; q++) {
        const int ci = static_cast<int>(roundHalfEven(i + mv.di * static_cast<double>(q) / ST_SUB)), cj = static_cast<int>(roundHalfEven(j + mv.dj * static_cast<double>(q) / ST_SUB));
        if (occ[static_cast<size_t>(k * ST_SUB + q) * N * N + ci * N + cj] && !(k == 0 && q < 2)) { ok = false; break; }
      }
      if (!ok) continue;
      const size_t v = key(a, b, k + 1); const double nd = G[u] + mv.c + 0.2;
      if (nd < G[v]) { G[v] = nd; prev[v] = static_cast<int>(u); h.emplace(nd + Dst(a, b), a, b, k + 1); }
    }
  }
  if (!haveBest) return false;
  std::vector<std::array<int, 3>> path{best};
  for (;;) {
    const auto& last = path.back();
    const int p = prev[key(last[0], last[1], last[2])];
    if (p < 0) break;
    const int kk = p / (N * N), rem = p % (N * N);
    path.push_back({rem / N, rem % N, kk});
  }
  std::reverse(path.begin(), path.end());
  std::vector<double> px, py, tk;
  for (size_t q = 0; q < path.size(); q++) { px.push_back((path[q][0] + 0.5) * ST_RES); py.push_back((path[q][1] + 0.5) * ST_RES); tk.push_back(q * ST_DT); }
  px[0] = s[0]; py[0] = s[1];
  const int nq = static_cast<int>(std::trunc(path.size() * ST_DT / DT));
  out.clear();
  for (int q = 1; q <= nq; q++) { const double tq = q * DT; out.push_back({interp(tq, tk, px), interp(tq, tk, py)}); }
  return true;
}

// ------------------------------------------------------------------ imprévisibilité mesurée
void SurpriseTracker::update(const std::vector<Obs>& obs, double t) {
  for (const auto& o : obs) {
    if (!(o[5] > 0)) continue;
    const int i = static_cast<int>(std::trunc(o[6]));
    std::vector<Rec>* q = nullptr;
    for (auto& p : h) if (p.first == i) { q = &p.second; break; }
    if (!q) { h.push_back({i, {}}); q = &h.back().second; }
    q->push_back({t, {o[0], o[1], o[2], o[3]}});
    if (q->size() > 40) q->erase(q->begin());
    while (!q->empty() && t - q->front().t > H + 0.15) q->erase(q->begin());
    const Rec& old = q->front(); const double t0 = old.t;
    if (std::fabs((t - t0) - H) <= 0.15) {
      const double err = std::hypot(o[0] - (old.o[0] + old.o[2] * (t - t0)), o[1] - (old.o[1] + old.o[3] * (t - t0)));
      double* ev = nullptr;
      for (auto& p : e) if (p.first == i) { ev = &p.second; break; }
      if (ev) *ev = 0.85 * (*ev) + 0.15 * err; else e.push_back({i, 0.85 * err + 0.15 * err});
    }
  }
}
std::vector<double> SurpriseTracker::u(const std::vector<Obs>& obs) const {
  std::vector<double> out;
  for (const auto& o : obs) {
    if (!(o[5] > 0)) { out.push_back(0); continue; }
    const int i = static_cast<int>(std::trunc(o[6]));
    const double* ev = nullptr;
    for (const auto& p : e) if (p.first == i) { ev = &p.second; break; }
    out.push_back(ev ? std::min(1.0, std::max(0.0, (*ev - 0.08) / 0.45)) : dflt);
  }
  return out;
}

// ------------------------------------------------------------------ angles morts
static std::vector<Obs> phantoms(const std::array<double, 3>& s, const std::vector<Obs>& obs, double range, double speed = 1.5) {
  std::vector<const Obs*> st;
  for (const auto& o : obs) if (o[5] == 0) st.push_back(&o);
  std::vector<Obs> res;
  if (st.empty()) return res;
  const size_t ns = st.size();
  std::vector<std::array<double, 2>> rel(ns); std::vector<double> d(ns);
  for (size_t k = 0; k < ns; k++) { rel[k] = {(*st[k])[0] - s[0], (*st[k])[1] - s[1]}; d[k] = std::hypot(rel[k][0], rel[k][1]); }
  const double hd0 = std::cos(s[2]), hd1 = std::sin(s[2]);
  std::vector<std::pair<double, Obs>> out;
  for (size_t k = 0; k < ns; k++) {
    if (!(d[k] < range + 1.5 && d[k] > (*st[k])[4] + 0.2)) continue;
    const Obs& c = *st[k]; const double r = c[4];
    if ((rel[k][0] * hd0 + rel[k][1] * hd1) / d[k] < -0.2) continue;
    const double base = std::atan2(rel[k][1], rel[k][0]), half = std::asin(std::min(1.0, r / d[k]));
    for (int sg : {-1, 1}) {
      const double a = base + sg * (half + 0.02), L = std::sqrt(std::max(d[k] * d[k] - r * r, 0.0));
      const double E0 = s[0] + L * std::cos(a), E1 = s[1] + L * std::sin(a);
      double nx = E0 - c[0], ny = E1 - c[1]; const double nn = std::sqrt(nx * nx + ny * ny) + 1e-9; nx /= nn; ny /= nn;
      double ax = E0 - s[0], ay = E1 - s[1]; const double an = std::sqrt(ax * ax + ay * ay) + 1e-9; ax /= an; ay /= an;
      const double P0 = E0 + 1.0 * ax - 0.25 * nx, P1 = E1 + 1.0 * ay - 0.25 * ny;
      bool inObst = false;
      for (const Obs* b : st) if (std::hypot((*b)[0] - P0, (*b)[1] - P1) < (*b)[4] + 0.35) { inObst = true; break; }
      if (inObst) continue;
      if (!(0.5 < P0 && P0 < SIZE - 0.5 && 0.5 < P1 && P1 < SIZE - 0.5)) continue;
      const double segx = E0 - s[0], segy = E1 - s[1], Ls = std::sqrt(segx * segx + segy * segy), ux = segx / (Ls + 1e-9), uy = segy / (Ls + 1e-9);
      bool blocked = false;
      for (size_t q = 0; q < ns && !blocked; q++) {
        if (q == k) continue;
        const double pr = rel[q][0] * ux + rel[q][1] * uy, perp = std::fabs(rel[q][0] * uy - rel[q][1] * ux);
        if (pr > 0 && pr < Ls - 0.05 && perp < (*st[q])[4] - 0.05) blocked = true;
      }
      if (blocked) continue;
      const double rpx = P0 - s[0], rpy = P1 - s[1], LP = std::sqrt(rpx * rpx + rpy * rpy), upx = rpx / (LP + 1e-9), upy = rpy / (LP + 1e-9);
      bool hidden = false;
      for (size_t q = 0; q < ns && !hidden; q++) {
        const double pr = rel[q][0] * upx + rel[q][1] * upy, perp = std::fabs(rel[q][0] * upy - rel[q][1] * upx);
        if (pr > 0 && pr < LP && perp < (*st[q])[4]) hidden = true;
      }
      if (!hidden) continue;
      double v0 = -uy * sg * speed, v1 = ux * sg * speed;
      if (v0 * (s[0] - P0) + v1 * (s[1] - P1) < 0) { v0 = -v0; v1 = -v1; }
      out.push_back({Ls, Obs{P0, P1, v0, v1, 0.35, 1, -1.0 - static_cast<double>(out.size())}});
    }
  }
  std::stable_sort(out.begin(), out.end(), [](const auto& x, const auto& y) { return x.first < y.first; });
  for (size_t q = 0; q < out.size() && q < 6; q++) res.push_back(out[q].second);
  return res;
}

static double phantomSpeed(const std::array<double, 3>& s, const std::vector<Obs>& ph, double a = 0.8 * AMAX, double cone = 1.3, double margin = 0.25) {
  if (ph.empty()) return VMAX;
  const double hd0 = std::cos(s[2]), hd1 = std::sin(s[2]); double best = INF;
  for (const auto& p : ph) {
    const double rx = p[0] - s[0], ry = p[1] - s[1], d = std::hypot(rx, ry) - p[4] - R_ROB - margin;
    const double ang = std::fabs(std::atan2(rx * hd1 * -1 + ry * hd0, rx * hd0 + ry * hd1));
    if (!(ang < cone)) continue;
    const double vf = std::hypot(p[2], p[3]), dd = std::max(d, 0.0);
    best = std::min(best, -vf + std::sqrt(vf * vf + 2 * a * dd));
  }
  if (best == INF) return VMAX;
  return std::min(VMAX, std::max(0.15, best));
}

// ------------------------------------------------------------------ cohérence de route
static Path routeAhead(const Path& g, const std::array<double, 3>& s, int n = 60) {
  int k = 0; double bd = INF;
  for (size_t q = 0; q < g.size(); q++) { const double d = std::hypot(g[q][0] - s[0], g[q][1] - s[1]); if (d < bd) { bd = d; k = static_cast<int>(q); } }
  std::vector<double> px{s[0]}, py{s[1]};
  for (size_t q = k; q < g.size(); q++) { px.push_back(g[q][0]); py.push_back(g[q][1]); }
  std::vector<double> L{0};
  for (size_t q = 1; q < px.size(); q++) L.push_back(L[q - 1] + std::hypot(px[q] - px[q - 1], py[q] - py[q - 1]));
  const double Lt = L.back();
  Path out;
  if (Lt < 1e-6) { for (int i = 0; i < n; i++) out.push_back({px[0], py[0]}); return out; }
  const double step = Lt / (n - 1);
  for (int i = 0; i < n; i++) { const double u = i == n - 1 ? Lt : i * step; out.push_back({interp(u, L, px), interp(u, L, py)}); }
  return out;
}

static bool sameClass(const Path& pa, const Path& pb, const std::vector<Obs>& st) {
  for (const auto& o : st) {
    double sa = 0, sb = 0;
    std::vector<double> tha(pa.size()), thb(pb.size());
    for (size_t k = 0; k < pa.size(); k++) tha[k] = std::atan2(pa[k][1] - o[1], pa[k][0] - o[0]);
    for (size_t k = 0; k < pb.size(); k++) thb[k] = std::atan2(pb[k][1] - o[1], pb[k][0] - o[0]);
    for (size_t k = 1; k < tha.size(); k++) { sa += wrap(tha[k] - tha[k - 1]); sb += wrap(thb[k] - thb[k - 1]); }
    const double close = wrap(thb.back() - tha.back());
    if (!(std::fabs((sa + close - sb) / (2 * M_PI)) < 0.5)) return false;
  }
  return true;
}

// ------------------------------------------------------------------ socle commun
// clé de la mémoire de carte : même arrondi que toFixed(1) en JavaScript (moitié vers le haut, sur la valeur exacte)
static long long toFixed1(double x) {
  const bool neg = std::signbit(x); const long double y = static_cast<long double>(std::fabs(x)) * 10.0L;
  const long double f = std::floor(y); const long long n = static_cast<long long>(f) + ((y - f) >= 0.5L ? 1 : 0);
  return neg ? -n - (n == 0 ? 1000000000LL : 0) : n;        // « -0.0 » et « 0.0 » sont deux clés différentes
}

void Base::reset(const std::vector<std::array<double, 3>>& stat, Pt g) {
  ensureTable(); ensureTimes();
  known.clear(); knownKeys.clear();
  for (size_t i = 0; i < stat.size(); i++) { known.push_back({stat[i][0], stat[i][1], 0, 0, stat[i][2], 0, static_cast<double>(i)}); knownKeys.push_back({toFixed1(stat[i][0]), toFixed1(stat[i][1])}); }
  goal = g;
  rand = Rand(static_cast<uint32_t>(1 + seedNoise * 7919));
  D = dijkstra(occupancy(stat, R_ROB + 0.1), goal);
  U = initU();
  lat = 0; cmds.clear(); vwMeas = {0, 0}; occl = false; sense = 5.0;
}

std::array<double, 2> Base::act(double t, const std::array<double, 3>& s, const std::vector<Obs>& obs) {
  for (const auto& o : obs) {
    if (o[5] != 0) continue;
    const std::pair<long long, long long> kk{toFixed1(o[0]), toFixed1(o[1])};
    if (std::find(knownKeys.begin(), knownKeys.end(), kk) == knownKeys.end()) { known.push_back({o[0], o[1], 0, 0, o[4], 0, o[6]}); knownKeys.push_back(kk); }
  }
  std::vector<Obs> full = known;
  for (const auto& o : obs) if (o[5] > 0) full.push_back(o);
  return outer(t, s, full);
}

std::array<double, 2> Base::smith(double t, const std::array<double, 3>& s, const std::vector<Obs>& obs) {
  if (lat <= 0) return core(t, s, obs);
  std::array<double, 3> x = s; double vv = vwMeas[0], ww = vwMeas[1];
  const auto vs = cmds;
  for (const auto& c : vs) {
    vv = vv + std::min(AMAX * DT, std::max(-AMAX * DT, c[0] - vv)); ww = ww + std::min(ALPHA_SMITH * DT, std::max(-ALPHA_SMITH * DT, c[1] - ww));
    x = {x[0] + DT * vv * std::cos(x[2]), x[1] + DT * vv * std::sin(x[2]), x[2] + DT * ww};
  }
  const double nv = static_cast<double>(vs.size());
  std::vector<Obs> o = obs;
  for (auto& r : o) if (r[5] > 0) { r[0] = r[0] + r[2] * nv * DT; r[1] = r[1] + r[3] * nv * DT; }
  const auto u = core(t + nv * DT, x, o);
  const size_t maxlen = static_cast<size_t>(std::max(1, lat));
  if (cmds.size() == maxlen && !vs.empty()) {
    const double v0 = vwMeas[0], w0 = vwMeas[1];
    vwMeas = {v0 + std::min(AMAX * DT, std::max(-AMAX * DT, vs[0][0] - v0)), w0 + std::min(ALPHA_SMITH * DT, std::max(-ALPHA_SMITH * DT, vs[0][1] - w0))};
  }
  cmds.push_back({std::min(VMAX, std::max(0.0, u[0])), std::min(WMAX, std::max(-WMAX, u[1]))});
  if (cmds.size() > maxlen) cmds.erase(cmds.begin());
  return u;
}

// ------------------------------------------------------------------ DRA-MPPI
void DRAMPPI::reset(const std::vector<std::array<double, 3>>& stat, Pt g) {
  Base::reset(stat, g);
  risk.wSoft = 3000.0; risk.wHard = 3000.0; risk.sigma = 0.05; risk.tw.fill(1.0); risk.varRate = 0.3 * 0.3 * 0.2;
}
std::array<double, 2> DRAMPPI::core(double, const std::array<double, 3>& s, const std::vector<Obs>& obs) {
  const Context ctx = makeContext(obs, D, risk);
  U = mppiStep(s, U, N, ctx, nullptr, nullptr);
  const std::array<double, 2> u{U[0], U[1]};
  U = shiftU(U);
  return u;
}

// ------------------------------------------------------------------ VIGIE 6
void Vigie6::reset(const std::vector<std::array<double, 3>>& stat, Pt g) {
  Base::reset(stat, g);
  risk.wSoft = 3000.0; risk.wHard = 3000.0; risk.sigma = 0.05; risk.varRate = 0.3 * 0.3 * 0.2;
  for (int t = 0; t < T; t++) risk.tw[t] = std::pow(0.97, t);
  modes.clear(); k = 0; hasPrevG = false; prevG.clear(); tr = SurpriseTracker();
  freeMode = Mode(); freeMode.U = initU(); freeMode.libre = true;
}

std::array<double, 2> Vigie6::outer(double t, const std::array<double, 3>& s, const std::vector<Obs>& obs) {
  auto u = smith(t, s, obs);
  if (occl) { const auto ph = phantoms(s, obs, sense); u[0] = std::min(u[0], phantomSpeed(s, ph)); }
  return u;
}

std::array<double, 2> Vigie6::core(double t, const std::array<double, 3>& s, const std::vector<Obs>& obs) {
  tr.update(obs, t);
  lastRefreshed = false;
  if (k % 10 == 0 || modes.empty()) { refresh(s, obs); lastRefreshed = true; }
  k++;
  if (modes.empty()) { lastChosen = -1; return {0.0, 0.0}; }
  const Context ctx = makeContext(obs, D, risk);
  for (auto& m : modes) {
    if (m.st) {
      if (m.g.size() > 1 && !m.neuf) m.g.erase(m.g.begin());
      m.neuf = false;
      m.U = mppiStep(s, m.U, N, ctx, nullptr, &m.g);
    } else {
      m.U = mppiStep(s, m.U, N, ctx, &m.g, nullptr);
    }
  }
  freeMode.U = mppiStep(s, freeMode.U, NFREE, ctx, nullptr, nullptr);
  rolloutXY(s, freeMode.U.data(), freeMode.g); freeMode.g.push_back(goal);
  std::vector<Mode*> cands;
  for (auto& m : modes) cands.push_back(&m);
  cands.push_back(&freeMode);
  const int i = select(s, cands, ctx, obs);
  lastChosen = i;
  const std::array<double, 2> u{cands[i]->U[0], cands[i]->U[1]};
  for (auto* m : cands) m->U = shiftU(m->U);
  return u;
}

void Vigie6::refresh(const std::array<double, 3>& s, const std::vector<Obs>& obs) {
  const auto guides = diverseGuides(s, goal, obs, K);
  std::vector<Mode> neu;
  for (const auto& g : guides) {
    const Mode* best = nullptr; double bd = INF;
    for (const auto& m : modes) {
      double tot = 0;
      for (const auto& a : m.g) { double b = INF; for (const auto& q : g) { const double dx = a[0] - q[0], dy = a[1] - q[1], d = std::sqrt(dx * dx + dy * dy); if (d < b) b = d; } tot += b; }
      const double d = tot / m.g.size(); if (d < bd) { bd = d; best = &m; }
    }
    Mode nm; nm.g = g; nm.U = best && bd < 1.0 ? best->U : guideToControls(s, g);
    neu.push_back(nm);
  }
  if (!neu.empty()) modes = neu;
  else { std::vector<Mode> keep; for (const auto& m : modes) if (!m.st) keep.push_back(m); modes = keep; }
  const auto u = tr.u(obs);
  std::vector<double> ua(u.size()); for (size_t q = 0; q < u.size(); q++) ua[q] = 0.02 + 0.30 * u[q];
  Path gt;
  if (spacetimePlan(s, goal, obs, D, ua, MARGE_FIXE, 0.3, gt) && gt.size() > 3) { Mode m; m.g = gt; m.U = timedControls(s, gt); m.st = true; m.neuf = true; modes.push_back(m); }
}

double Vigie6::idealCost(const std::array<double, 3>& s) const {
  const double n0 = lookup(D, s[0], s[1]); double sum = 0, last = 0;
  for (int t = 0; t < T; t++) { last = std::max(0.0, n0 - VMAX * TIMES[t]); sum += last; }
  return 8.0 * last + 0.4 * sum;
}

int Vigie6::select(const std::array<double, 3>& s, std::vector<Mode*>& cands, const Context& ctx, const std::vector<Obs>& obs) {
  const double ideal = idealCost(s);
  std::vector<Obs> st; for (const auto& o : obs) if (o[5] == 0) st.push_back(o);
  const size_t nc = cands.size();
  std::vector<double> Jv(nc), w(nc, 1.0);
  for (size_t c = 0; c < nc; c++) { const double raw = costOne(s, cands[c]->U.data(), ctx, risk, nullptr, nullptr); Jv[c] = std::max(raw - ideal, 0.0); }
  if (hasPrevG && !st.empty()) {
    const Path pg = routeAhead(prevG, s);
    for (size_t c = 0; c < nc; c++) if (sameClass(routeAhead(cands[c]->g, s), pg, st)) w[c] = C_CONS;
  }
  int bi = 0; double bs = w[0] * Jv[0];
  for (size_t c = 1; c < nc; c++) { const double sc = w[c] * Jv[c]; if (sc < bs) { bs = sc; bi = static_cast<int>(c); } }
  prevG = cands[bi]->g; hasPrevG = true;
  return bi;
}

}  // namespace vigie
