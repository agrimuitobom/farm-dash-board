"""設定（.env）の読み込み

.env は house-hub/ に置く（.env.example をコピーして作る）。.env は Git に入れない。
"""
import os
from dataclasses import dataclass
from pathlib import Path

HUB_DIR = Path(__file__).resolve().parent.parent


def read_env_file(path):
    """KEY=VALUE の行を読む（# で始まる行と空行は無視。値の前後の引用符は外す）"""
    values = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key.strip()] = value
    return values


@dataclass
class Config:
    firebase_project_id: str
    firebase_api_key: str
    firebase_email: str
    firebase_password: str
    poll_interval_seconds: int
    db_path: Path
    server_host: str
    server_port: int
    log_level: str


def load_config(env_path=None):
    """.env と環境変数から設定を作る（環境変数が優先）"""
    file_values = read_env_file(Path(env_path) if env_path else HUB_DIR / ".env")

    def get(key, default=""):
        return os.environ.get(key, file_values.get(key, default))

    return Config(
        firebase_project_id=get("FIREBASE_PROJECT_ID", "farm-dashboard-95875"),
        # ダッシュボードの src/firebase.js と同じ公開値（秘密情報ではない）
        firebase_api_key=get("FIREBASE_API_KEY", "AIzaSyAHduV83j0eSdJQIvUGRqmmyN6sH0b4L0k"),
        firebase_email=get("FIREBASE_EMAIL", "display@farm-dashboard.local"),
        firebase_password=get("FIREBASE_PASSWORD"),
        poll_interval_seconds=int(get("POLL_INTERVAL_SECONDS", "300")),
        db_path=Path(os.path.expanduser(get("DB_PATH", "~/house-hub/data/hub.db"))),
        server_host=get("SERVER_HOST", "0.0.0.0"),
        server_port=int(get("SERVER_PORT", "8080")),
        log_level=get("LOG_LEVEL", "INFO"),
    )
