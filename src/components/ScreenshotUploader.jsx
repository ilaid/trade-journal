import { useEffect, useRef, useState } from "react";
import { sb } from "../lib/supabase";
import { listScreenshots, uploadScreenshot, deleteScreenshot, getSignedUrl, validateScreenshotFile } from "../lib/screenshots";

export default function ScreenshotUploader({ tradeId }) {
  const [shots, setShots] = useState([]);
  const [urls, setUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const refresh = async () => {
    const rows = await listScreenshots(tradeId);
    setShots(rows);
    const entries = await Promise.all(
      rows.map(async (s) => {
        try {
          return [s.id, await getSignedUrl(s.storage_path)];
        } catch {
          return [s.id, null];
        }
      })
    );
    setUrls(Object.fromEntries(entries));
  };

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeId]);

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!files.length) return;
    setError("");
    setUploading(true);
    try {
      const {
        data: { user },
      } = await sb.auth.getUser();
      for (const file of files) {
        const validationError = validateScreenshotFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }
        await uploadScreenshot(user.id, tradeId, file);
      }
      await refresh();
    } catch (e) {
      setError(e.message || "Upload failed");
    }
    setUploading(false);
  };

  const onDelete = async (shot) => {
    await deleteScreenshot(shot);
    setShots((s) => s.filter((x) => x.id !== shot.id));
  };

  if (loading) return <div style={{ fontSize: 11, color: "#94a3b8" }}>Loading screenshots…</div>;

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {shots.map((s) => (
          <div key={s.id} style={{ position: "relative", width: 84, height: 84 }}>
            {urls[s.id] ? (
              <img src={urls[s.id]} alt={s.file_name} style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
            ) : (
              <div style={{ width: 84, height: 84, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f1f5f9" }} />
            )}
            <button
              onClick={() => onDelete(s)}
              style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#fee2e2", border: "1px solid #dc2626", color: "#dc2626", cursor: "pointer", fontSize: 11, lineHeight: 1 }}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{ width: 84, height: 84, borderRadius: 8, border: "1px dashed #e2e8f0", background: "none", color: "#64748b", cursor: uploading ? "wait" : "pointer", fontSize: 20 }}
        >
          {uploading ? "…" : "+"}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onPick} style={{ display: "none" }} />
      </div>
      {error && <div style={{ fontSize: 11, color: "#dc2626" }}>{error}</div>}
    </div>
  );
}
