from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
import os
import json

# === SETTINGS ===
password = ""
input_folder = Path(__file__).parent / "Photos"
output_folder = Path(__file__).parent / "EncryptedPhotos"
salt = b"static-salt-or-something-obscure"
iterations = 100_000
index_filename = "index.json"

# === ENCRYPTION ===

def derive_key(password: str, salt: bytes, iterations: int = 100_000) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=iterations,
    )
    return kdf.derive(password.encode())

def encrypt_file(in_path: Path, out_path: Path, key: bytes):
    data = in_path.read_bytes()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    encrypted = nonce + aesgcm.encrypt(nonce, data, None)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(encrypted)

def encrypt_folder_recursive(input_folder: Path, output_folder: Path, key: bytes):
    count = 0
    for item in input_folder.rglob("*"):
        if item.is_dir():
            (output_folder / item.relative_to(input_folder)).mkdir(parents=True, exist_ok=True)
        elif item.suffix.lower() in [".jpg", ".jpeg", ".png"]:
            relative_path = item.relative_to(input_folder)
            out_file = output_folder / relative_path.with_suffix(relative_path.suffix + ".bin")
            print(f"🔐 Encrypting {item} → {out_file}")
            encrypt_file(item, out_file, key)
            count += 1
        else:
            print(f"⚠️ Skipping non-image file: {item}")
    print(f"✅ Done. Total files encrypted: {count}")

# === JSON INDEX CREATION ===

def generate_index_jsons(folder: Path):
    for dirpath in folder.rglob("*"):
        if dirpath.is_dir():
            bin_files = [f.name for f in dirpath.glob("*.bin")]
            if bin_files:
                index_path = dirpath / index_filename
                with index_path.open("w", encoding="utf-8") as f:
                    json.dump(bin_files, f, indent=2)
                print(f"📄 Created index for: {dirpath}")

    # Root-level .bin files
    root_bin_files = [f.name for f in folder.glob("*.bin")]
    if root_bin_files:
        index_path = folder / index_filename
        with index_path.open("w", encoding="utf-8") as f:
            json.dump(root_bin_files, f, indent=2)
        print(f"📄 Created index for root: {folder}")

def print_sha256_of_password(password: str):
    import hashlib
    hash_bytes = hashlib.sha256(password.encode('utf-8')).digest()
    hex_key = hash_bytes.hex()
    print("\n🔑 SHA-256 of password:", hex_key, "\n")

# === MAIN ===

if __name__ == "__main__":
    if not input_folder.exists():
        print(f"❌ ERROR: Input folder {input_folder} does not exist.")
        exit()

    if not any(input_folder.rglob("*")):
        print(f"⚠️ WARNING: Input folder {input_folder} is empty.")

    # Clean up old encrypted files to avoid stale .bin files
    if output_folder.exists():
        import shutil
        print(f"🧹 Cleaning old encrypted folder: {output_folder}")
        shutil.rmtree(output_folder)

    key = derive_key(password, salt, iterations)
    encrypt_folder_recursive(input_folder, output_folder, key)
    
    # ✅ Now generate index.json for each subfolder
    generate_index_jsons(output_folder)
    print_sha256_of_password(password)

    print("🎉 Encryption and indexing complete.")