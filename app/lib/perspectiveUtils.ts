export function getPerspectiveTransform(src: number[], dst: number[]) {
    const a: number[][] = [];
    for (let i = 0; i < 4; i++) {
        const x = src[i * 2];
        const y = src[i * 2 + 1];
        const u = dst[i * 2];
        const v = dst[i * 2 + 1];
        a.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
        a.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    }

    const b = [
        dst[0], dst[1], dst[2], dst[3],
        dst[4], dst[5], dst[6], dst[7]
    ];

    const h = solve(a, b);
    return [...h, 1];
}

function solve(A: number[][], b: number[]) {
    const n = 8;
    for (let i = 0; i < n; i++) {
        let max = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(A[j][i]) > Math.abs(A[max][i])) max = j;
        }
        [A[i], A[max]] = [A[max], A[i]];
        [b[i], b[max]] = [b[max], b[i]];

        for (let j = i + 1; j < n; j++) {
            const f = A[j][i] / A[i][i];
            b[j] -= f * b[i];
            for (let k = i; k < n; k++) A[j][k] -= f * A[i][k];
        }
    }

    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let s = 0;
        for (let j = i + 1; j < n; j++) s += A[i][j] * x[j];
        x[i] = (b[i] - s) / A[i][i];
    }
    return x;
}

export async function getPerspectiveCroppedImg(
    imageSrc: string,
    points: { x: number, y: number }[], // tl, tr, br, bl in natural pixels
    destWidth: number,
    destHeight: number
): Promise<Blob | null> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageSrc;
    });

    const destWidthInt = Math.round(destWidth);
    const destHeightInt = Math.round(destHeight);
    const canvas = document.createElement("canvas");
    canvas.width = destWidthInt;
    canvas.height = destHeightInt;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const srcArr = [
        points[0].x, points[0].y,
        points[1].x, points[1].y,
        points[2].x, points[2].y,
        points[3].x, points[3].y
    ];
    const dstArr = [
        0, 0,
        destWidthInt, 0,
        destWidthInt, destHeightInt,
        0, destHeightInt
    ];

    const hInv = getPerspectiveTransform(dstArr, srcArr);

    const imgCanvas = document.createElement("canvas");
    imgCanvas.width = image.width;
    imgCanvas.height = image.height;
    const imgCtx = imgCanvas.getContext("2d");
    if (!imgCtx) return null;
    imgCtx.drawImage(image, 0, 0);
    const srcData = imgCtx.getImageData(0, 0, image.width, image.height).data;

    const imageData = ctx.createImageData(destWidthInt, destHeightInt);
    const dstData = imageData.data;

    const h0 = hInv[0], h1 = hInv[1], h2 = hInv[2],
        h3 = hInv[3], h4 = hInv[4], h5 = hInv[5],
        h6 = hInv[6], h7 = hInv[7], h8 = hInv[8];

    const imgW = image.width;
    const imgH = image.height;

    for (let y = 0; y < destHeightInt; y++) {
        const rowOffset = y * destWidthInt;
        for (let x = 0; x < destWidthInt; x++) {
            const z = h6 * x + h7 * y + h8;
            const px = (h0 * x + h1 * y + h2) / z;
            const py = (h3 * x + h4 * y + h5) / z;

            if (px >= 0 && px < imgW && py >= 0 && py < imgH) {
                const ix = (px | 0);
                const iy = (py | 0);
                const posStr = (iy * imgW + ix) << 2;
                const posDst = (rowOffset + x) << 2;

                dstData[posDst] = srcData[posStr];
                dstData[posDst + 1] = srcData[posStr + 1];
                dstData[posDst + 2] = srcData[posStr + 2];
                dstData[posDst + 3] = srcData[posStr + 3];
            }
        }
    }
    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve) => {
        canvas.toBlob((file) => resolve(file), "image/jpeg", 0.9);
    });
}
