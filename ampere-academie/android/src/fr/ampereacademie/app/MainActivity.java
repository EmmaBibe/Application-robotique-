package fr.ampereacademie.app;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Ampère Académie : l'application web (assets/www) dans une WebView.
 * Servie depuis https://appassets.androidplatform.net : origine sécurisée et stable,
 * pour que la progression (localStorage) soit conservée d'un lancement à l'autre.
 */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/index.html";
    private static final String DIR = "Ampere Academie";
    private static final int REQ_FILE = 1;
    private static final int REQ_PERM = 2;

    // La WebView ignore les téléchargements blob: (export de la progression) : on les confie à Android.
    private static final String HOOK =
        "(function(){if(window.__aaHook)return;window.__aaHook=1;" +
        "function dl(a){var h=a.href||'';if(!a.hasAttribute('download')||(h.indexOf('blob:')&&h.indexOf('data:')))return false;" +
        "var n=a.getAttribute('download')||'fichier';" +
        "fetch(h).then(function(r){return r.blob();}).then(function(b){var f=new FileReader();" +
        "f.onload=function(){var s=f.result;AmpereAndroid.save(n,b.type||'application/octet-stream',s.substring(s.indexOf(',')+1));};" +
        "f.readAsDataURL(b);}).catch(function(e){AmpereAndroid.error(String(e));});return true;}" +
        "var oc=HTMLAnchorElement.prototype.click;" +
        "HTMLAnchorElement.prototype.click=function(){if(!dl(this))return oc.apply(this,arguments);};" +
        "document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[download]');" +
        "if(a&&dl(a))e.preventDefault();},true);})();";

    private static final Map<String, String> MIME = new HashMap<>();
    static {
        MIME.put("html", "text/html");
        MIME.put("js", "text/javascript");
        MIME.put("css", "text/css");
        MIME.put("json", "application/json");
        MIME.put("webmanifest", "application/manifest+json");
        MIME.put("png", "image/png");
        MIME.put("svg", "image/svg+xml");
    }

    private WebView web;
    private ValueCallback<Uri[]> filePick;
    private String[] pendingSave;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setTextZoom(100);
        s.setMediaPlaybackRequiresUserGesture(false);

        web.addJavascriptInterface(new Bridge(), "AmpereAndroid");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return asset(r.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (ActivityNotFoundException ignored) {
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                v.evaluateJavascript(HOOK, null);
            }
        });

        // Le WebChromeClient active les boîtes de dialogue et le choix de fichier (import de progression).
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (filePick != null) filePick.onReceiveValue(null);
                filePick = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                try {
                    startActivityForResult(Intent.createChooser(i, "Importer une progression"), REQ_FILE);
                } catch (ActivityNotFoundException e) {
                    filePick = null;
                    return false;
                }
                return true;
            }
        });

        if (state == null || web.restoreState(state) == null) web.loadUrl(START);
    }

    private WebResourceResponse asset(Uri u) {
        if (!HOST.equals(u.getHost())) return null;
        String path = u.getPath();
        if (path == null || path.equals("/")) path = "/index.html";
        String ext = path.substring(path.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        String mime = MIME.containsKey(ext) ? MIME.get(ext) : "application/octet-stream";
        try {
            InputStream in = getAssets().open("www" + path);
            return new WebResourceResponse(mime, "utf-8", in);
        } catch (IOException e) {
            return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found",
                new HashMap<String, String>(), new ByteArrayInputStream(new byte[0]));
        }
    }

    private class Bridge {
        @JavascriptInterface
        public void save(String name, String mime, String b64) {
            if (Build.VERSION.SDK_INT < 29
                && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                pendingSave = new String[]{name, mime, b64};
                runOnUiThread(() -> requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, REQ_PERM));
                return;
            }
            write(name, mime, b64);
        }

        @JavascriptInterface
        public void error(String msg) {
            toast("Enregistrement impossible : " + msg);
        }
    }

    private void write(String name, String mime, String b64) {
        name = name.replaceAll("[\\\\/:*?\"<>|]", "_");
        try {
            byte[] data = Base64.decode(b64, Base64.DEFAULT);
            if (Build.VERSION.SDK_INT >= 29) {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Downloads.DISPLAY_NAME, name);
                cv.put(MediaStore.Downloads.MIME_TYPE, mime);
                cv.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/" + DIR);
                Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                if (uri == null) throw new IOException("MediaStore");
                try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                    out.write(data);
                }
            } else {
                File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), DIR);
                if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException(dir.getPath());
                File f = new File(dir, name);
                int dot = name.lastIndexOf('.');
                String base = dot > 0 ? name.substring(0, dot) : name, ext = dot > 0 ? name.substring(dot) : "";
                for (int n = 1; f.exists(); n++) f = new File(dir, base + " (" + n + ")" + ext);
                try (OutputStream out = new FileOutputStream(f)) {
                    out.write(data);
                }
                MediaScannerConnection.scanFile(this, new String[]{f.getPath()}, new String[]{mime}, null);
            }
            toast("Enregistré dans Téléchargements/" + DIR + " : " + name);
        } catch (Exception e) {
            toast("Enregistrement impossible : " + e.getMessage());
        }
    }

    private void toast(String msg) {
        runOnUiThread(() -> Toast.makeText(this, msg, Toast.LENGTH_LONG).show());
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] res) {
        if (code != REQ_PERM || pendingSave == null) return;
        String[] p = pendingSave;
        pendingSave = null;
        if (res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED) write(p[0], p[1], p[2]);
        else toast("Permission refusée : impossible d'enregistrer le fichier");
    }

    @Override
    protected void onActivityResult(int code, int result, Intent data) {
        if (code == REQ_FILE && filePick != null) {
            filePick.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
            filePick = null;
            return;
        }
        super.onActivityResult(code, result, data);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }
}
