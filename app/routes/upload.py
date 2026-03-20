"""
GET LOST DZ — Upload Blueprint
/api/upload — Cloudinary image upload
Accepts base64 images, returns Cloudinary URL.
"""
import cloudinary
import cloudinary.uploader
from flask import Blueprint, request, jsonify, g
from app.auth import token_required
from app.config import CLOUDINARY_CLOUD, CLOUDINARY_KEY, CLOUDINARY_SECRET

bp = Blueprint("upload", __name__, url_prefix="/api")

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD,
    api_key=CLOUDINARY_KEY,
    api_secret=CLOUDINARY_SECRET,
    secure=True
)

# Max sizes per type
UPLOAD_LIMITS = {
    "avatar":  2_000_000,   # 2MB
    "logo":    2_000_000,
    "offer":   5_000_000,   # 5MB
    "review":  3_000_000,
}

# Cloudinary transformations per type
TRANSFORMS = {
    "avatar": {"width": 400, "height": 400, "crop": "thumb", "gravity": "face", "quality": "auto", "format": "jpg"},
    "logo":   {"width": 400, "height": 400, "crop": "thumb", "quality": "auto", "format": "jpg"},
    "offer":  {"quality": "auto", "format": "jpg"},
    "review": {"quality": "auto", "format": "jpg"},
}


@bp.route("/upload", methods=["POST"])
@token_required
def upload_image():
    """
    Upload a base64 image to Cloudinary.
    Body: { "image": "data:image/...;base64,...", "type": "avatar|logo|offer|review" }
    Returns: { "url": "https://res.cloudinary.com/..." }
    """
    d = request.json or {}
    image = d.get("image", "")
    img_type = d.get("type", "offer")

    if not image:
        return jsonify({"error": "Image requise"}), 400

    if img_type not in UPLOAD_LIMITS:
        return jsonify({"error": "Type invalide"}), 400

    # Check size (rough base64 size)
    if len(image) > UPLOAD_LIMITS[img_type] * 1.37:  # base64 overhead ~37%
        max_mb = UPLOAD_LIMITS[img_type] // 1_000_000
        return jsonify({"error": f"Image trop grande (max {max_mb}MB)"}), 400

    try:
        folder = f"getlostdz/{img_type}s"
        upload_params = {
            "folder": folder,
            "resource_type": "image",
            "format": "jpg",  # Force convert HEIC/WEBP/PNG to JPG
        }
        # Avatar/logo: crop to square
        if img_type in ("avatar", "logo"):
            upload_params["transformation"] = [
                {"width": 400, "height": 400, "crop": "thumb", "gravity": "face"}
            ]
        result = cloudinary.uploader.upload(image, **upload_params)
        url = result.get("secure_url", "")
        return jsonify({"url": url})
    except Exception as e:
        print(f"[cloudinary] upload error: {e}")
        return jsonify({"error": "Erreur d'upload, réessayez"}), 500


@bp.route("/upload/multiple", methods=["POST"])
@token_required
def upload_multiple():
    """
    Upload multiple base64 images.
    Body: { "images": ["data:image/...;base64,...", ...], "type": "offer" }
    Returns: { "urls": ["https://...", ...] }
    """
    d = request.json or {}
    images = d.get("images", [])
    img_type = d.get("type", "offer")

    if not images or len(images) > 10:
        return jsonify({"error": "1 à 10 images maximum"}), 400

    urls = []
    folder = f"getlostdz/{img_type}s"
    transform = TRANSFORMS.get(img_type)

    for img in images:
        if len(img) > UPLOAD_LIMITS.get(img_type, 5_000_000) * 1.37:
            continue
        try:
            result = cloudinary.uploader.upload(
                img, folder=folder, resource_type="image", format="jpg"
            )
            urls.append(result.get("secure_url", ""))
        except Exception as e:
            print(f"[cloudinary] multi upload error: {e}")

    return jsonify({"urls": urls})
