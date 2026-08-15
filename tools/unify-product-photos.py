"""
Унификация продуктовых фото Nutralux.

Исходники в images/*.jpg сняты на разных фонах (зелень, еда, дерево, боке),
из-за чего сетка каталога выглядела как маркетплейс. Скрипт вырезает продукт
нейросетью и ставит его на единый фирменный фон с мягкой контактной тенью.
Оригиналы не изменяются — результат пишется в images/products/.

Запуск:
    pip install onnxruntime pillow numpy scipy
    curl -L -o isnet.onnx \
      https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx
    python3 tools/unify-product-photos.py

Модель (~170 МБ) в репозиторий не коммитится, её нужно скачать рядом со скриптом.
"""

import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

SRC = Path.home() / "Desktop/Nutralux/images"
OUT = SRC / "products"
MODEL = Path(__file__).with_name("isnet.onnx")

# Кадры, где посторонний предмет вплотную примыкает к бутылке: обе модели
# считают их одним объектом, поэтому границы продукта заданы руками
# (доли от размера кадра: left, top, right, bottom).
# Зоны, которые вычитаются из маски: у Omega-3 капсулы нависают над плечом
# бутылки, и одной рамкой их не отделить, не срезав крышку.
EXCLUDE = {
    "omega-3.jpg": [(0.10, 0.10, 0.298, 0.33), (0.60, 0.10, 0.80, 0.22)],
}

MANUAL_BOX = {
    "omega-3.jpg": (0.245, 0.125, 0.663, 0.90),
    "probiotic.jpg": (0.235, 0.09, 0.695, 0.91),
    "spirulina.jpg": (0.235, 0.12, 0.675, 0.96),
    "st-johns-wort-parsley.jpg": (0.24, 0.08, 0.80, 0.90),
}

SIZE = 1200          # финальный кадр, квадрат
PRODUCT_H = 0.74     # доля высоты кадра под продукт
BASELINE = 0.90      # где стоит «пол» (низ продукта)

TOP = (247, 245, 240)
BOTTOM = (236, 232, 223)

MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def make_background() -> Image.Image:
    """Вертикальный градиент + лёгкое световое пятно по центру."""
    grad = Image.new("RGB", (1, SIZE))
    for y in range(SIZE):
        t = y / (SIZE - 1)
        grad.putpixel((0, y), tuple(int(TOP[i] + (BOTTOM[i] - TOP[i]) * t) for i in range(3)))
    bg = grad.resize((SIZE, SIZE), Image.BILINEAR)

    glow = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(glow).ellipse(
        [SIZE * 0.16, SIZE * 0.04, SIZE * 0.84, SIZE * 0.72], fill=42
    )
    glow = glow.filter(ImageFilter.GaussianBlur(SIZE * 0.13))
    return Image.composite(Image.new("RGB", (SIZE, SIZE), (255, 253, 250)), bg, glow)


def segment(session: ort.InferenceSession, img: Image.Image) -> Image.Image:
    """Маска объекта в размере исходника."""
    inp = img.convert("RGB").resize((1024, 1024), Image.LANCZOS)
    arr = np.asarray(inp, dtype=np.float32) / 255.0
    arr = (arr - 0.5)
    arr = arr.transpose(2, 0, 1)[None].astype(np.float32)

    name = session.get_inputs()[0].name
    pred = session.run(None, {name: arr})[0][0, 0]

    lo, hi = float(pred.min()), float(pred.max())
    pred = (pred - lo) / (hi - lo + 1e-8)

    mask = Image.fromarray((pred * 255).astype(np.uint8), mode="L")
    return mask.resize(img.size, Image.LANCZOS)


def refine(mask: Image.Image) -> Image.Image:
    """
    Жёсткий порог + только главный связный объект.

    U2Net уверенно находит бутылку, но заодно цепляет куски фона, которые
    её касаются (капсула у omega-3, тарелка у probiotic). Оставляем самую
    крупную связную область и заполняем внутренние дырки.
    """
    a = np.asarray(mask, dtype=np.float32) / 255.0
    a = np.clip((a - 0.50) / 0.30, 0, 1)

    binary = a > 0.5

    # Размыкание рвёт узкие перемычки к прилипшему фону (капсула у omega-3,
    # тарелка у probiotic), после чего лишнее отсекается как отдельный объект.
    radius = max(3, int(min(binary.shape) * 0.016))
    yy, xx = np.ogrid[-radius:radius + 1, -radius:radius + 1]
    disk = xx ** 2 + yy ** 2 <= radius ** 2

    core = ndimage.binary_opening(binary, structure=disk)
    if core.any():
        labels, count = ndimage.label(core)
        if count > 1:
            sizes = ndimage.sum(core, labels, range(1, count + 1))
            core = labels == int(np.argmax(sizes)) + 1
        # возвращаем объекту исходную толщину, но не даём выйти за его границы
        grown = ndimage.binary_dilation(core, structure=disk, iterations=2)
        binary = binary & grown
    else:
        labels, count = ndimage.label(binary)
        if count > 1:
            sizes = ndimage.sum(binary, labels, range(1, count + 1))
            binary = labels == int(np.argmax(sizes)) + 1

    binary = ndimage.binary_fill_holes(binary)
    a = np.minimum(a, binary.astype(np.float32))
    a = np.maximum(a, ndimage.binary_erosion(binary, structure=disk).astype(np.float32))

    out = Image.fromarray((a * 255).astype(np.uint8), mode="L")
    return out.filter(ImageFilter.GaussianBlur(0.9))


def compose(img: Image.Image, mask: Image.Image) -> Image.Image:
    cut = img.convert("RGBA")
    cut.putalpha(mask)

    bbox = mask.point(lambda v: 255 if v > 40 else 0).getbbox()
    if bbox is None:
        raise ValueError("объект не найден")
    cut = cut.crop(bbox)

    scale = (SIZE * PRODUCT_H) / cut.height
    if cut.width * scale > SIZE * 0.86:            # широкие коробки не должны упираться в края
        scale = (SIZE * 0.86) / cut.width
    new = (max(1, round(cut.width * scale)), max(1, round(cut.height * scale)))
    cut = cut.resize(new, Image.LANCZOS)

    canvas = make_background()
    x = (SIZE - cut.width) // 2
    y = int(SIZE * BASELINE) - cut.height

    # контактная тень
    shadow = Image.new("L", (SIZE, SIZE), 0)
    sw, sh = cut.width * 0.76, SIZE * 0.035
    cx, cy = SIZE / 2, int(SIZE * BASELINE)
    ImageDraw.Draw(shadow).ellipse(
        [cx - sw / 2, cy - sh / 2, cx + sw / 2, cy + sh / 2], fill=88
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(SIZE * 0.022))
    canvas = Image.composite(Image.new("RGB", (SIZE, SIZE), (196, 190, 178)), canvas, shadow)

    canvas.paste(cut, (x, y), cut)
    return canvas


def main() -> int:
    if not MODEL.exists():
        print("нет модели u2net.onnx")
        return 1

    OUT.mkdir(exist_ok=True)
    session = ort.InferenceSession(str(MODEL), providers=["CPUExecutionProvider"])

    files = sorted(
        p for p in SRC.glob("*.jpg")
        if p.name not in {"og-image.jpg", "about-collagen.jpg"}
    )

    for path in files:
        img = Image.open(path)
        try:
            mask = segment(session, img)
            box = MANUAL_BOX.get(path.name)
            if box:
                w, h = img.size
                keep = Image.new("L", img.size, 0)
                ImageDraw.Draw(keep).rectangle(
                    [box[0] * w, box[1] * h, box[2] * w, box[3] * h], fill=255
                )
                mask = Image.fromarray(
                    np.minimum(np.asarray(mask), np.asarray(keep)).astype(np.uint8), "L"
                )
            for zone in EXCLUDE.get(path.name, []):
                w, h = img.size
                cut = Image.new("L", img.size, 255)
                ImageDraw.Draw(cut).rectangle(
                    [zone[0] * w, zone[1] * h, zone[2] * w, zone[3] * h], fill=0
                )
                mask = Image.fromarray(
                    np.minimum(np.asarray(mask), np.asarray(cut)).astype(np.uint8), "L"
                )
            result = compose(img, refine(mask))
        except ValueError as err:
            print(f"  ПРОПУЩЕНО {path.name}: {err}")
            continue
        result.save(OUT / path.name, quality=90, optimize=True)
        print(f"  ok {path.name}")

    print(f"готово: {len(list(OUT.glob('*.jpg')))} файлов в {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
