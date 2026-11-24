// Ampère Académie pour Windows : l'application web (dossier www) dans une fenêtre WebView2.
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

[assembly: System.Reflection.AssemblyTitle("Ampère Académie")]
[assembly: System.Reflection.AssemblyProduct("Ampère Académie")]
[assembly: System.Reflection.AssemblyDescription("Schémas électriques, coffrets, automates : de zéro au niveau ingénieur")]
[assembly: System.Reflection.AssemblyVersion("0.1.0.0")]

namespace AmpereAcademie
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }

    class MainForm : Form
    {
        // Origine https stable : la progression (localStorage) est conservée d'un lancement à l'autre.
        const string Host = "ampere-academie.local";
        const string AppName = "Ampère Académie";
        static readonly string DataDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "AmpereAcademie");
        static readonly string BoundsFile = Path.Combine(DataDir, "fenetre.txt");

        readonly WebView2 web = new WebView2();

        public MainForm()
        {
            Text = AppName;
            Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            BackColor = Color.FromArgb(0x0a, 0x0d, 0x12);
            MinimumSize = new Size(420, 560);
            StartPosition = FormStartPosition.CenterScreen;
            Size = new Size(1360, 880);
            LoadBounds();

            web.Dock = DockStyle.Fill;
            web.DefaultBackgroundColor = BackColor;
            Controls.Add(web);
            Load += async (s, e) =>
            {
                try
                {
                    Directory.CreateDirectory(DataDir);
                    var env = await CoreWebView2Environment.CreateAsync(null, Path.Combine(DataDir, "WebView2"));
                    await web.EnsureCoreWebView2Async(env);
                }
                catch (WebView2RuntimeNotFoundException)
                {
                    if (MessageBox.Show(this,
                        AppName + " a besoin du composant Microsoft Edge WebView2 (déjà présent sur la plupart des PC Windows 10 et 11).\n\nOuvrir la page de téléchargement ?",
                        AppName, MessageBoxButtons.YesNo, MessageBoxIcon.Warning) == DialogResult.Yes)
                        Process.Start("https://go.microsoft.com/fwlink/p/?LinkId=2124703");
                    Close();
                    return;
                }
                catch (Exception ex)
                {
                    MessageBox.Show(this, AppName + " n'a pas pu démarrer :\n\n" + ex.Message, AppName, MessageBoxButtons.OK, MessageBoxIcon.Error);
                    Close();
                    return;
                }
                Setup(web.CoreWebView2);
            };
            FormClosing += (s, e) => SaveBounds();
        }

        void Setup(CoreWebView2 wv)
        {
            string www = Path.Combine(Path.GetDirectoryName(Application.ExecutablePath), "www");
            wv.SetVirtualHostNameToFolderMapping(Host, www, CoreWebView2HostResourceAccessKind.Deny);
            wv.Settings.AreDevToolsEnabled = false;
            wv.Settings.IsStatusBarEnabled = false;
            wv.Settings.IsPasswordAutosaveEnabled = false;
            wv.Settings.IsGeneralAutofillEnabled = false;
            wv.Settings.AreDefaultContextMenusEnabled = false;

            wv.DocumentTitleChanged += (s, e) => Text = string.IsNullOrEmpty(wv.DocumentTitle) ? AppName : wv.DocumentTitle;

            // Liens externes : navigateur par défaut.
            wv.NewWindowRequested += (s, e) => { e.Handled = true; OpenExternal(e.Uri); };
            wv.NavigationStarting += (s, e) =>
            {
                Uri u;
                if (Uri.TryCreate(e.Uri, UriKind.Absolute, out u) && u.Host != Host && (u.Scheme == "http" || u.Scheme == "https"))
                {
                    e.Cancel = true;
                    OpenExternal(e.Uri);
                }
            };

            // Export de la progression : boîte de dialogue Windows.
            wv.DownloadStarting += (s, e) =>
            {
                var deferral = e.GetDeferral();
                BeginInvoke(new Action(() =>
                {
                    try
                    {
                        using (var dlg = new SaveFileDialog())
                        {
                            dlg.FileName = Path.GetFileName(e.ResultFilePath);
                            dlg.Filter = "Progression (*.json)|*.json|Tous les fichiers|*.*";
                            dlg.InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
                            if (dlg.ShowDialog(this) == DialogResult.OK) { e.ResultFilePath = dlg.FileName; e.Handled = true; }
                            else e.Cancel = true;
                        }
                    }
                    finally { deferral.Complete(); }
                }));
            };

            wv.Navigate("https://" + Host + "/index.html");
        }

        static void OpenExternal(string uri)
        {
            try { Process.Start(new ProcessStartInfo(uri) { UseShellExecute = true }); } catch { }
        }

        void LoadBounds()
        {
            try
            {
                var p = File.ReadAllText(BoundsFile).Split(',');
                var r = new Rectangle(int.Parse(p[0]), int.Parse(p[1]), int.Parse(p[2]), int.Parse(p[3]));
                foreach (var sc in Screen.AllScreens)
                    if (sc.WorkingArea.IntersectsWith(r)) { StartPosition = FormStartPosition.Manual; Bounds = r; break; }
                if (p.Length > 4 && p[4] == "max") WindowState = FormWindowState.Maximized;
            }
            catch { }
        }

        void SaveBounds()
        {
            try
            {
                Directory.CreateDirectory(DataDir);
                var r = WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
                File.WriteAllText(BoundsFile, r.X + "," + r.Y + "," + r.Width + "," + r.Height + "," + (WindowState == FormWindowState.Maximized ? "max" : "normal"));
            }
            catch { }
        }
    }
}
