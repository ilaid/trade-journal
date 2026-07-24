// Shrink an image in the browser (keeps the request small/fast) and send it to
// the server for trade-field extraction. Returns the extracted fields.
function fileToResizedDataUrl(file, maxDim = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the image file"));
    };
    img.src = url;
  });
}

// The user's per-level color convention, saved by the Settings card (via the
// settings lib, which mirrors to localStorage). Sent so the model reads the
// right levels even when the user's TradingView colors differ from the default.
function savedColors() {
  try {
    const s = JSON.parse(localStorage.getItem("tj_settings")) || {};
    return s.pos_colors || null;
  } catch {
    return null;
  }
}

export async function extractTradeFromImage(file) {
  const dataUrl = await fileToResizedDataUrl(file);
  const res = await fetch("/api/extract-trade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: dataUrl, mimeType: "image/jpeg", colors: savedColors() }),
  });
  let json;
  try {
    json = await res.json();
  } catch {
    json = {};
  }
  if (!res.ok) throw new Error([json.error, json.detail].filter(Boolean).join(" — ") || `Extraction failed (${res.status})`);
  return json;
}
