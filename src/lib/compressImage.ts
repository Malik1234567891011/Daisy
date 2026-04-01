/** Client-side resize/compress before upload (same rules as onboarding). */
export function compressImage(file: File, maxDim = 1200, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      if (width <= maxDim && height <= maxDim && file.size < 2 * 1024 * 1024) {
        resolve(file);
        return;
      }

      if (width > height) {
        if (width > maxDim) {
          height = (height * maxDim) / width;
          width = maxDim;
        }
      } else if (height > maxDim) {
        width = (width * maxDim) / height;
        height = maxDim;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(
            new File([blob!], file.name.replace(/\.\w+$/, ".jpg"), {
              type: "image/jpeg",
            }),
          );
        },
        "image/jpeg",
        quality,
      );
    };
    img.src = URL.createObjectURL(file);
  });
}
