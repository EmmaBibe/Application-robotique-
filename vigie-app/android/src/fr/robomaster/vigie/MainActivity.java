package fr.robomaster.vigie;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Coquille Android de l'application VIGIE : affiche l'application web embarquée dans les assets,
 * servie sous https://appassets.androidplatform.net/ pour que les modules JavaScript, les fils de calcul
 * et le stockage local fonctionnent comme sur un site. Aucun accès réseau n'est nécessaire.
 */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final int ENREGISTRER = 42;
    private WebView web;
    private String aEnregistrer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setUserAgentString(s.getUserAgentString() + " VigieApp");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String path = u.getPath();
                if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
                try {
                    InputStream in = getAssets().open("www" + path);
                    return new WebResourceResponse(mime(path), "utf-8", in);
                } catch (Exception e) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, null);
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });

        web.addJavascriptInterface(new Pont(), "VigieNative");

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl("https://" + HOST + "/index.html");
    }

    /** Pont appelé par la page : ouvre le sélecteur de fichier du système pour enregistrer un export. */
    private class Pont {
        @JavascriptInterface
        public void enregistrer(final String nom, final String texte) {
            runOnUiThread(() -> {
                aEnregistrer = texte;
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType(nom.endsWith(".csv") ? "text/csv" : "text/plain");
                i.putExtra(Intent.EXTRA_TITLE, nom);
                try { startActivityForResult(i, ENREGISTRER); } catch (Exception e) { repondre(false); }
            });
        }
    }

    @Override
    protected void onActivityResult(int code, int resultat, Intent data) {
        super.onActivityResult(code, resultat, data);
        if (code != ENREGISTRER) return;
        boolean ok = false;
        if (resultat == RESULT_OK && data != null && data.getData() != null && aEnregistrer != null) {
            try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                out.write(new byte[] { (byte) 0xEF, (byte) 0xBB, (byte) 0xBF });
                out.write(aEnregistrer.getBytes(StandardCharsets.UTF_8));
                ok = true;
            } catch (Exception ignored) { }
        }
        aEnregistrer = null;
        repondre(ok);
    }

    private void repondre(boolean ok) {
        web.evaluateJavascript("window.__vigieSaved && window.__vigieSaved(" + ok + ")", null);
    }

    private static String mime(String p) {
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js") || p.endsWith(".mjs")) return "text/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".json") || p.endsWith(".webmanifest")) return "application/json";
        return "application/octet-stream";
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
