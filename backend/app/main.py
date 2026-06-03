from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import vtt, dice, maps, media, users, campaigns, characters, item_templates
from app.websockets.router import router as ws_router
from app.database import Base, engine
from app.models import AdventureCampaign, CampaignParticipant, Dnd5e2014CharacterSheet, ItemTemplate, Tormenta20CharacterSheet, User
from app.models.campaign import DEFAULT_GAME_SYSTEM, GAME_SYSTEM_ALIASES
from config import CORS_ORIGINS


def ensure_sqlite_schema_updates():
    if engine.dialect.name != "sqlite":
        return

    with engine.begin() as connection:
        columns = [column[1] for column in connection.exec_driver_sql("PRAGMA table_info(adventure_campaigns)")]
        if "thumbnail" not in columns:
            connection.exec_driver_sql("ALTER TABLE adventure_campaigns ADD COLUMN thumbnail VARCHAR")
        connection.exec_driver_sql(
            "UPDATE adventure_campaigns SET game_system = ? WHERE game_system IS NULL OR game_system = ?",
            (DEFAULT_GAME_SYSTEM, "D&D 5e"),
        )
        for legacy_value, normalized_value in GAME_SYSTEM_ALIASES.items():
            connection.exec_driver_sql(
                "UPDATE adventure_campaigns SET game_system = ? WHERE game_system = ?",
                (normalized_value, legacy_value),
            )
        dnd_columns = [column[1] for column in connection.exec_driver_sql("PRAGMA table_info(dnd5e_2014_character_sheets)")]
        if dnd_columns and "sheet_data" not in dnd_columns:
            connection.exec_driver_sql("ALTER TABLE dnd5e_2014_character_sheets ADD COLUMN sheet_data JSON NOT NULL DEFAULT '{}'")
        item_template_columns = [column[1] for column in connection.exec_driver_sql("PRAGMA table_info(item_templates)")]
        if item_template_columns and "character_id" not in item_template_columns:
            connection.exec_driver_sql("ALTER TABLE item_templates ADD COLUMN character_id INTEGER")


# Create tables
Base.metadata.create_all(bind=engine)
ensure_sqlite_schema_updates()

app = FastAPI(title="VTT Backend", version="1.0.0")

# CORS for localhost frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(vtt.router)
app.include_router(dice.router)
app.include_router(maps.router)
app.include_router(media.router)
app.include_router(users.router)
app.include_router(campaigns.router)
app.include_router(characters.router)
app.include_router(item_templates.router)
app.include_router(ws_router)
