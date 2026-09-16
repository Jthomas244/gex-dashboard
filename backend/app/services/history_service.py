import json
import sqlite3
import logging
from pathlib import Path
from datetime import date, datetime, timedelta
from typing import Optional
from ..models.gex import GexResponse

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).parent.parent / "data" / "gex_history.db"

# Sample historical data for development
SAMPLE_SNAPSHOTS = [
    {
        "symbol": "SPY",
        "snapshot_date": (date.today() - timedelta(days=1)).isoformat(),
        "spot_price": 588.20,
        "flip_point": 583.0,
        "regime": "positive",
        "total_gex": 3200000000,
        "strikes_json": json.dumps([
            {"strike": 570, "net_gex": -650000000}, {"strike": 575, "net_gex": -400000000},
            {"strike": 580, "net_gex": -100000000}, {"strike": 583, "net_gex": 50000000},
            {"strike": 585, "net_gex": 300000000}, {"strike": 588, "net_gex": 800000000},
            {"strike": 590, "net_gex": 1100000000}, {"strike": 595, "net_gex": 600000000},
            {"strike": 600, "net_gex": 400000000}, {"strike": 605, "net_gex": 200000000},
        ]),
    },
    {
        "symbol": "SPY",
        "snapshot_date": (date.today() - timedelta(days=2)).isoformat(),
        "spot_price": 582.30,
        "flip_point": 580.0,
        "regime": "negative",
        "total_gex": -1200000000,
        "strikes_json": json.dumps([
            {"strike": 565, "net_gex": -900000000}, {"strike": 570, "net_gex": -700000000},
            {"strike": 575, "net_gex": -500000000}, {"strike": 580, "net_gex": -200000000},
            {"strike": 585, "net_gex": 100000000}, {"strike": 590, "net_gex": 500000000},
            {"strike": 595, "net_gex": 300000000}, {"strike": 600, "net_gex": 200000000},
            {"strike": 605, "net_gex": 100000000}, {"strike": 610, "net_gex": 50000000},
        ]),
    },
    {
        "symbol": "SPY",
        "snapshot_date": (date.today() - timedelta(days=3)).isoformat(),
        "spot_price": 585.00,
        "flip_point": 584.5,
        "regime": "positive",
        "total_gex": 150000000,
        "strikes_json": json.dumps([
            {"strike": 570, "net_gex": -500000000}, {"strike": 575, "net_gex": -350000000},
            {"strike": 580, "net_gex": -150000000}, {"strike": 584, "net_gex": -20000000},
            {"strike": 585, "net_gex": 80000000}, {"strike": 590, "net_gex": 450000000},
            {"strike": 595, "net_gex": 300000000}, {"strike": 600, "net_gex": 200000000},
            {"strike": 605, "net_gex": 100000000}, {"strike": 610, "net_gex": 50000000},
        ]),
    },
    {
        "symbol": "SPY",
        "snapshot_date": (date.today() - timedelta(days=5)).isoformat(),
        "spot_price": 578.90,
        "flip_point": 582.0,
        "regime": "negative",
        "total_gex": -2500000000,
        "strikes_json": json.dumps([
            {"strike": 560, "net_gex": -1100000000}, {"strike": 565, "net_gex": -800000000},
            {"strike": 570, "net_gex": -600000000}, {"strike": 575, "net_gex": -350000000},
            {"strike": 580, "net_gex": -100000000}, {"strike": 585, "net_gex": 200000000},
            {"strike": 590, "net_gex": 500000000}, {"strike": 595, "net_gex": 300000000},
            {"strike": 600, "net_gex": 200000000}, {"strike": 605, "net_gex": 100000000},
        ]),
    },
]


class HistoryService:
    def __init__(self):
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        conn = self._get_conn()
        try:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS gex_snapshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    symbol TEXT NOT NULL,
                    snapshot_date TEXT NOT NULL,
                    spot_price REAL NOT NULL,
                    flip_point REAL NOT NULL,
                    regime TEXT NOT NULL,
                    total_gex REAL NOT NULL,
                    strikes_json TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    UNIQUE(symbol, snapshot_date)
                )
            """)
            conn.commit()

            # Seed sample data if table is empty
            from ..config import get_settings
            count = conn.execute("SELECT COUNT(*) FROM gex_snapshots").fetchone()[0]
            if count == 0 and get_settings().data_source == "sample":
                for snap in SAMPLE_SNAPSHOTS:
                    conn.execute(
                        """INSERT OR IGNORE INTO gex_snapshots
                           (symbol, snapshot_date, spot_price, flip_point, regime, total_gex, strikes_json)
                           VALUES (?, ?, ?, ?, ?, ?, ?)""",
                        (snap["symbol"], snap["snapshot_date"], snap["spot_price"],
                         snap["flip_point"], snap["regime"], snap["total_gex"], snap["strikes_json"]),
                    )
                conn.commit()
                logger.info(f"Seeded {len(SAMPLE_SNAPSHOTS)} sample snapshots")
        finally:
            conn.close()

    def save_snapshot(self, symbol: str, gex_data: GexResponse) -> bool:
        """Save (or refresh) today's GEX profile as a daily snapshot. Returns True if new.

        Sample-data results are never persisted — they would pollute the live history.
        """
        if gex_data.data_source != "schwab":
            return False
        today = date.today().isoformat()
        strikes = [
            {"strike": s.strike, "net_gex": s.net_gex}
            for s in sorted(gex_data.strikes, key=lambda x: x.strike)
        ]
        conn = self._get_conn()
        try:
            conn.execute(
                """INSERT INTO gex_snapshots
                   (symbol, snapshot_date, spot_price, flip_point, regime, total_gex, strikes_json)
                   VALUES (?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(symbol, snapshot_date) DO UPDATE SET
                     spot_price=excluded.spot_price, flip_point=excluded.flip_point,
                     regime=excluded.regime, total_gex=excluded.total_gex,
                     strikes_json=excluded.strikes_json, created_at=datetime('now')""",
                (symbol.upper(), today, gex_data.spot_price, gex_data.flip_point,
                 gex_data.regime.type, gex_data.total_gex, json.dumps(strikes)),
            )
            conn.commit()
            return conn.total_changes > 0  # insert or refresh
        finally:
            conn.close()

    def get_available_dates(self, symbol: str) -> list[str]:
        conn = self._get_conn()
        try:
            rows = conn.execute(
                "SELECT snapshot_date FROM gex_snapshots WHERE symbol = ? ORDER BY snapshot_date DESC",
                (symbol.upper(),),
            ).fetchall()
            return [r["snapshot_date"] for r in rows]
        finally:
            conn.close()

    def get_snapshot(self, symbol: str, snapshot_date: str) -> Optional[dict]:
        conn = self._get_conn()
        try:
            row = conn.execute(
                "SELECT * FROM gex_snapshots WHERE symbol = ? AND snapshot_date = ?",
                (symbol.upper(), snapshot_date),
            ).fetchone()
            if not row:
                return None
            return {
                "date": row["snapshot_date"],
                "spot_price": row["spot_price"],
                "flip_point": row["flip_point"],
                "regime": row["regime"],
                "total_gex": row["total_gex"],
                "strikes": json.loads(row["strikes_json"]),
            }
        finally:
            conn.close()

    def get_comparison(self, symbol: str, current_data: GexResponse, historical_date: str) -> Optional[dict]:
        historical = self.get_snapshot(symbol, historical_date)
        if not historical:
            return None

        current_strikes = [
            {"strike": s.strike, "net_gex": s.net_gex}
            for s in sorted(current_data.strikes, key=lambda x: x.strike)
        ]

        return {
            "current": {
                "date": date.today().isoformat(),
                "flip_point": current_data.flip_point,
                "regime": current_data.regime.type,
                "total_gex": current_data.total_gex,
                "spot_price": current_data.spot_price,
            },
            "historical": {
                "date": historical["date"],
                "flip_point": historical["flip_point"],
                "regime": historical["regime"],
                "total_gex": historical["total_gex"],
                "spot_price": historical["spot_price"],
            },
            "changes": {
                "flip_point_shift": current_data.flip_point - historical["flip_point"],
                "regime_changed": current_data.regime.type != historical["regime"],
                "total_gex_change": current_data.total_gex - historical["total_gex"],
                "spot_change": current_data.spot_price - historical["spot_price"],
            },
            "current_strikes": current_strikes,
            "historical_strikes": historical["strikes"],
        }


# Singleton
_service: Optional[HistoryService] = None


def get_history_service() -> HistoryService:
    global _service
    if _service is None:
        _service = HistoryService()
    return _service
