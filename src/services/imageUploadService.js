const IMGBB_KEY_STORAGE = 'airpg_imgbb_api_key';

export function getImgbbApiKey() {
  return localStorage.getItem(IMGBB_KEY_STORAGE) || '';
}

export function setImgbbApiKey(key) {
  if (!key) {
    localStorage.removeItem(IMGBB_KEY_STORAGE);
  } else {
    localStorage.setItem(IMGBB_KEY_STORAGE, key.trim());
  }
}

/**
 * Comprime imagens estáticas via Canvas.
 * IMPORTANTE: GIFs são retornados intactos para não perderem a animação.
 */
async function prepareImageBlob(blob, maxWidth = 1080, quality = 0.85) {
  if (blob.type === 'image/gif') {
    return blob;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (compressed) => resolve(compressed || blob),
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };

    img.src = url;
  });
}

/**
 * Envia um File ou Blob para o ImgBB e retorna a URL direta da imagem/GIF.
 */
export async function uploadBlobToImgbb(fileOrBlob) {
  const apiKey = getImgbbApiKey();
  if (!apiKey) {
    throw new Error('Chave API do ImgBB não configurada. Adicione nas Configurações (🔑).');
  }

  const processedBlob = await prepareImageBlob(fileOrBlob);
  const formData = new FormData();
  formData.append('image', processedBlob);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok || !data?.success) {
    throw new Error(data?.error?.message || 'Falha ao enviar imagem para o ImgBB.');
  }

  return data.data.url;
}

/**
 * Recebe uma URL externa (copiada de outro site no celular).
 * Tenta baixar o arquivo e re-hospedar no ImgBB (via fetch direto ou proxy CORS).
 * Se o servidor bloquear totalmente o download, retorna a própria URL original como fallback.
 */
export async function importImageFromUrl(rawUrl) {
  const cleanUrl = rawUrl.trim();
  if (!cleanUrl.startsWith('http')) {
    throw new Error('URL inválida. Cole um link começando com http:// ou https://');
  }

  const apiKey = getImgbbApiKey();
  if (!apiKey) {
    // Sem chave ImgBB, usa o link direto mesmo
    return cleanUrl;
  }

  const proxies = [
    cleanUrl,
    `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`
  ];

  for (const target of proxies) {
    try {
      const res = await fetch(target);
      if (!res.ok) continue;
      const blob = await res.blob();
      if (blob && blob.type.startsWith('image/')) {
        return await uploadBlobToImgbb(blob);
      }
    } catch {
      // Tenta o próximo fallback
    }
  }

  // Fallback seguro: retorna a URL original caso o site de origem tenha proteção estrita
  return cleanUrl;
}