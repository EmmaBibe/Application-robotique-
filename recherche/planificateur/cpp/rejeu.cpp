// Rejoue des épisodes enregistrés depuis le portage JavaScript (parite_cpp.mjs) : mêmes entrées, on compare les
// commandes et on mesure le temps de chaque décision en C++.
// Format du fichier, une ligne par élément :
//   EP planificateur graine N NLIBRE retard masquage portee nfixes gx gy
//   S x y r                       (nfixes lignes)
//   STEP t sx sy sth nobs u0 u1   puis nobs lignes « O x y vx vy r mobile id »
//   END
// Sortie : une ligne par épisode, puis une ligne de synthèse.
#include <algorithm>
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <memory>
#include <sstream>
#include <string>

#include "vigie.hpp"

using namespace vigie;

static double pct(std::vector<double> v, double p) {
  if (v.empty()) return 0;
  std::sort(v.begin(), v.end());
  const double x = p * (v.size() - 1); const size_t lo = static_cast<size_t>(x), hi = std::min(v.size() - 1, lo + 1);
  return v[lo] + (v[hi] - v[lo]) * (x - lo);
}

int main(int argc, char** argv) {
  if (argc < 2) { std::cerr << "usage : rejeu fichier [repetitions]\n"; return 2; }
  const int rep = argc > 2 ? std::atoi(argv[2]) : 1;
  std::ifstream in(argv[1]);
  if (!in) { std::cerr << "fichier introuvable\n"; return 2; }
  ensureTable();
  std::string line, tag;
  double worstAll = 0; std::vector<double> allMs; long steps = 0; int episodes = 0;
  std::unique_ptr<Base> pl; std::vector<std::array<double, 3>> stat; Pt goal{};
  std::string kind; int seed = 0, N = 0, NF = 0, lat = 0, occl = 0, nst = 0; double range = 0;
  struct Step { double t; std::array<double, 3> s; std::vector<Obs> obs; double u0, u1; };
  std::vector<Step> ep;
  auto runEpisode = [&]() {
    double worst = 0; std::vector<double> ms; int refreshes = 0; std::vector<double> msRefresh;
    for (int r = 0; r < rep; r++) {
      if (kind == "vigie") pl = std::make_unique<Vigie6>(seed, N, NF); else pl = std::make_unique<DRAMPPI>(seed, N);
      pl->reset(stat, goal); pl->setLatency(lat); pl->setPerception(occl != 0, range);
      for (const auto& st : ep) {
        const auto t0 = std::chrono::steady_clock::now();
        const auto u = pl->act(st.t, st.s, st.obs);
        const double dt = std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - t0).count();
        ms.push_back(dt);
        if (kind == "vigie" && static_cast<Vigie6*>(pl.get())->lastRefreshed) { msRefresh.push_back(dt); if (r == 0) refreshes++; }
        if (r == 0) worst = std::max({worst, std::fabs(u[0] - st.u0), std::fabs(u[1] - st.u1)});
      }
    }
    std::printf("EP %s graine=%d pas=%zu ecart_max=%.3g moy=%.2fms med=%.2fms p95=%.2fms max=%.2fms recalculs=%d max_recalcul=%.2fms\n",
                kind.c_str(), seed, ep.size(), worst, [&] { double s = 0; for (double x : ms) s += x; return ms.empty() ? 0 : s / ms.size(); }(),
                pct(ms, 0.5), pct(ms, 0.95), pct(ms, 1.0), refreshes, pct(msRefresh, 1.0));
    worstAll = std::max(worstAll, worst); allMs.insert(allMs.end(), ms.begin(), ms.end()); steps += ep.size(); episodes++;
  };
  while (std::getline(in, line)) {
    std::istringstream ss(line); ss >> tag;
    if (tag == "EP") { ss >> kind >> seed >> N >> NF >> lat >> occl >> range >> nst >> goal[0] >> goal[1]; stat.clear(); ep.clear(); }
    else if (tag == "S") { std::array<double, 3> c; ss >> c[0] >> c[1] >> c[2]; stat.push_back(c); }
    else if (tag == "STEP") { Step st; int no; ss >> st.t >> st.s[0] >> st.s[1] >> st.s[2] >> no >> st.u0 >> st.u1; st.obs.reserve(no); ep.push_back(st); }
    else if (tag == "O") { Obs o; ss >> o[0] >> o[1] >> o[2] >> o[3] >> o[4] >> o[5] >> o[6]; ep.back().obs.push_back(o); }
    else if (tag == "END") runEpisode();
  }
  double s = 0; for (double x : allMs) s += x;
  std::printf("SYNTHESE episodes=%d decisions=%ld ecart_max=%.3g moy=%.2fms med=%.2fms p95=%.2fms p99=%.2fms max=%.2fms\n",
              episodes, steps, worstAll, allMs.empty() ? 0 : s / allMs.size(), pct(allMs, 0.5), pct(allMs, 0.95), pct(allMs, 0.99), pct(allMs, 1.0));
  return 0;
}
